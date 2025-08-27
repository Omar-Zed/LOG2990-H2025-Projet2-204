import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { GameSaveService } from '@app/services/game-save/game-save.service';
import { MatchService } from '@app/services/match/match.service';
import { PopupService } from '@app/services/popup/popup.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { GameData } from '@common/interfaces/game-data';
import { MOCK_GAME_DATAS } from '@common/test-consts/mock-games';
import { of, throwError } from 'rxjs';
import { CreatePageComponent } from './create-page.component';
import { AudioService } from '@app/services/audio/audio.service';

@Component({
    selector: 'app-game-card',
    standalone: true,
    template: '',
})
class MockGameCardComponent {
    @Input() game: GameData = structuredClone(MOCK_GAME_DATAS[0]);
    @Input() isAdminView: boolean = false;
    @Input() cardColor: string = 'blue-card';
}

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameSaveServiceSpy: jasmine.SpyObj<GameSaveService>;
    let matchServiceSpy: jasmine.SpyObj<MatchService>;
    let popupServiceSpy: jasmine.SpyObj<PopupService>;
    let mockAudioService: jasmine.SpyObj<AudioService>;
    let mockGames: GameData[];

    beforeEach(async () => {
        mockGames = structuredClone(MOCK_GAME_DATAS);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameSaveServiceSpy = jasmine.createSpyObj('GameSaveService', ['getAllGames', 'getGame']);
        gameSaveServiceSpy.getAllGames.and.returnValue(of(mockGames));
        matchServiceSpy = jasmine.createSpyObj('MatchService', ['createMatch']);
        popupServiceSpy = jasmine.createSpyObj('PopupService', ['showPopup']);
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'playBackgroundMusic', 'preloadEffectsForPage', 'playCombatEffect']);

        await TestBed.configureTestingModule({
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: GameSaveService, useValue: gameSaveServiceSpy },
                { provide: MatchService, useValue: matchServiceSpy },
                { provide: PopupService, useValue: popupServiceSpy },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        TestBed.overrideComponent(CreatePageComponent, {
            add: { imports: [MockGameCardComponent] },
            remove: { imports: [GameCardComponent] },
        });

        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create match call create match', () => {
        component.createMatch(mockGames[0]);
        expect(matchServiceSpy.createMatch).toHaveBeenCalled();
    });

    it('should load games on init', () => {
        component.ngOnInit();
        expect(component.games).toEqual(mockGames);
    });

    it('should navigate to menu when navigate to menu is called', () => {
        component.navigateToMenu();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Menu]);
    });

    it('should return correct card color', () => {
        expect(component.getCardColor(0)).toBe('blue-card');
        expect(component.getCardColor(1)).toBe('green-card');
        expect(component.getCardColor(2)).toBe('pink-card');
    });

    it('should handle error when loadGames fails', () => {
        const errorResponse = new HttpErrorResponse({ error: 'Error', status: 500 });
        gameSaveServiceSpy.getAllGames.and.returnValue(throwError(() => errorResponse));
        component['loadGames']();
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
    });
});
