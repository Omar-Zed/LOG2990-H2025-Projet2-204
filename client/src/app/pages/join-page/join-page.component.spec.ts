import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { JoinPageComponent } from './join-page.component';
import { MatchService } from '@app/services/match/match.service';
import { AudioService } from '@app/services/audio/audio.service';

describe('JoinPageComponent', () => {
    let component: JoinPageComponent;
    let fixture: ComponentFixture<JoinPageComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let matchServiceSpy: jasmine.SpyObj<MatchService>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        matchServiceSpy = jasmine.createSpyObj('MatchService', ['joinMatch']);
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'playBackgroundMusic', 'preloadEffectsForPage', 'playCombatEffect']);

        await TestBed.configureTestingModule({
            imports: [FormsModule, HeaderComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatchService, useValue: matchServiceSpy },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should join match on enter key press', () => {
        const mockEvent = new KeyboardEvent('Enter', { key: 'Enter' });
        component.joinMatch(mockEvent);
        expect(matchServiceSpy.joinMatch).toHaveBeenCalled();
    });

    it('should navigate to menu when navigateToMenu is called', () => {
        component.navigateToMenu();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Menu]);
    });
});
