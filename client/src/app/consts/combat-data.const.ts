import { CombatVisualData } from '@app/interfaces/combat-visual-data';
import { DEFAULT_PLAYER_COMBAT_DATA } from '@common/consts/combat-data.const';
import { EMPTY_IMAGE } from './images.const';

export const DEFAULT_COMBAT_VISUAL_DATA: CombatVisualData = {
    isSelfTurn: false,
    selfPlayer: structuredClone(DEFAULT_PLAYER_COMBAT_DATA),
    enemyPlayer: structuredClone(DEFAULT_PLAYER_COMBAT_DATA),
    selfImage: EMPTY_IMAGE,
    enemyImage: EMPTY_IMAGE,
    selfPlatform: EMPTY_IMAGE,
    enemyPlatform: EMPTY_IMAGE,
    isSelfHealing: false,
    isEnemyHealing: false,
};
