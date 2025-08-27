import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AudioService } from '@app/services/audio/audio.service';
import { MatchService } from '@app/services/match/match.service';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { PlayerInfoPopupComponent } from './player-info-popup.component';

describe('PlayerInfoPopupComponent', () => {
    let component: PlayerInfoPopupComponent;
    let fixture: ComponentFixture<PlayerInfoPopupComponent>;
    let mockMatchService: jasmine.SpyObj<MatchService>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'preloadEffectsForPage']);
        mockMatchService = jasmine.createSpyObj('MatchService', [], {
            data: structuredClone(MOCK_MATCH_DATAS[0]),
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, PlayerInfoPopupComponent],
            providers: [
                { provide: MatchService, useValue: mockMatchService },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerInfoPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        component.closeButton();
        expect(component).toBeTruthy();
    });
});
