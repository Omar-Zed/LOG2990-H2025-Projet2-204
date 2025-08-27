import { NgClass } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { PokeballButtonComponent } from '@app/components/pokeball-button/pokeball-button.component';
import { SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { PlayerType } from '@common/interfaces/player-data';

@Component({
    selector: 'app-create-bot-popup',
    templateUrl: './bot-creation-popup.component.html',
    styleUrls: ['./bot-creation-popup.component.scss'],
    imports: [PokeballButtonComponent, NgClass],
    standalone: true,
})
export class CreateBotPopupComponent {
    @Output() botTypeSelected = new EventEmitter<PlayerType>();
    selectedProfile: PlayerType = PlayerType.BotAggressive;
    playerType = PlayerType;
    private readonly audioService: AudioService = inject(AudioService);

    onProfileSelection(profile: PlayerType) {
        this.audioService.playEffect(SoundEffect.Click);
        this.selectedProfile = profile;
    }

    onValiderSelection() {
        this.audioService.playEffect(SoundEffect.Click);
        this.botTypeSelected.emit(this.selectedProfile);
    }
}
