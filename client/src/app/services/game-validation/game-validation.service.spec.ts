import { TestBed } from '@angular/core/testing';
import { BridgeValidationError, ErrorMessage, TileHandler, TilesCount, ValidationResult } from '@app/interfaces/game-validation';
import { GameData } from '@common/interfaces/game-data';
import { GameMode, MapData, MapSize } from '@common/interfaces/map-data';
import { TileType } from '@common/interfaces/tile-type.enum';
import { VALIDATION_TESTS_CASES } from './game-validation.const.spec';
import { GameValidationService } from './game-validation.service';

describe('GameValidationService', () => {
    let service: GameValidationService;
    const map = {
        tiles: Array.from({ length: MapSize.Medium }, () => Array(MapSize.Medium).fill(TileType.Grass)),
        gameMode: GameMode.CTF,
        size: MapSize.Medium,
    } as MapData;

    const game: GameData = {
        _id: '1',
        name: 'ValidGameName',
        description: 'ValidGameDescription',
        mapData: map,
        lastEdited: new Date(),
        isVisible: true,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GameValidationService],
        });
        service = TestBed.inject(GameValidationService);
    });

    it('should invoke validateName, validateDescription, and validateMap with the correct parameters', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'validateMap').and.returnValue({
            name: { isValid: true, errorMessage: null },
            description: { isValid: true, errorMessage: null },
        } as Partial<ValidationResult>);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'validateName').and.returnValue({ isValid: true, errorMessage: null });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'validateDescription').and.returnValue({ isValid: true, errorMessage: null });

        const result = service.validateGame(game);

        expect(service['validateName']).toHaveBeenCalledOnceWith(game.name);
        expect(service['validateDescription']).toHaveBeenCalledOnceWith(game.description);
        expect(service['validateMap']).toHaveBeenCalledOnceWith(game.mapData);
        expect(result).toBeNull();
    });

    it('should return an error when validateMap detects an invalid description', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'validateMap').and.returnValue({
            name: { isValid: true, errorMessage: null },
            spawnPoint: { isValid: false, errorMessage: ErrorMessage.Empty },
        } as Partial<ValidationResult>);

        const result = service.validateGame(game);

        expect(result).not.toBeNull();
    });

    it('validateName should validate a correct game name', () => {
        const result = service['validateName'](game.name);
        expect(result).toEqual({ isValid: true, errorMessage: null });
    });

    it('validateName should return false for an empty or overly long game name', () => {
        let gameName = '';
        let result = service['validateName'](gameName);
        expect(result).toEqual({ isValid: false, errorMessage: ErrorMessage.Empty });

        const longGameName = 100;
        gameName = 'A'.repeat(longGameName);
        result = service['validateName'](gameName);
        expect(result).toEqual({ isValid: false, errorMessage: ErrorMessage.TooLong });
    });

    it('validateDescription should validate a correct game description', () => {
        const result = service['validateDescription'](game.description);
        expect(result).toEqual({ isValid: true, errorMessage: null });
    });

    it('validateDescription should invalidate an empty or excessively long game description', () => {
        let gameDescription = '';
        let result = service['validateDescription'](gameDescription);
        expect(result).toEqual({ isValid: false, errorMessage: ErrorMessage.Empty });

        const GAME_DESCRIPTION_TOO_LONG = 400;
        gameDescription = 'A'.repeat(GAME_DESCRIPTION_TOO_LONG);
        result = service['validateDescription'](gameDescription);
        expect(result).toEqual({ isValid: false, errorMessage: ErrorMessage.TooLong });
    });

    it('validateMap should process tiles and validate terrain, spawn points, items, and flags', () => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        // private methods
        spyOn<any>(service, 'handleTile').and.stub();
        spyOn<any>(service, 'validateTilesAccessibility').and.stub();
        spyOn<any>(service, 'validateTerrainCoverage').and.stub();
        spyOn<any>(service, 'validateSpawnPoints').and.stub();
        spyOn<any>(service, 'validateItemPlacement').and.stub();
        spyOn<any>(service, 'validateFlags').and.stub();
        /* eslint-enable @typescript-eslint/no-explicit-any */
        service['validateMap'](game.mapData);

        expect(service['handleTile']).toHaveBeenCalledTimes(game.mapData.size * game.mapData.size);

        expect(service['validateTerrainCoverage']).toHaveBeenCalledTimes(1);
        expect(service['validateTerrainCoverage']).toHaveBeenCalledWith({ nbWater: 0, nbBridge: 0, nbTerrain: 0, nbTilesTotal: 0 });

        expect(service['validateTilesAccessibility']).toHaveBeenCalledTimes(1);
        expect(service['validateTilesAccessibility']).toHaveBeenCalledWith(game.mapData, {
            nbWater: 0,
            nbBridge: 0,
            nbTerrain: 0,
            nbTilesTotal: 0,
        });

        expect(service['validateSpawnPoints']).toHaveBeenCalledTimes(1);
        expect(service['validateSpawnPoints']).toHaveBeenCalledWith(game.mapData);

        expect(service['validateItemPlacement']).toHaveBeenCalledTimes(1);
        expect(service['validateItemPlacement']).toHaveBeenCalledWith(game.mapData);

        expect(service['validateFlags']).toHaveBeenCalledTimes(1);
        expect(service['validateFlags']).toHaveBeenCalledWith(game.mapData);

        const ffaMap = game.mapData;
        ffaMap.gameMode = GameMode.FFA;

        service['validateMap'](ffaMap);
        expect(service['validateFlags']).toHaveBeenCalledTimes(1);
    });

    it('validateBridge should validate a valid bridge and return true', () => {
        const testCases = VALIDATION_TESTS_CASES.validBridges;

        testCases.forEach((tiles) => {
            const validBridgeMap = { tiles } as MapData;
            const result = service['validateBridge']({ x: 1, y: 1 }, validBridgeMap);
            expect(result).toBeNull();
        });
    });

    it('validateBridge should invalidate an invalid bridge and return false', () => {
        const testCases = VALIDATION_TESTS_CASES.invalidBridges;

        testCases.forEach(({ tiles, position, expectedError }) => {
            const invalidBridgeMap = { tiles } as MapData;

            const result = service['validateBridge'](position, invalidBridgeMap);
            expect(result).toEqual({ x: position.x, y: position.y, errorMessage: expectedError });
        });
    });

    it('validateSpawnPoints should return true when the correct number of spawn points are placed', () => {
        const testCase = VALIDATION_TESTS_CASES.validSpawnPointCase;

        const result = service['validateSpawnPoints'](testCase);
        expect(result).toEqual({ isValid: true, errorMessage: null });
    });

    it('validateSpawnPoints should return false when the number of spawn points is incorrect', () => {
        const testCases = VALIDATION_TESTS_CASES.invalidSpawnPointCases;

        testCases.forEach(({ items, size, errorMessage }) => {
            const mapCase = { items, size } as MapData;

            const result = service['validateSpawnPoints'](mapCase);
            expect(result).toEqual({ isValid: false, errorMessage });
        });
    });

    it('validateFlags should validate flags when exactly one flag is placed', () => {
        const testCases = VALIDATION_TESTS_CASES.validFalgCase;

        const result = service['validateFlags'](testCases);
        expect(result).toEqual({ isValid: true, errorMessage: null });
    });

    it('validateFlags should invalidate flags when the number of flags is incorrect', () => {
        const testCases = VALIDATION_TESTS_CASES.invalidFlagCases;

        testCases.forEach(({ items, size, errorMessage }) => {
            const mapCase = { items, size } as MapData;

            const result = service['validateFlags'](mapCase);
            expect(result).toEqual({ isValid: false, errorMessage });
        });
    });

    it('validateItems should return validate items when all items are placed on traversable tiles', () => {
        const testCases = VALIDATION_TESTS_CASES.validItemsCase;

        const result = service['validateItemPlacement'](testCases);
        expect(result).toEqual({ isValid: true, misplacedItems: [] });
    });

    it('validateItems should invalidate items when items are placed on non-traversable tiles', () => {
        const testCases = VALIDATION_TESTS_CASES.invalidItemsCase;

        const result = service['validateItemPlacement'](testCases.invalidMap);
        expect(result).toEqual({ isValid: false, misplacedItems: testCases.misplacedItems });
    });

    it('validateTerrainCoverage should validate coverage when terrain coverage is above the minimum ratio', () => {
        const testCases = VALIDATION_TESTS_CASES.validTerrainCoverageCases;

        testCases.forEach((tilesCount) => {
            const result = service['validateTerrainCoverage'](tilesCount);
            expect(result).toEqual({
                isValid: true,
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- convert to percentage
                coveragePercentage: (tilesCount.nbTerrain / tilesCount.nbTilesTotal) * 100,
            });
        });
    });

    it('validateTerrainCoverage should invalidate coverage when terrain coverage is below the minimum ratio', () => {
        const testCases = VALIDATION_TESTS_CASES.invalidTerrainCoverageCases;

        testCases.forEach((tilesCount) => {
            const result = service['validateTerrainCoverage'](tilesCount);

            expect(result).toEqual({
                isValid: false,
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- convert to percentage
                coveragePercentage: (tilesCount.nbTerrain / tilesCount.nbTilesTotal) * 100,
            });
        });
    });

    it('validateTilesAccessibility should validate accessibility when all traversable tiles are accessible', () => {
        const testCases = VALIDATION_TESTS_CASES.validTilesAccessibilityCase;
        const result = service['validateTilesAccessibility'](testCases.map, testCases.tilesCount);
        expect(result).toEqual({ isValid: true, nonAccessibleTileCount: 0 });
    });

    it('validateTilesAccessibility should invalidate accessibility when some traversable tiles are not accessible', () => {
        const testCases = VALIDATION_TESTS_CASES.invalidTilesAccessibilityCases;

        testCases.forEach(({ tiles, tilesCount, expectedNonAccessibleTiles }) => {
            const invalidMap = { tiles } as MapData;
            const result = service['validateTilesAccessibility'](invalidMap, tilesCount);
            expect(result).toEqual({ isValid: false, nonAccessibleTileCount: expectedNonAccessibleTiles });
        });
    });

    it('handleTile should correctly increment tile counters based on tile type', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'validateBridge').and.returnValue({ x: 0, y: 0, errorMessage: ErrorMessage.BridgeAtEdge });

        let testCases = VALIDATION_TESTS_CASES.handleTileNoBridgeCases;
        const bridgeStatus = { isValid: true, errors: [] } as { isValid: boolean; errors: BridgeValidationError[] };

        testCases.forEach(({ tile, expectedCounts }) => {
            const testMap: MapData = { tiles: [[tile]] } as MapData;
            const initialtilesCount: TilesCount = {
                nbWater: 0,
                nbBridge: 0,
                nbTerrain: 0,
                nbTilesTotal: 0,
            };

            const tileHandler: TileHandler = {
                position: { x: 0, y: 0 },
                map: testMap,
                tilesCount: initialtilesCount,
                bridgeStatus,
            };
            service['handleTile'](tileHandler);

            expect(initialtilesCount.nbWater).toBe(expectedCounts.nbWater);
            expect(initialtilesCount.nbBridge).toBe(expectedCounts.nbBridge);
            expect(initialtilesCount.nbTerrain).toBe(expectedCounts.nbTerrain);
            expect(initialtilesCount.nbTilesTotal).toBe(expectedCounts.nbTilesTotal);

            expect(service['validateBridge']).not.toHaveBeenCalled();
        });

        testCases = VALIDATION_TESTS_CASES.handleTileWithBridgeCases;

        testCases.forEach(({ tile, expectedCounts }) => {
            const testMap: MapData = { tiles: [[tile]] } as MapData;
            const initialtilesCount: TilesCount = {
                nbWater: 0,
                nbBridge: 0,
                nbTerrain: 0,
                nbTilesTotal: 0,
            };

            const tileHandler: TileHandler = {
                position: { x: 0, y: 0 },
                map: testMap,
                tilesCount: initialtilesCount,
                bridgeStatus,
            };
            service['handleTile'](tileHandler);

            expect(initialtilesCount.nbWater).toBe(expectedCounts.nbWater);
            expect(initialtilesCount.nbBridge).toBe(expectedCounts.nbBridge);
            expect(initialtilesCount.nbTerrain).toBe(expectedCounts.nbTerrain);
            expect(initialtilesCount.nbTilesTotal).toBe(expectedCounts.nbTilesTotal);

            expect(service['validateBridge']).toHaveBeenCalledWith({ x: 0, y: 0 }, testMap);
            expect(bridgeStatus.isValid).toBeFalse();
            expect(bridgeStatus.errors).toContain({ x: 0, y: 0, errorMessage: ErrorMessage.BridgeAtEdge });
        });
    });

    it('should return correct validation error message for various validation results', () => {
        const validResult: ValidationResult = {
            name: { isValid: true, errorMessage: null },
            description: { isValid: true, errorMessage: null },
            terrainCoverage: { isValid: true, coveragePercentage: 50 },
            tilesAccessibility: { isValid: true, nonAccessibleTileCount: 0 },
            spawnPoint: { isValid: true, errorMessage: null },
            items: { isValid: true, misplacedItems: [] },
            bridge: { isValid: true, errors: [] },
            mode: { isValid: true, errorMessage: null },
        };
        expect(service.getValidationErrorMessage(validResult)).toBe('Aucune erreur de validation');

        const invalidResult: ValidationResult = {
            name: { isValid: false, errorMessage: ErrorMessage.Empty },
            description: { isValid: true, errorMessage: null },
            terrainCoverage: { isValid: false, coveragePercentage: 20 },
            tilesAccessibility: { isValid: false, nonAccessibleTileCount: 5 },
            spawnPoint: { isValid: true, errorMessage: null },
            items: {
                isValid: false,
                misplacedItems: [
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ],
            },
            bridge: {
                isValid: false,
                errors: [
                    { x: 0, y: 0, errorMessage: ErrorMessage.BridgeAtEdge },
                    { x: 1, y: 1, errorMessage: ErrorMessage.BridgeNotBetweenWalls },
                ],
            },
            mode: { isValid: false, errorMessage: ErrorMessage.MissingRequiredItems },
        };
        const expectedMessage = `Carte invalide :
  - name: Le champ ne peut pas être vide
  - Couverture du terrain insuffisante (20%)
  - Tuiles inaccessibles
  - Objets mal placés (2)
  - Problème de pont en [0,0]: Le pont ne peut pas être placé au bord de la carte
  - Problème de pont en [1,1]: Le pont doit être placé entre deux tuiles d'eau
  - Un drapeau doit être placé sur la carte en mode CTF`;
        expect(service.getValidationErrorMessage(invalidResult)).toBe(expectedMessage);
    });
});
