import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SoundEffect } from '@app/interfaces/sound-service';
import { VisibilityEvent } from '@app/interfaces/visibility-event';
import { AudioService } from '@app/services/audio/audio.service';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { ThumbnailService } from '@app/services/thumbnail/thumbnail.service';
import { GameData } from '@common/interfaces/game-data';

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
    imports: [FormsModule, CommonModule],
    standalone: true,
})
export class GameCardComponent implements AfterViewInit {
    @Input() game: GameData;
    @Input() isAdminView: boolean = false;
    @Input() cardColor: string = 'blue-card';
    @Output() edit = new EventEmitter<string>();
    @Output() delete = new EventEmitter<string>();
    @Output() toggleVisibility = new EventEmitter<VisibilityEvent>();
    @Output() join = new EventEmitter<string>();

    isHovered: boolean = false;
    thumbnailUrl: string = '';
    private audioService: AudioService = inject(AudioService);
    private thumbnailService: ThumbnailService = inject(ThumbnailService);
    private gameDataService: GameDataService = inject(GameDataService);

    ngAfterViewInit() {
        setTimeout(this.generateThumbnail.bind(this), 1);
    }

    onEdit() {
        this.audioService.playEffect(SoundEffect.Click);
        this.gameDataService.setGameData(this.game);
        this.edit.emit(this.game._id);
    }
    onDelete() {
        this.audioService.playEffect(SoundEffect.Click);
        this.delete.emit(this.game._id);
    }

    onToggleVisibility() {
        this.audioService.playEffect(SoundEffect.Click);
        this.toggleVisibility.emit({ id: this.game._id, isVisible: this.game.isVisible });
        this.game.isVisible = !this.game.isVisible;
    }

    onJoin() {
        this.audioService.playEffect(SoundEffect.Click);
        this.join.emit(this.game._id);
    }

    onMouseEnter() {
        this.isHovered = true;
    }

    onMouseLeave() {
        this.isHovered = false;
    }

    formatDate(dateString: string | Date): string {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    private async generateThumbnail() {
        this.thumbnailUrl = await this.thumbnailService.getThumbnail(this.game.mapData, true);
    }
}
