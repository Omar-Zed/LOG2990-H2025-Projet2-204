import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { PopupColor } from '@app/interfaces/popup';
import { SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';

@Component({
    selector: 'app-warning-confirmation-popup',
    templateUrl: './warning-confirmation-popup.component.html',
    styleUrls: ['./warning-confirmation-popup.component.scss'],
})
export class WarningConfirmationPopupComponent {
    @Input() message: string = '';
    @Input() hasCloseButton: boolean = false;
    @Input() isConfirmation: boolean = false;
    @Input() popupColor: PopupColor = PopupColor.Orange;
    @Output() closed = new EventEmitter<boolean>();
    private readonly audioService: AudioService = inject(AudioService);

    onConfirm() {
        this.audioService.playEffect(SoundEffect.Click);
        this.closed.emit(true);
    }

    onCancel() {
        this.audioService.playEffect(SoundEffect.Click);
        this.closed.emit(false);
    }
}
