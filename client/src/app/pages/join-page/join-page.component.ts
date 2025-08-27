import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { MatchService } from '@app/services/match/match.service';
import { MATCH_CODE_LENGTH } from '@common/consts/match-data.const';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';

@Component({
    selector: 'app-join-page',
    templateUrl: './join-page.component.html',
    styleUrls: ['./join-page.component.scss'],
    imports: [HeaderComponent, FormsModule],
})
export class JoinPageComponent implements OnInit {
    matchCode: string = '';
    codeLength: number = MATCH_CODE_LENGTH;
    readonly audioService: AudioService = inject(AudioService);
    readonly clickValue = SoundEffect.Click;
    private isJoiningMatch = false;
    private router: Router = inject(Router);
    private matchService: MatchService = inject(MatchService);

    ngOnInit() {
        this.audioService.playBackgroundMusic(BackgroundMusic.Home);
    }

    async joinMatch(event: KeyboardEvent) {
        const isJoinKey = event.key === 'Enter';

        if (isJoinKey && !this.isJoiningMatch) {
            const matchCode = this.matchCode;
            this.matchCode = '';
            this.isJoiningMatch = true;
            await this.matchService.joinMatch(matchCode);
            this.isJoiningMatch = false;
        }
    }

    navigateToMenu() {
        this.audioService.playEffect(SoundEffect.Click);
        this.router.navigate([PageEndpoint.Menu]);
    }
}
