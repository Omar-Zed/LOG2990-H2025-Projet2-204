import { TileType } from '@common/interfaces/tile-type.enum';

export const TILE_DESCRIPTION: Map<TileType, string> = new Map([
    [TileType.Path, '<b>Chemin</b>Accélère la vitesse des joueurs'],
    [TileType.Bush, '<b>Buisson</b>Ralenti la vitesse des joueurs'],
    [TileType.Water, '<b>Eau</b>Bloque le passage des joueurs'],
    [TileType.Bridge, '<b>Pont</b>Peut être brisé ou réparé'],
    [TileType.BrokenBridge, '<b>Pont</b>Peut être brisé ou réparé'],
]);

export const RIGHT_CLICK_TILE_DESCRIPTION: Map<TileType, string> = new Map([
    [TileType.Grass, '<b>Gazon</b><br>Coût de déplacement: 1<br>Tuile de terrain'],
    [TileType.Path, '<b>Chemin</b><br>Coût de déplacement: 0<br>Accélère la vitesse des joueurs'],
    [TileType.Bush, '<b>Buisson</b><br>Coût de déplacement: 2<br>Ralenti la vitesse des joueurs'],
    [TileType.Water, '<b>Eau</b><br>Déplacement impossible<br>Bloque le passage des joueurs'],
    [TileType.Bridge, '<b>Pont</b><br>Coût de déplacement: 1<br>Peut être brisé'],
    [TileType.BrokenBridge, '<b>Pont brisé</b><br>Déplacement impossible<br>Peut être réparé'],
]);

export const TILE_EFFECT: Record<TileType, string> = {
    [TileType.Grass]: 'Normal',
    [TileType.Path]: 'Accélère mouvement',
    [TileType.Bush]: 'Ralenti le mouvement',
    [TileType.Water]: 'Bloque le passage',
    [TileType.Bridge]: 'Traversable',
    [TileType.None]: 'Aucun effet',
    [TileType.BrokenBridge]: 'Non traversable',
};
