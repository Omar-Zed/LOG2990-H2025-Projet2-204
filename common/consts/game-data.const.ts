import { GameData } from '../interfaces/game-data';
import { ItemType } from '../interfaces/item-type.enum';
import { GameMode, MapSize } from '../interfaces/map-data';

export const DEFAULT_GAME_DATA: GameData = {
    _id: '',
    name: '',
    description: '',
    lastEdited: new Date(),
    isVisible: false,
    mapData: {
        items: {
            [ItemType.Item1]: [],
            [ItemType.Item2]: [],
            [ItemType.Item3]: [],
            [ItemType.Item4]: [],
            [ItemType.Item5]: [],
            [ItemType.Item6]: [],
            [ItemType.Random]: [],
            [ItemType.Spawn]: [],
            [ItemType.Flag]: [],
        },
        tiles: [],
        size: MapSize.Small,
        gameMode: GameMode.FFA,
    },
};
