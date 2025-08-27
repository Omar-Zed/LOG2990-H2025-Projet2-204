import { BotAction } from '@app/interfaces/bot-action.enum';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { PlayerType } from '@common/interfaces/player-data';

export const BOT_AGGRESSIVE_FFA_ACTIONS: BotAction[] = [
    BotAction.Attack,
    BotAction.MovePlayer,
    BotAction.MoveItem,
    BotAction.Bridge,
    BotAction.MoveBridge,
];

export const BOT_DEFENSIVE_FFA_ACTIONS: BotAction[] = [
    BotAction.MoveItem,
    BotAction.Attack,
    BotAction.MovePlayer,
    BotAction.Bridge,
    BotAction.MoveBridge,
];

export const BOT_AGGRESSIVE_CTF_ACTIONS: BotAction[] = [
    BotAction.MoveFlag,
    BotAction.AttackSpawnCamper,
    BotAction.MoveSpawnpoint,
    BotAction.AttackFlagHolder,
    BotAction.MoveFlagHolder,
    BotAction.CampSpawnpoint,
    BotAction.Bridge,
    BotAction.MoveBridge,
    BotAction.Attack,
    BotAction.MovePlayer,
];

export const BOT_DEFENSIVE_CTF_ACTIONS: BotAction[] = [
    BotAction.MoveFlag,
    BotAction.AttackSpawnCamper,
    BotAction.MoveSpawnpoint,
    BotAction.CampSpawnpoint,
    BotAction.Bridge,
    BotAction.MoveBridge,
    BotAction.Attack,
    BotAction.MovePlayer,
];

export const BOT_TURN_PRIORITIES: Map<GameMode, Map<PlayerType, BotAction[]>> = new Map([
    [
        GameMode.FFA,
        new Map([
            [PlayerType.BotAggressive, BOT_AGGRESSIVE_FFA_ACTIONS],
            [PlayerType.BotDefensive, BOT_DEFENSIVE_FFA_ACTIONS],
        ]),
    ],
    [
        GameMode.CTF,
        new Map([
            [PlayerType.BotAggressive, BOT_AGGRESSIVE_CTF_ACTIONS],
            [PlayerType.BotDefensive, BOT_DEFENSIVE_CTF_ACTIONS],
        ]),
    ],
]);

export const BOT_ITEM_PRIORITIES: Map<PlayerType, ItemType[]> = new Map([
    [PlayerType.BotAggressive, [ItemType.Flag, ItemType.Item2, ItemType.Item1, ItemType.Item3, ItemType.Item6, ItemType.Item4, ItemType.Item5]],
    [PlayerType.BotDefensive, [ItemType.Flag, ItemType.Item2, ItemType.Item1, ItemType.Item4, ItemType.Item5, ItemType.Item6, ItemType.Item3]],
]);

export const BOT_ID_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const BOT_CODE_LENGTH = 15;
export const BOT_TURN_MIN_DELAY = 500;
export const BOT_TURN_MAX_DELAY = 2000;
export const BOT_COMBAT_MIN_DELAY = 500;
export const BOT_COMBAT_MAX_DELAY = 550;
export const BOT_ITEM_MIN_DELAY = 500;
export const BOT_ITEM_MAX_DELAY = 2000;
