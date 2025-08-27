import { MOCK_PLAYER_DATAS } from './mock-players';
import { TrackingPlayerData } from '../interfaces/track-data';
import { TrackingData } from '../interfaces/match-data';
import { Avatar } from '../interfaces/player-data';
import { TileType } from '../interfaces/tile-type.enum';

export const MOCK_TRACKING_PLAYER_DATAS: TrackingPlayerData[] = [
    {
        id: MOCK_PLAYER_DATAS[0].id,
        name: MOCK_PLAYER_DATAS[0].name,
        pickedUpItems: [],
        coveredGroundTiles: [],
        combats: 0,
        victories: 0,
        defeats: 0,
        escapes: 0,
        hpInflicted: 0,
        hpLost: 0,
    },
    {
        id: MOCK_PLAYER_DATAS[1].id,
        name: MOCK_PLAYER_DATAS[1].name,
        pickedUpItems: [],
        coveredGroundTiles: [],
        combats: 0,
        victories: 0,
        defeats: 0,
        escapes: 0,
        hpInflicted: 0,
        hpLost: 0,
    },
    {
        id: MOCK_PLAYER_DATAS[2].id,
        name: MOCK_PLAYER_DATAS[2].name,
        pickedUpItems: [],
        coveredGroundTiles: [],
        combats: 0,
        victories: 0,
        defeats: 0,
        escapes: 0,
        hpInflicted: 0,
        hpLost: 0,
    },
];

export const MOCK_TRACKING_DATA: TrackingData = {
    startTime: 0,
    endTime: 1000,
    coveredBridges: [],
    coveredGroundTiles: [],
    rounds: 0,
    flagHoldersCount: 0,
    matchWinner: {
        id: MOCK_TRACKING_PLAYER_DATAS[0].id,
        name: MOCK_TRACKING_PLAYER_DATAS[0].name,
        avatar: Avatar.Default,
        tile: TileType.Grass,
    },
    players: structuredClone(MOCK_TRACKING_PLAYER_DATAS),
};
