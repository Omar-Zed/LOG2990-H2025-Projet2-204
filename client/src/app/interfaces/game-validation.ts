import { MapData } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';

export enum ErrorMessage {
    Empty = 'Le champ ne peut pas être vide',
    TooLong = 'La valeur dépasse la longueur maximale autorisée',
    Bridge = 'Problème de pont en',
    BridgeAtEdge = 'Le pont ne peut pas être placé au bord de la carte',
    BridgeNotBetweenWalls = "Le pont doit être placé entre deux tuiles d'eau",
    MissingRequiredItems = "Pas assez d'éléments requis placés sur la carte",
    TooManyItems = "Trop d'éléments de ce type placés sur la carte",
    DuplicatedName = 'Le nom du jeu existe déjà',
    TerrainCoverage = 'Couverture du terrain insuffisante',
    TilesAccessibility = 'Tuiles inaccessibles',
    Items = 'Objets mal placés',
    Mode = 'Un drapeau doit être placé sur la carte en mode CTF',
}

export interface TilesCount {
    nbWater: number;
    nbBridge: number;
    nbTerrain: number;
    nbTilesTotal: number;
}

export interface ValidationResult {
    name: ValidationStatus;
    description: ValidationStatus;
    terrainCoverage: TerrainCoverageValidation;
    tilesAccessibility: TilesAccessibilityValidation;
    items: ItemsValidation;
    bridge: BridgeValidation;
    spawnPoint: ValidationStatus;
    mode: ValidationStatus;
}

export interface ValidationStatus {
    isValid: boolean;
    errorMessage: ErrorMessage | null;
}

export interface TerrainCoverageValidation {
    isValid: boolean;
    coveragePercentage: number;
}

export interface TilesAccessibilityValidation {
    isValid: boolean;
    nonAccessibleTileCount: number;
}

export interface ItemsValidation {
    isValid: boolean;
    misplacedItems: Position[];
}

export interface BridgeValidation {
    isValid: boolean;
    errors: BridgeValidationError[];
}

export interface BridgeValidationError {
    x: number;
    y: number;
    errorMessage: ErrorMessage;
}

export interface TileHandler {
    position: Position;
    map: MapData;
    tilesCount: TilesCount;
    bridgeStatus: BridgeValidation;
}
