import { ItemType } from './item-type.enum';
import { Position } from './position';

export enum DiceType {
    D4 = 4,
    D6 = 6,
}

export enum Avatar {
    Default = 'default',
    Avatar1 = 'avatar1',
    Avatar2 = 'avatar2',
    Avatar3 = 'avatar3',
    Avatar4 = 'avatar4',
    Avatar5 = 'avatar5',
    Avatar6 = 'avatar6',
    Avatar7 = 'avatar7',
    Avatar8 = 'avatar8',
    Avatar9 = 'avatar9',
    Avatar10 = 'avatar10',
    Avatar11 = 'avatar11',
    Avatar12 = 'avatar12',
    Avatar1Shiny = 'avatar1-shiny',
    Avatar2Shiny = 'avatar2-shiny',
    Avatar3Shiny = 'avatar3-shiny',
    Avatar4Shiny = 'avatar4-shiny',
    Avatar5Shiny = 'avatar5-shiny',
    Avatar6Shiny = 'avatar6-shiny',
    Avatar7Shiny = 'avatar7-shiny',
    Avatar8Shiny = 'avatar8-shiny',
    Avatar9Shiny = 'avatar9-shiny',
    Avatar10Shiny = 'avatar10-shiny',
    Avatar11Shiny = 'avatar11-shiny',
    Avatar12Shiny = 'avatar12-shiny',
    Avatar1Evolved = 'avatar1-evolved',
    Avatar2Evolved = 'avatar2-evolved',
    Avatar3Evolved = 'avatar3-evolved',
    Avatar4Evolved = 'avatar4-evolved',
    Avatar5Evolved = 'avatar5-evolved',
    Avatar6Evolved = 'avatar6-evolved',
    Avatar7Evolved = 'avatar7-evolved',
    Avatar8Evolved = 'avatar8-evolved',
    Avatar9Evolved = 'avatar9-evolved',
    Avatar10Evolved = 'avatar10-evolved',
    Avatar11Evolved = 'avatar11-evolved',
    Avatar12Evolved = 'avatar12-evolved',
    Avatar1EvolvedShiny = 'avatar1-evolved-shiny',
    Avatar2EvolvedShiny = 'avatar2-evolved-shiny',
    Avatar3EvolvedShiny = 'avatar3-evolved-shiny',
    Avatar4EvolvedShiny = 'avatar4-evolved-shiny',
    Avatar5EvolvedShiny = 'avatar5-evolved-shiny',
    Avatar6EvolvedShiny = 'avatar6-evolved-shiny',
    Avatar7EvolvedShiny = 'avatar7-evolved-shiny',
    Avatar8EvolvedShiny = 'avatar8-evolved-shiny',
    Avatar9EvolvedShiny = 'avatar9-evolved-shiny',
    Avatar10EvolvedShiny = 'avatar10-evolved-shiny',
    Avatar11EvolvedShiny = 'avatar11-evolved-shiny',
    Avatar12EvolvedShiny = 'avatar12-evolved-shiny',
    MissingNo = 'missingNo',
}

export interface PlayerData {
    id: string;
    isConnected: boolean;
    name: string;
    avatar: Avatar;
    items: ItemType[];
    health: number;
    speed: number;
    attackDice: DiceType;
    defenseDice: DiceType;
    spawnPoint: Position;
    position: Position;
    combatsWon: number;
    type: PlayerType;
    team: Team;
}

export enum Team {
    Red = 'rouge',
    Blue = 'bleu',
    None = 'none',
}

export enum PlayerType {
    Player = 'player',
    BotAggressive = 'botAggressive',
    BotDefensive = 'botDefensive',
}

export interface AvatarModifiers {
    isShiny: boolean;
    isEvolved: boolean;
    isMissingNo: boolean;
}
