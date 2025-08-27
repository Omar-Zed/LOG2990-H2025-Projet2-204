import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuButtonComponent } from '@app/components/menu-button/menu-button.component';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';

@Component({
    selector: 'app-menu-page',
    templateUrl: './menu-page.component.html',
    styleUrls: ['./menu-page.component.scss'],
    imports: [MenuButtonComponent, RouterModule],
})
export class MenuPageComponent {
    pageEndpoint = PageEndpoint;
    readonly audioService: AudioService = inject(AudioService);
    readonly clickValue = SoundEffect.Click;
    isMusicStarted = false;
    isFirstTime = true;

    onMouseDown() {
        if (!this.isMusicStarted) {
            this.audioService.playBackgroundMusic(BackgroundMusic.Home);
            this.audioService.setVolumes();
            this.isMusicStarted = true;
        }
        this.isFirstTime = false;
    }

    disableSound() {
        this.audioService.playEffect(this.clickValue);
        this.audioService.setVolumes(0, 0);
        this.isMusicStarted = false;
    }
}
