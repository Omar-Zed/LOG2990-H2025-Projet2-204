import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from '@app/components/chat/chat.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { Order } from '@app/interfaces/stat-data';
import { PlayerStatType } from '@app/interfaces/stat-type.enum';
import { MatchService } from '@app/services/match/match.service';
import { StatService } from '@app/services/stat/stat.service';
import { AudioService } from '@app/services/audio/audio.service';
import { GameMode } from '@common/interfaces/map-data';
import { MatchData } from '@common/interfaces/match-data';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { MOCK_GLOBAL_STAT_DATA, MOCK_PLAYER_STAT_DATA, MOCK_WINNER_VISUAL_DATA } from '@common/test-consts/mock-stat-data';
import { Subject } from 'rxjs';
import { StatPageComponent } from './stat-page.component';

describe('StatPageComponent', () => {
    let component: StatPageComponent;
    let fixture: ComponentFixture<StatPageComponent>;
    let matchServiceSpy: jasmine.SpyObj<MatchService>;
    let statServiceSpy: jasmine.SpyObj<StatService>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    @Component({
        selector: 'app-chat',
        standalone: true,
        template: '',
    })
    class MockChatComponent {}

    beforeEach(async () => {
        matchServiceSpy = jasmine.createSpyObj('MatchService', ['leaveMatch', 'isInMatch'], {
            data: structuredClone(MOCK_MATCH_DATAS[0]),
            matchUpdate: new Subject<MatchData>(),
            selfPlayer: structuredClone(MOCK_PLAYER_DATAS[0]),
        });

        statServiceSpy = jasmine.createSpyObj('StatService', ['initializeData', 'sortPlayerStatsBy'], {
            playerStats: structuredClone(MOCK_PLAYER_STAT_DATA),
            globalStats: structuredClone(MOCK_GLOBAL_STAT_DATA),
            winnerData: structuredClone(MOCK_WINNER_VISUAL_DATA),
        });

        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'playBackgroundMusic', 'preloadEffectsForPage', 'playCombatEffect']);

        await TestBed.configureTestingModule({
            imports: [FormsModule, HeaderComponent, ChatComponent],
            providers: [
                { provide: MatchService, useValue: matchServiceSpy },
                { provide: StatService, useValue: statServiceSpy },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        TestBed.overrideComponent(StatPageComponent, {
            add: { imports: [MockChatComponent] },
            remove: { imports: [ChatComponent] },
        });

        matchServiceSpy.isInMatch.and.returnValue(true);
        fixture = TestBed.createComponent(StatPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component and call statService.initializeData on ngOnInit', () => {
        expect(component).toBeTruthy();
        expect(statServiceSpy.initializeData).toHaveBeenCalled();
    });
    it('should navigate to menu when not in match', () => {
        matchServiceSpy.isInMatch.and.returnValue(false);

        const navigateToMenuSpy = spyOn(StatPageComponent.prototype, 'navigateToMenu');

        fixture = TestBed.createComponent(StatPageComponent);
        component = fixture.componentInstance;

        expect(navigateToMenuSpy).toHaveBeenCalled();
    });

    it('should update sortingStat when updateSortingCriteria is called', () => {
        const newStatType = PlayerStatType.Victories;
        component['updateSortingCriteria'](newStatType);
        expect(component.sortingStat()).toBe(newStatType);
    });

    it('should toggle order correctly', () => {
        expect(component.sortingOrder()).toBe(Order.Ascending);
        component['toggleOrder']();
        expect(component.sortingOrder()).toBe(Order.Descending);
        component['toggleOrder']();
        expect(component.sortingOrder()).toBe(Order.Ascending);
    });

    it('should navigate to menu when navigateToMenu is called', () => {
        component.navigateToMenu();
        expect(matchServiceSpy.leaveMatch).toHaveBeenCalled();
    });

    it('should return true for isModeCTF when game mode is CTF', () => {
        matchServiceSpy.data.gameData.mapData.gameMode = GameMode.CTF;
        expect(component.isModeCTF()).toBeTrue();
    });

    it('should toggle order when stat type is the same', () => {
        const initialStatType = PlayerStatType.Combats;
        component.sortingStat.set(initialStatType);
        component.sortingOrder.set(Order.Ascending);

        component.updateSorting(initialStatType);

        expect(component.sortingStat()).toBe(initialStatType);
        expect(component.sortingOrder()).toBe(Order.Descending);
    });

    it('should reset order to ascending and update stat type when different stat type is selected', () => {
        const initialStatType = PlayerStatType.Combats;
        const newStatType = PlayerStatType.Victories;
        component.sortingStat.set(initialStatType);
        component.sortingOrder.set(Order.Descending);

        component.updateSorting(newStatType);

        expect(component.sortingStat()).toBe(newStatType);
        expect(component.sortingOrder()).toBe(Order.Ascending);
    });
});
