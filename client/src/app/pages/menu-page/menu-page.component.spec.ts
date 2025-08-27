import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { MenuPageComponent } from './menu-page.component';

describe('MenuPageComponent', () => {
    let component: MenuPageComponent;
    let fixture: ComponentFixture<MenuPageComponent>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        mockAudioService = jasmine.createSpyObj('AudioService', ['playBackgroundMusic', 'playEffect', 'setVolumes']);

        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot([]), MenuPageComponent],
            providers: [{ provide: AudioService, useValue: mockAudioService }],
        }).compileComponents();

        fixture = TestBed.createComponent(MenuPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should play background music on first mousedown', () => {
        component.onMouseDown();

        expect(mockAudioService.playBackgroundMusic).toHaveBeenCalledWith(BackgroundMusic.Home);
        expect(mockAudioService.setVolumes).toHaveBeenCalled();
        expect(component.isMusicStarted).toBeTrue();
        expect(component.isFirstTime).toBeFalse();
    });

    it('should not replay music if already started', () => {
        component.isMusicStarted = true;
        mockAudioService.playBackgroundMusic.calls.reset();

        component.onMouseDown();

        expect(mockAudioService.playBackgroundMusic).not.toHaveBeenCalled();
        expect(component.isFirstTime).toBeFalse();
    });

    it('should disable sound when disableSound is called', () => {
        component.disableSound();

        expect(mockAudioService.playEffect).toHaveBeenCalledWith(component.clickValue);
        expect(mockAudioService.setVolumes).toHaveBeenCalledWith(0, 0);
        expect(component.isMusicStarted).toBeFalse();
    });

    it('should have correct initial values', () => {
        expect(component.isMusicStarted).toBeFalse();
        expect(component.isFirstTime).toBeTrue();
        expect(component.clickValue).toBe(SoundEffect.Click);
    });
});
