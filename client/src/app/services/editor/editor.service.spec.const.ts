import { ErrorMessage, ValidationResult } from '@app/interfaces/game-validation';
import { EditorEvent } from '@app/interfaces/editor';

export const MOCK_EVENT_PROPERTY: EditorEvent = {
    tilePosition: null,
    mousePosition: null,
    tile: null,
    item: null,
};

export const MOCK_VALIDATION_RESULTS: ValidationResult[] = [
    {
        name: { isValid: true, errorMessage: null },
        description: { isValid: true, errorMessage: null },
        terrainCoverage: { isValid: true, coveragePercentage: 100 },
        tilesAccessibility: { isValid: true, nonAccessibleTileCount: 0 },
        items: { isValid: true, misplacedItems: [] },
        bridge: { isValid: true, errors: [] },
        spawnPoint: { isValid: true, errorMessage: null },
        mode: { isValid: true, errorMessage: null },
    },
    {
        name: { isValid: false, errorMessage: ErrorMessage.TooLong },
        description: { isValid: true, errorMessage: null },
        terrainCoverage: { isValid: false, coveragePercentage: 20 },
        tilesAccessibility: { isValid: false, nonAccessibleTileCount: 5 },
        items: { isValid: false, misplacedItems: [{ x: 1, y: 1 }] },
        bridge: { isValid: false, errors: [{ x: 2, y: 2, errorMessage: ErrorMessage.BridgeAtEdge }] },
        spawnPoint: { isValid: true, errorMessage: null },
        mode: { isValid: true, errorMessage: null },
    },
];

export const MOCK_MOUSE_EVENT = {
    target: {
        getAttribute: (x: string) => {
            return new Map([
                ['x', '10'],
                ['y', '20'],
                ['tile', 'Path'],
                ['item', 'Item1'],
            ]).get(x);
        },
    },
    clientX: 100,
    clientY: 200,
} as unknown as MouseEvent;

export const MOCK_BAD_MOUSE_EVENT = {
    target: {
        getAttribute: () => {
            return undefined;
        },
    },
} as unknown as MouseEvent;
