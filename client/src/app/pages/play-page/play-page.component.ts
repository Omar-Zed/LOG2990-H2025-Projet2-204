import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { ItemDropPopupComponent } from '@app/components/item-drop-popup/item-drop-popup.component';
import { ItemComponent } from '@app/components/item/item.component';
import { MapComponent } from '@app/components/map/map.component';
import { PlayerInfoPopupComponent } from '@app/components/player-info-popup/player-info-popup.component';
import { DEFAULT_PLAY_VISUAL_DATA } from '@app/consts/play-data.const';
import { PopupMessage } from '@app/consts/popup-message.const';
import { PlayVisualData } from '@app/interfaces/play-visual-data';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { PLAY_PAGE_EFFECT } from '@app/services/audio/audio.const';
import { AudioService } from '@app/services/audio/audio.service';
import { MapService } from '@app/services/map/map.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayService } from '@app/services/play/play.service';
import { PopupService } from '@app/services/popup/popup.service';
import { ThumbnailService } from '@app/services/thumbnail/thumbnail.service';
import { TileDescriptionService } from '@app/services/tile-description/tile-description.service';
import { AVATAR_DATA } from '@common/consts/avatar-data.const';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MatchState } from '@common/interfaces/match-data';

@Component({
    selector: 'app-play-page',
    templateUrl: './play-page.component.html',
    styleUrls: ['./play-page.component.scss'],
    imports: [MapComponent, CommonModule, ChatComponent, ItemComponent, ItemDropPopupComponent, PlayerInfoPopupComponent],
})
export class PlayPageComponent {
    showPlayerInfoPopup: boolean = false;
    descriptionPlayerIndex: number = 0;
    visualData: PlayVisualData = structuredClone(DEFAULT_PLAY_VISUAL_DATA);
    tileDescriptionService: TileDescriptionService = inject(TileDescriptionService);
    matchService: MatchService = inject(MatchService);
    playService: PlayService = inject(PlayService);
    private popupService: PopupService = inject(PopupService);
    private thumbnailService: ThumbnailService = inject(ThumbnailService);
    private mapService: MapService = inject(MapService);
    private router: Router = inject(Router);
    private readonly audioService: AudioService = inject(AudioService);
    private lastLogSize: number = 0;

    constructor() {
        if (this.matchService.isInMatch()) {
            this.matchService.matchUpdate.pipe(takeUntilDestroyed()).subscribe(this.onMatchUpdate.bind(this));
            this.onMatchUpdate();
            this.generateThumbnail();
        } else {
            this.router.navigate([PageEndpoint.Menu]);
        }
        this.audioService.preloadEffectsForPage(PLAY_PAGE_EFFECT);
        this.audioService.playBackgroundMusic(BackgroundMusic.Play);
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        const activeElement = document.activeElement as HTMLElement;
        const isChatFocused = activeElement.tagName === 'INPUT';
        const isDKeyPressed = event.key === 'd' || event.key === 'D';
        if (!isChatFocused && !event.repeat && isDKeyPressed) {
            this.playService.changeDebugMode();
        }
    }

    actionButton() {
        this.audioService.playEffect(SoundEffect.Click);
        if (this.mapService.hasActionOverlay()) {
            this.mapService.clearActions();
        } else if (this.visualData.canUseAction) {
            this.playService.displayActions();
        }
    }

    endTurnButton() {
        this.audioService.playEffect(SoundEffect.Click);
        if (this.visualData.canEndTurn) {
            this.playService.endTurn();
        }
    }

    surrenderButton() {
        this.audioService.playEffect(SoundEffect.Click);
        this.popupService.showPopup({
            message: PopupMessage.Surrender,
            hasCloseButton: true,
            isConfirmation: true,
            action: this.matchService.leaveMatch.bind(this.matchService),
        });
    }

    infoButton() {
        this.audioService.playEffect(SoundEffect.Click);
        this.showPlayerDescription(this.matchService.selfIndex);
    }

    showTileDescription(event: MouseEvent) {
        const clickedPlayerIndex = this.tileDescriptionService.displayTileDescription(event);
        // Explicit null check required because index 0 is valid but falsy
        if (clickedPlayerIndex !== null) {
            this.showPlayerDescription(clickedPlayerIndex);
        }
    }

    hideTileDescription() {
        this.tileDescriptionService.hideTileDescription();
    }

    hidePlayerDescription() {
        this.showPlayerInfoPopup = false;
    }

    showPlayerDescription(playerIndex: number) {
        this.showPlayerInfoPopup = true;
        this.descriptionPlayerIndex = playerIndex;
    }

    private onMatchUpdate() {
        const lastLog = this.matchService.data.logData[this.matchService.data.logData.length - 1];

        if (
            lastLog?.content.includes(this.matchService.selfPlayer.name) &&
            lastLog.content.includes('ramassé') &&
            this.lastLogSize !== this.matchService.data.logData.length
        ) {
            this.lastLogSize = this.matchService.data.logData.length;
            this.audioService.playEffect(SoundEffect.Item);
        }
        this.updateVisual();
        this.checkForRedirect();
    }

    private checkForRedirect() {
        const isSelfInCombat = this.matchService.data.combatData.playersCombatData.some((p) => p.playerIndex === this.matchService.selfIndex);
        const isMatchInCombatState = this.matchService.isState([MatchState.CombatWait, MatchState.CombatAnimation, MatchState.CombatEnd]);
        if (isSelfInCombat && isMatchInCombatState) {
            this.router.navigate([PageEndpoint.Combat]);
        } else if (this.matchService.isState([MatchState.Statistics])) {
            this.router.navigate([PageEndpoint.Stat]);
        }
    }

    private updateVisual() {
        this.visualData = {
            canUseAction: this.matchService.canUseAction(),
            canEndTurn: this.matchService.canEndTurn(),
            currentPlayerCount: this.matchService.data.players.filter((p) => p.isConnected).length,
            players: this.matchService.data.players.map((p, i) => ({
                id: p.id,
                name: p.name,
                avatarUrl: AVATAR_DATA[p.avatar].imageCentered,
                combatsWon: p.combatsWon,
                isHost: i === this.matchService.data.lobbyData.hostPlayerIndex,
                botType: p.type,
                isConnected: p.isConnected,
                team: p.team,
                hasFlag: p.items.includes(ItemType.Flag),
            })),
            selfAvatarUrl: AVATAR_DATA[this.matchService.selfPlayer.avatar].imageCentered,
            movementLeft: this.matchService.getMovementLeft(),
            thumbnailUrl: this.visualData.thumbnailUrl,
            isInventoryFull: this.matchService.isInventoryFull(),
        };
    }

    private async generateThumbnail() {
        const url = await this.thumbnailService.getThumbnail(this.matchService.data.gameData.mapData, false);
        this.visualData.thumbnailUrl = url;
    }
}
