export enum TileType {
    Grass = 'Grass',
    Path = 'Path',
    Bush = 'Bush',
    Water = 'Water',
    Bridge = 'Bridge',
    BrokenBridge = 'BrokenBridge',
    None = 'None',
}

export const TILE_COST: Record<TileType, number> = {
    [TileType.Path]: 0,
    [TileType.Grass]: 1,
    [TileType.Bush]: 2,
    [TileType.Water]: Infinity,
    [TileType.Bridge]: 1,
    [TileType.BrokenBridge]: Infinity,
    [TileType.None]: Infinity,
};
