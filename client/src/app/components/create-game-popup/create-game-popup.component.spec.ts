import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AudioService } from '@app/services/audio/audio.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { GameMode, MapSize } from '@common/interfaces/map-data';
import { CreateGamePopupComponent } from './create-game-popup.component';

describe('CreateGamePopupComponent', () => {
    let component: CreateGamePopupComponent;
    let fixture: ComponentFixture<CreateGamePopupComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'preloadEffectsForPage']);

        await TestBed.configureTestingModule({
            imports: [CreateGamePopupComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGamePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize gameMode to FFA and mapSize to Small', () => {
        expect(component.gameMode).toBe(GameMode.FFA);
        expect(component.mapSize).toBe(MapSize.Small);
    });

    it('should update mapSize on onSizeSelection', () => {
        component.onSizeSelection(MapSize.Large);
        expect(component.mapSize).toBe(MapSize.Large);
    });

    it('should update gameMode on onModeSelection', () => {
        component.onModeSelection(GameMode.CTF);
        expect(component.gameMode).toBe(GameMode.CTF);
    });

    it('should navigate to edit page on onValiderSelection', () => {
        component.onValiderSelection();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Edit]);
    });
});
