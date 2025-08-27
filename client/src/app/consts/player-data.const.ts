import { CharacterVisualData } from '@app/interfaces/character-visual-data';
import { LobbyVisualData } from '@app/interfaces/lobby-visual-data';
import { MAX_NAME_LENGTH } from '@common/consts/player-data.const';
import { EMPTY_IMAGE } from './images.const';

export const DEFAULT_CHARACTER_VISUAL_DATA: CharacterVisualData = {
    isHpSelected: true,
    isAttackSelected: true,
    avatarList: [],
    selfAvatarimage: EMPTY_IMAGE,
    isAvatarSelected: false,
    nameMaxLength: MAX_NAME_LENGTH,
};

export const DEFAULT_LOBBY_VISUAL_DATA: LobbyVisualData = {
    players: [],
    isSelfHost: false,
};
