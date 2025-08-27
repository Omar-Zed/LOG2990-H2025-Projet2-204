import { TestBed } from '@angular/core/testing';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { MatchData } from '@common/interfaces/match-data';
import { SOUND_EFFECTS_MAP } from './audio.const';
import { AudioService } from './audio.service';

describe('AudioService', () => {
    let service: AudioService;
    let audioElementSpy: jasmine.SpyObj<HTMLAudioElement>;
    let effectAudioSpy: jasmine.SpyObj<HTMLAudioElement>;

    beforeEach(() => {
        audioElementSpy = jasmine.createSpyObj('HTMLAudioElement', ['play', 'pause', 'load'], {
            volume: 0,
            currentTime: 0,
            paused: false,
        });

        audioElementSpy.play = jasmine.createSpy('play').and.returnValue(Promise.resolve());

        effectAudioSpy = jasmine.createSpyObj('HTMLAudioElement', ['play', 'load'], {
            volume: 0,
            currentTime: 0,
        });

        effectAudioSpy.play = jasmine.createSpy('play').and.returnValue(Promise.resolve());

        spyOn(window, 'Audio').and.returnValue(audioElementSpy);

        TestBed.configureTestingModule({
            providers: [AudioService],
        });

        service = TestBed.inject(AudioService);

        service['backgroundMusic'] = null;
        service['effects'] = new Map<SoundEffect, HTMLAudioElement>();
        service['currentTrack'] = null;
        service['previousLogSize'] = 0;

        audioElementSpy.load.calls.reset();
        (window.Audio as unknown as jasmine.Spy).calls.reset();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize properties correctly', () => {
        expect(service['backgroundMusic']).toBeNull();
        expect(service['effects']).toBeDefined();
        expect(service['effects'].size).toBe(0);
        expect(service['currentTrack']).toBeNull();
        expect(service['previousLogSize']).toBe(0);
    });

    it('should preload click effect in constructor', () => {
        new AudioService();
        expect(window.Audio).toHaveBeenCalledWith(`assets/audio/effects/${SOUND_EFFECTS_MAP[SoundEffect.Click]}`);
    });

    it('should preload effects for a page', () => {
        const testEffects = [SoundEffect.Click, SoundEffect.Heal];

        service.preloadEffectsForPage(testEffects);

        expect(window.Audio).toHaveBeenCalledTimes(2);
        expect(window.Audio).toHaveBeenCalledWith(`assets/audio/effects/${SOUND_EFFECTS_MAP[SoundEffect.Click]}`);
        expect(window.Audio).toHaveBeenCalledWith(`assets/audio/effects/${SOUND_EFFECTS_MAP[SoundEffect.Heal]}`);

        expect(audioElementSpy.load).toHaveBeenCalledTimes(2);
        expect(service['effects'].size).toBe(2);
    });

    it('should not reload effects that are already loaded', () => {
        service['effects'].set(SoundEffect.Click, effectAudioSpy);
        service.preloadEffectsForPage([SoundEffect.Click]);
        expect(window.Audio).not.toHaveBeenCalled();
    });

    it('should not restart the same track if already playing', () => {
        service['currentTrack'] = BackgroundMusic.Home;
        service['backgroundMusic'] = audioElementSpy;
        Object.defineProperty(audioElementSpy, 'paused', { get: () => false });

        audioElementSpy.play.calls.reset();
        (window.Audio as unknown as jasmine.Spy).calls.reset();

        service.playBackgroundMusic(BackgroundMusic.Home);

        expect(window.Audio).not.toHaveBeenCalled();
        expect(audioElementSpy.play).not.toHaveBeenCalled();
        expect(audioElementSpy.pause).not.toHaveBeenCalled();
    });

    it('should stop current track before playing a new one', () => {
        service['backgroundMusic'] = audioElementSpy;

        service.playBackgroundMusic(BackgroundMusic.Play);

        expect(audioElementSpy.pause).toHaveBeenCalled();
        expect(audioElementSpy.currentTime).toBe(0);
        expect(audioElementSpy.play).toHaveBeenCalled();
    });

    it('should handle play errors for background music', () => {
        audioElementSpy.play.and.returnValue(Promise.reject('Autoplay prevented'));
        expect(() => service.playBackgroundMusic(BackgroundMusic.Home)).not.toThrow();
    });

    it('should play a preloaded effect', () => {
        service['effects'].set(SoundEffect.Click, effectAudioSpy);
        service.playEffect(SoundEffect.Click);
        expect(effectAudioSpy.currentTime).toBe(0);
        expect(effectAudioSpy.play).toHaveBeenCalled();
    });

    it('should do nothing if effect is not preloaded', () => {
        service.playEffect(SoundEffect.Click);
        expect(effectAudioSpy.play).not.toHaveBeenCalled();
    });

    it('should handle play errors for sound effects', () => {
        service['effects'].set(SoundEffect.Click, effectAudioSpy);
        effectAudioSpy.play.and.returnValue(Promise.reject('Autoplay prevented'));
        expect(() => service.playEffect(SoundEffect.Click)).not.toThrow();
    });

    it('should restart same track if it was paused', () => {
        service['currentTrack'] = BackgroundMusic.Home;
        service['backgroundMusic'] = audioElementSpy;
        Object.defineProperty(audioElementSpy, 'paused', { get: () => true });

        service.playBackgroundMusic(BackgroundMusic.Home);

        expect(audioElementSpy.pause).toHaveBeenCalled();
        expect(audioElementSpy.play).toHaveBeenCalled();
    });

    it('should not play effects when no new logs are present', () => {
        service['effects'].set(SoundEffect.Attack, effectAudioSpy);
        service['effects'].set(SoundEffect.Flee, effectAudioSpy);
        service['effects'].set(SoundEffect.Death, effectAudioSpy);
        service['previousLogSize'] = 2;
        const matchData = {
            logData: [{ content: 'Un seul log' }],
        } as MatchData;

        effectAudioSpy.play.calls.reset();
        service.playCombatEffect(matchData);
        expect(effectAudioSpy.play).not.toHaveBeenCalled();
    });

    it('should not play effects when logs length equals previousLogSize', () => {
        service['effects'].set(SoundEffect.Attack, effectAudioSpy);
        service['previousLogSize'] = 1;
        const matchData = {
            logData: [{ content: 'Le seul log' }],
        } as MatchData;

        effectAudioSpy.play.calls.reset();
        service.playCombatEffect(matchData);
        expect(effectAudioSpy.play).not.toHaveBeenCalled();
    });

    it('should play attack effect when log includes "inflige"', () => {
        service['effects'].set(SoundEffect.Attack, effectAudioSpy);

        const matchData = {
            logData: [{ content: 'Le joueur attaque et inflige 10 dégâts' }],
        } as MatchData;

        service.playCombatEffect(matchData);

        expect(effectAudioSpy.play).toHaveBeenCalledTimes(1);
    });

    it('should play escape effect when log includes "s\'est enfui"', () => {
        service['effects'].set(SoundEffect.Flee, effectAudioSpy);

        const matchData = {
            logData: [{ content: "Le joueur s'est enfui du combat" }],
        } as MatchData;

        service.playCombatEffect(matchData);

        expect(effectAudioSpy.play).toHaveBeenCalledTimes(1);
    });

    it('should play death effect when log includes "gagné le combat"', () => {
        service['backgroundMusic'] = audioElementSpy;

        service['effects'].set(SoundEffect.Death, effectAudioSpy);

        const matchData = {
            logData: [{ content: 'gagné le combat' }],
        } as MatchData;

        service.playCombatEffect(matchData);

        expect(effectAudioSpy.play).toHaveBeenCalledTimes(1);
    });

    it('should update previousLogSize after processing', () => {
        const matchData = {
            logData: [{ content: 'Un nouveau message' }, { content: 'Un autre message' }],
        } as MatchData;

        service.playCombatEffect(matchData);

        expect(service['previousLogSize']).toBe(2);
    });

    it('should set volumes with default parameters', () => {
        service['backgroundMusic'] = audioElementSpy;
        service['effects'].set(SoundEffect.Click, effectAudioSpy);
        service.setVolumes();
        expect(audioElementSpy.volume).toBeDefined();
        expect(effectAudioSpy.volume).toBeDefined();
    });

    it('should set volumes with custom parameters', () => {
        service['backgroundMusic'] = audioElementSpy;
        service['effects'].set(SoundEffect.Click, effectAudioSpy);
        service['effects'].set(SoundEffect.Heal, effectAudioSpy);

        const testMusicVolume = 0.3;
        const testEffectsVolume = 0.7;
        service.setVolumes(testMusicVolume, testEffectsVolume);
        expect(audioElementSpy.volume).toBeDefined();
        expect(effectAudioSpy.volume).toBeDefined();
    });
});
