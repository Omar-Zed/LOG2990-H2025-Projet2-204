import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CreateBotPopupComponent } from '@app/components/bot-creation-popup/bot-creation-popup.component';
import { ChatComponent } from '@app/components/chat/chat.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { PlayerCardComponent } from '@app/components/player-card/player-card.component';
import { PokeballButtonComponent } from '@app/components/pokeball-button/pokeball-button.component';
import { DEFAULT_LOBBY_VISUAL_DATA } from '@app/consts/player-data.const';
import { PopupMessage } from '@app/consts/popup-message.const';
import { LobbyVisualData } from '@app/interfaces/lobby-visual-data';
import { SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { LobbyService } from '@app/services/lobby/lobby.service';
import { MatchService } from '@app/services/match/match.service';
import { PopupService } from '@app/services/popup/popup.service';
import { AVATAR_DATA } from '@common/consts/avatar-data.const';
import { MAX_PLAYERS } from '@common/consts/player-data.const';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { PlayerType } from '@common/interfaces/player-data';

@Component({
    selector: 'app-lobby-page',
    templateUrl: './lobby-page.component.html',
    styleUrls: ['./lobby-page.component.scss'],
    imports: [CommonModule, HeaderComponent, PlayerCardComponent, PokeballButtonComponent, ChatComponent, CreateBotPopupComponent],
    standalone: true,
})
export class LobbyPageComponent {
    visualData: LobbyVisualData = structuredClone(DEFAULT_LOBBY_VISUAL_DATA);
    matchService: MatchService = inject(MatchService);
    showBotPopup: boolean = false;
    private lobbyService: LobbyService = inject(LobbyService);
    private popupService: PopupService = inject(PopupService);
    private router: Router = inject(Router);
    private readonly audioService: AudioService = inject(AudioService);

    constructor() {
        if (this.matchService.isInMatch()) {
            this.updateVisual();
            this.matchService.matchUpdate.pipe(takeUntilDestroyed()).subscribe(this.updateVisual.bind(this));
        } else {
            this.router.navigate([PageEndpoint.Menu]);
        }
        this.updateVisual();
        this.matchService.matchUpdate.pipe(takeUntilDestroyed()).subscribe(this.updateVisual.bind(this));
    }

    @HostListener('document:keydown.escape')
    onEscapeKeydown() {
        if (this.showBotPopup) {
            this.showBotPopup = false;
        }
    }

    startMatchButton() {
        this.audioService.playEffect(SoundEffect.Click);
        this.lobbyService.startMatch();
    }

    leaveLobbyButton() {
        this.audioService.playEffect(SoundEffect.Click);
        this.popupService.showPopup({
            message: PopupMessage.Quit,
            hasCloseButton: true,
            isConfirmation: true,
            action: this.matchService.leaveMatch.bind(this.matchService),
        });
    }

    toggleLockRoom() {
        this.audioService.playEffect(SoundEffect.Click);
        this.lobbyService.changeLockStatus(!this.matchService.data.lobbyData.isLocked);
    }

    kickPlayer(playerId: string) {
        this.audioService.playEffect(SoundEffect.Click);
        this.lobbyService.kickPlayer(playerId);
    }

    copyMatchCode() {
        this.audioService.playEffect(SoundEffect.Click);
        this.copyToClipboard(this.matchService.data.code);
    }

    showBotCreationPopup() {
        this.audioService.playEffect(SoundEffect.Click);
        this.showBotPopup = true;
    }

    handleBotTypeSelected(botType: PlayerType) {
        this.lobbyService.addBot(botType);
        this.showBotPopup = false;
    }

    private copyToClipboard(text: string) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    private updateVisual() {
        this.visualData.isSelfHost = this.matchService.isHost();
        this.visualData.players = this.matchService.data.players
            .map((p, i) => ({
                isConnected: p.isConnected,
                name: p.name,
                isHost: i === this.matchService.data.lobbyData.hostPlayerIndex,
                isSelf: i === this.matchService.selfIndex,
                avatarImage: AVATAR_DATA[p.avatar].imageCentered,
                health: p.health,
                id: p.id,
                playerType: p.type,
            }))
            .filter((p) => p.isConnected);
        const playersVisualData = this.visualData.players;
        const maxPlayersCount = MAX_PLAYERS[this.matchService.data.gameData.mapData.size];
        while (playersVisualData.length < maxPlayersCount) {
            this.visualData.players.push({ ...this.visualData.players[0], isHost: false, isSelf: false, isConnected: false });
        }
    }
}
