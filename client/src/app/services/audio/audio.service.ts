import { Injectable } from '@angular/core';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { MatchData } from '@common/interfaces/match-data';
import { AUDIO_CONFIG, SOUND_EFFECTS_MAP } from './audio.const';

@Injectable({
    providedIn: 'root',
})
export class AudioService {
    private backgroundMusic: HTMLAudioElement | null = null;
    private effects: Map<SoundEffect, HTMLAudioElement> = new Map();
    private currentTrack: BackgroundMusic | null = null;
    private previousLogSize = 0;
    private backgroundVolume = AUDIO_CONFIG.musicVolume;
    private effectsVolume = AUDIO_CONFIG.effectsVolume;

    constructor() {
        this.preloadEffectsForPage([SoundEffect.Click]);
    }

    preloadEffectsForPage(effects: SoundEffect[]): void {
        effects.forEach((effect) => {
            if (!this.effects.has(effect)) {
                const path = SOUND_EFFECTS_MAP[effect];
                const audio = new Audio(`assets/audio/effects/${path}`);
                audio.load();
                this.effects.set(effect, audio);
            }
        });
    }

    playBackgroundMusic(music: BackgroundMusic): void {
        this.previousLogSize = 0;
        if (this.currentTrack === music && this.backgroundMusic && !this.backgroundMusic.paused) {
            return;
        }

        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }

        const fullPath = `assets/audio/music/${music}`;
        const audio = new Audio(fullPath);
        audio.loop = true;
        audio.volume = this.backgroundVolume;

        audio.play().catch((error) => {
            return error;
        });

        this.backgroundMusic = audio;
        this.currentTrack = music;
    }

    playEffect(effect: SoundEffect): void {
        const audioEffect = this.effects.get(effect);
        if (audioEffect) {
            audioEffect.volume = this.effectsVolume;
            audioEffect.currentTime = 0;
            audioEffect.play().catch((error) => {
                return error;
            });
        }
    }

    playCombatEffect(matchData: MatchData): void {
        const currentLogs = matchData.logData;
        if (currentLogs.length <= this.previousLogSize) {
            return;
        }

        const lastLog = currentLogs[currentLogs.length - 1];

        const logText = lastLog.content.toLowerCase();

        if (logText.includes('inflige')) {
            this.playEffect(SoundEffect.Attack);
        } else if (logText.includes("s'est enfui")) {
            this.playEffect(SoundEffect.Flee);
        } else if (logText.includes('gagné le combat')) {
            if (this.backgroundMusic) {
                this.backgroundMusic.volume = 0;
            }
            this.playEffect(SoundEffect.Death);
        }

        this.previousLogSize = currentLogs.length;
    }

    setVolumes(musicVolume: number = AUDIO_CONFIG.musicVolume, effectsVolume: number = AUDIO_CONFIG.effectsVolume): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = musicVolume;
            this.backgroundVolume = musicVolume;
        }
        this.effects.forEach((audioEffect) => {
            audioEffect.volume = effectsVolume;
            this.effectsVolume = effectsVolume;
        });
    }
}
