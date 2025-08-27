import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { DEFAULT_CHARACTER_VISUAL_DATA } from '@app/consts/player-data.const';
import { PopupMessage } from '@app/consts/popup-message.const';
import { CharacterVisualData } from '@app/interfaces/character-visual-data';
import { SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { LobbyService } from '@app/services/lobby/lobby.service';
import { MatchService } from '@app/services/match/match.service';
import { PopupService } from '@app/services/popup/popup.service';
import { AVATAR_DATA, MAX_SELECTABLE_AVATAR_INDEX, MIN_SELECTABLE_AVATAR_INDEX } from '@common/consts/avatar-data.const';
import { BONUS_STAT, DEFAULT_STAT, MAX_NAME_LENGTH, MIN_NAME_LENGTH } from '@common/consts/player-data.const';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { Avatar, DiceType, PlayerData } from '@common/interfaces/player-data';

@Component({
    selector: 'app-character-page',
    imports: [ReactiveFormsModule, HeaderComponent, CommonModule, FormsModule],
    templateUrl: './character-page.component.html',
    styleUrl: './character-page.component.scss',
})
export class CharacterPageComponent {
    nameForm: FormControl = new FormControl('', [Validators.required, Validators.minLength(MIN_NAME_LENGTH), Validators.maxLength(MAX_NAME_LENGTH)]);
    visualData: CharacterVisualData = structuredClone(DEFAULT_CHARACTER_VISUAL_DATA);
    readonly audioService: AudioService = inject(AudioService);
    readonly clickValue = SoundEffect.Click;
    private matchService: MatchService = inject(MatchService);
    private popupService: PopupService = inject(PopupService);
    private lobbyService: LobbyService = inject(LobbyService);
    private router: Router = inject(Router);

    constructor() {
        if (this.matchService.isInMatch()) {
            this.updateAvatarList();
            this.matchService.matchUpdate.pipe(takeUntilDestroyed()).subscribe(this.updateAvatarList.bind(this));
        } else {
            this.router.navigate([PageEndpoint.Menu]);
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.joinLobby();
        }
    }

    goToMenu() {
        this.audioService.playEffect(SoundEffect.Click);
        this.popupService.showPopup({
            message: PopupMessage.Quit,
            hasCloseButton: true,
            isConfirmation: true,
            action: this.matchService.leaveMatch.bind(this.matchService),
        });
    }

    toggleBonusDice() {
        this.audioService.playEffect(SoundEffect.Click);
        this.visualData.isAttackSelected = !this.visualData.isAttackSelected;
    }

    joinLobby() {
        this.audioService.playEffect(SoundEffect.Click);
        const warnings = this.getWarnings();
        if (warnings.length > 0) {
            this.popupService.showPopup({
                message: warnings.join('\n'),
                hasCloseButton: true,
                isConfirmation: false,
            });
        } else {
            const playerData = this.getPlayerData();
            this.lobbyService.joinLobby(playerData);
        }
    }

    changeAvatar(avatar: Avatar) {
        this.audioService.playEffect(SoundEffect.Click);
        const lockedAvatars = this.getLockedAvatars();
        if (!lockedAvatars.includes(avatar)) {
            this.lobbyService.changeAvatar(avatar);
        }
    }

    private updateAvatarList() {
        const selfAvatar = this.matchService.selfPlayer.avatar;
        const lockedAvatars = this.getLockedAvatars();

        this.visualData.selfAvatarimage = AVATAR_DATA[selfAvatar].image;
        this.visualData.isAvatarSelected = selfAvatar !== Avatar.Default;
        this.visualData.avatarList = Object.values(Avatar)
            .slice(MIN_SELECTABLE_AVATAR_INDEX, MAX_SELECTABLE_AVATAR_INDEX)
            .map((avatar) => ({
                avatar,
                name: AVATAR_DATA[avatar].name,
                image: AVATAR_DATA[avatar].imageCentered,
                isLocked: lockedAvatars.includes(avatar),
                isSelected: selfAvatar === avatar,
            }));
    }

    private getLockedAvatars(): Avatar[] {
        return this.matchService.data.players.filter((_, i) => i !== this.matchService.selfIndex).map((p) => p.avatar);
    }

    private getPlayerData(): PlayerData {
        const playerData = this.matchService.selfPlayer;
        playerData.name = this.nameForm.value.toUpperCase().trim();
        playerData.health = this.visualData.isHpSelected ? BONUS_STAT : DEFAULT_STAT;
        playerData.speed = this.visualData.isHpSelected ? DEFAULT_STAT : BONUS_STAT;
        playerData.attackDice = this.visualData.isAttackSelected ? DiceType.D6 : DiceType.D4;
        playerData.defenseDice = this.visualData.isAttackSelected ? DiceType.D4 : DiceType.D6;
        return playerData;
    }

    private getWarnings() {
        const warningList = [];
        if (!this.nameForm.valid) {
            warningList.push('Le nom doit contenir entre 3 et 15 caractères');
        }
        if (this.matchService.selfPlayer.avatar === Avatar.Default) {
            warningList.push('Veuillez choisir un avatar');
        }
        return warningList;
    }
}
