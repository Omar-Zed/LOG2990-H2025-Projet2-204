export enum ItemType {
    Item1 = 'Item1',
    Item2 = 'Item2',
    Item3 = 'Item3',
    Item4 = 'Item4',
    Item5 = 'Item5',
    Item6 = 'Item6',
    Random = 'Random',
    Spawn = 'Spawn',
    Flag = 'Flag',
}

export interface ItemEffect {
    attack: number;
    defense: number;
    escapeChances: number;
    maxEscapes: number;
    currentEscapes: number;
}
