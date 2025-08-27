import { SoundEffect } from '@app/interfaces/sound-service';

export const SOUND_EFFECTS_MAP: Record<SoundEffect, string> = {
    [SoundEffect.Flee]: 'flee.wav',
    [SoundEffect.Attack]: 'attack.wav',
    [SoundEffect.Death]: 'death.mp3',
    [SoundEffect.Heal]: 'heal.wav',
    [SoundEffect.Item]: 'item.wav',
    [SoundEffect.Click]: 'select.wav',
};

export const PLAY_PAGE_EFFECT: SoundEffect[] = [SoundEffect.Item];

export const COMBAT_PAGE_EFFECTS: SoundEffect[] = [SoundEffect.Attack, SoundEffect.Death, SoundEffect.Heal, SoundEffect.Flee];

export const AUDIO_CONFIG = {
    musicVolume: 0.2,
    effectsVolume: 0.8,
    fadeInDuration: 1000,
    fadeOutDuration: 500,
    fadeStepInterval: 50,
};
