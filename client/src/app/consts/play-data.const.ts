import { EMPTY_IMAGE } from '@app/consts/images.const';
import { PlayVisualData } from '@app/interfaces/play-visual-data';

export const DEFAULT_PLAY_VISUAL_DATA: PlayVisualData = {
    canUseAction: false,
    canEndTurn: false,
    currentPlayerCount: 0,
    players: [],
    selfAvatarUrl: '',
    thumbnailUrl: structuredClone(EMPTY_IMAGE),
    movementLeft: 0,
    isInventoryFull: false,
};
