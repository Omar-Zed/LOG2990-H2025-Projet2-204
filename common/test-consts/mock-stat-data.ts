import { GlobalStatData, PlayerStatData } from '@app/interfaces/stat-data';
import { PlayerStatType } from '@app/interfaces/stat-type.enum';
import { MOCK_TRACKING_DATA } from './mock-track-data';
import { BATTLE_PLATFORM_IMAGES } from '@app/consts/images.const';
import { WinnerVisualData } from '@app/interfaces/stat-data';
import { AVATAR_DATA } from '@common/consts/avatar-data.const';

export const MOCK_GLOBAL_STAT_DATA: GlobalStatData = {
    gameDuration: 0,
    toggledBridgesRatio: 0,
    visitedTilesRatio: 0,
    rounds: 0,
    flagHoldersCount: 0,
};

export const MOCK_PLAYER_STAT_DATA: PlayerStatData[] = [
    {
        id: 'player1',
        name: 'Alice',
        [PlayerStatType.DiscoveredItemsCount]: 0,
        [PlayerStatType.VisitedTilesRatio]: 0,
        [PlayerStatType.Combats]: 0,
        [PlayerStatType.Victories]: 0,
        [PlayerStatType.Defeats]: 0,
        [PlayerStatType.Escapes]: 0,
        [PlayerStatType.HpInflicted]: 0,
        [PlayerStatType.HpLost]: 0,
    },
    {
        id: 'player2',
        name: 'Bob',
        [PlayerStatType.DiscoveredItemsCount]: 0,
        [PlayerStatType.VisitedTilesRatio]: 0,
        [PlayerStatType.Combats]: 0,
        [PlayerStatType.Victories]: 0,
        [PlayerStatType.Defeats]: 0,
        [PlayerStatType.Escapes]: 0,
        [PlayerStatType.HpInflicted]: 0,
        [PlayerStatType.HpLost]: 0,
    },
    {
        id: 'player3',
        name: 'Charlie',
        [PlayerStatType.DiscoveredItemsCount]: 0,
        [PlayerStatType.VisitedTilesRatio]: 0,
        [PlayerStatType.Combats]: 0,
        [PlayerStatType.Victories]: 0,
        [PlayerStatType.Defeats]: 0,
        [PlayerStatType.Escapes]: 0,
        [PlayerStatType.HpInflicted]: 0,
        [PlayerStatType.HpLost]: 0,
    },
];

export const MOCK_WINNER_VISUAL_DATA: WinnerVisualData = {
    name: MOCK_TRACKING_DATA.matchWinner.name,
    avatarImage: AVATAR_DATA[MOCK_TRACKING_DATA.matchWinner.avatar].frontGif,
    tileImage: BATTLE_PLATFORM_IMAGES[MOCK_TRACKING_DATA.matchWinner.tile].enemyPlatform,
};
