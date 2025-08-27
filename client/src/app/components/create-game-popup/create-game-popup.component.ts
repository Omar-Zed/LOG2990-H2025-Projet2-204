import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PokeballButtonComponent } from '@app/components/pokeball-button/pokeball-button.component';
import { SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { GameMode, MapSize } from '@common/interfaces/map-data';

@Component({
    selector: 'app-create-game-popup',
    templateUrl: './create-game-popup.component.html',
    styleUrls: ['./create-game-popup.component.scss'],
    imports: [PokeballButtonComponent, NgClass],
})
export class CreateGamePopupComponent {
    gameMode: GameMode = GameMode.FFA;
    mapSize: MapSize = MapSize.Small;

    possibleModes = Object.entries(GameMode).map(([key, value]) => ({ key, value }));
    possibleSizes = Object.entries(MapSize)
        .filter(([, value]) => typeof value === 'number')
        .map(([key, value]) => ({ key, value: value as number }));

    private gameDataService: GameDataService = inject(GameDataService);
    private router: Router = inject(Router);
    private readonly audioService: AudioService = inject(AudioService);

    onSizeSelection(sizeKey: MapSize) {
        this.audioService.playEffect(SoundEffect.Click);
        this.mapSize = sizeKey;
    }

    onModeSelection(modeKey: GameMode) {
        this.audioService.playEffect(SoundEffect.Click);
        this.gameMode = modeKey;
    }

    onValiderSelection() {
        this.audioService.playEffect(SoundEffect.Click);
        this.gameDataService.createNewGame(this.mapSize, this.gameMode);
        this.router.navigate([PageEndpoint.Edit]);
    }
}
