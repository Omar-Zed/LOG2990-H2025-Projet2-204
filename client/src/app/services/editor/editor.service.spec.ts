import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ErrorMessage, ValidationResult } from '@app/interfaces/game-validation';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { GameSaveService } from '@app/services/game-save/game-save.service';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { PopupService } from '@app/services/popup/popup.service';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode, MapSize } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_GAME_DATAS } from '@common/test-consts/mock-games';
import { of, throwError } from 'rxjs';
import { EditorService } from './editor.service';

describe('EditorService', () => {
    let service: EditorService;
    let gameValidationServiceSpy: jasmine.SpyObj<GameValidationService>;
    let gameSaveServiceSpy: jasmine.SpyObj<GameSaveService>;
    let gameDataServiceSpy: jasmine.SpyObj<GameDataService>;
    let popupServiceSpy: jasmine.SpyObj<PopupService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        gameValidationServiceSpy = jasmine.createSpyObj('GameValidationService', ['validateGame', 'getValidationErrorMessage']);
        gameSaveServiceSpy = jasmine.createSpyObj('GameSaveService', ['isNameUnique', 'saveGame']);
        gameDataServiceSpy = jasmine.createSpyObj(
            'GameDataService',
            ['getItem', 'removeItem', 'getTileFromPosition', 'addItem', 'editTile', 'getItemCount', 'getMapSize', 'getGameMode'],
            {
                gameData: structuredClone(MOCK_GAME_DATAS[0]),
            },
        );
        popupServiceSpy = jasmine.createSpyObj('PopupService', ['showPopup']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                EditorService,
                { provide: GameValidationService, useValue: gameValidationServiceSpy },
                { provide: GameSaveService, useValue: gameSaveServiceSpy },
                { provide: GameDataService, useValue: gameDataServiceSpy },
                { provide: PopupService, useValue: popupServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });

        service = TestBed.inject(EditorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should place item on valid tile', () => {
        const position: Position = { x: 2, y: 3 };
        const item = ItemType.Item1;
        gameDataServiceSpy.getTileFromPosition.and.returnValue(TileType.Grass);
        gameDataServiceSpy.addItem.and.stub();

        service.placeItem(item, position);

        expect(gameDataServiceSpy.addItem).toHaveBeenCalledWith(item, position);
    });

    it('should not place item on invalid tile', () => {
        const position: Position = { x: 2, y: 3 };
        const item = ItemType.Item1;
        const lastPickPosition = { x: 1, y: 1 };
        gameDataServiceSpy.getTileFromPosition.and.returnValue(TileType.Water);
        gameDataServiceSpy.addItem.and.stub();

        service['lastPickPosition'] = lastPickPosition;
        service.placeItem(item, position);

        expect(gameDataServiceSpy.addItem).toHaveBeenCalledWith(item, lastPickPosition);
    });

    it('should get remaining item count correctly', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getItemCount').and.returnValue(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getMaxItemCount').and.returnValue(2);

        const result = service.getRemainingItemCount(ItemType.Item1, null);

        expect(result).toEqual(1);
    });

    it('should get max item count correctly', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getMaxSharedItemCount').and.returnValue(2);
        gameDataServiceSpy.getMapSize.and.returnValue(MapSize.Medium);
        const result1 = service['getMaxItemCount'](ItemType.Item1, ItemType.Item1);
        expect(result1).toEqual(1);
    });

    it('should get max shared item count correctly', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getItemCount').and.returnValue(2);
        gameDataServiceSpy.getMapSize.and.returnValue(MapSize.Medium);
        const result1 = service['getMaxItemCount'](ItemType.Item1, ItemType.Item1);
        const expectedResult = -8;
        expect(result1).toEqual(expectedResult);
    });

    it('should get max shared item count correctly', () => {
        gameDataServiceSpy.getItemCount.and.returnValue(1);
        const result1 = service['getItemCount'](ItemType.Item1, ItemType.Item1);
        expect(result1).toEqual(2);
    });

    it('should paint tile correctly', () => {
        const position: Position = { x: 5, y: 5 };
        const newTile = TileType.Path;
        gameDataServiceSpy.getTileFromPosition.and.returnValue(TileType.Grass);
        gameDataServiceSpy.editTile.and.stub();

        service.paintTile(newTile, position);

        expect(gameDataServiceSpy.editTile).toHaveBeenCalledWith(newTile, position);
    });

    it('should not paint same tile type', () => {
        const position: Position = { x: 5, y: 5 };
        const newTile = TileType.Grass;
        gameDataServiceSpy.getTileFromPosition.and.returnValue(TileType.Grass);
        gameDataServiceSpy.editTile.and.stub();

        service.paintTile(newTile, position);

        expect(gameDataServiceSpy.editTile).not.toHaveBeenCalled();
    });

    it('should replace broken bridge with bridge', () => {
        const position: Position = { x: 5, y: 5 };
        const newTile = TileType.BrokenBridge;
        gameDataServiceSpy.getTileFromPosition.and.returnValue(TileType.BrokenBridge);
        gameDataServiceSpy.editTile.and.stub();

        service.paintTile(newTile, position);

        expect(gameDataServiceSpy.editTile).toHaveBeenCalledWith(TileType.Bridge, position);
    });

    it('should save game successfully', async () => {
        gameValidationServiceSpy.validateGame.and.returnValue(null);
        gameSaveServiceSpy.isNameUnique.and.returnValue(of(true));
        gameSaveServiceSpy.saveGame.and.returnValue(of(MOCK_GAME_DATAS[0]));
        gameDataServiceSpy.gameData.name = 'UniqueName';
        gameDataServiceSpy.gameData.lastEdited = new Date();

        const result = await service.saveGame();

        expect(result).toBe(true);
        expect(popupServiceSpy.showPopup).not.toHaveBeenCalled();
    });

    it('should show validation error on save failure', async () => {
        const validationResult: ValidationResult = {
            name: { isValid: false, errorMessage: ErrorMessage.Empty },
            description: { isValid: true, errorMessage: null },
            terrainCoverage: { isValid: true, coveragePercentage: 50 },
            tilesAccessibility: { isValid: true, nonAccessibleTileCount: 0 },
            spawnPoint: { isValid: true, errorMessage: null },
            items: { isValid: true, misplacedItems: [] },
            bridge: { isValid: true, errors: [] },
            mode: { isValid: true, errorMessage: null },
        };
        gameValidationServiceSpy.validateGame.and.returnValue(validationResult);

        await service.saveGame();

        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
        expect(gameSaveServiceSpy.isNameUnique).not.toHaveBeenCalled();
    });

    it('should show name not unique error on save', async () => {
        gameValidationServiceSpy.validateGame.and.returnValue(null);
        gameSaveServiceSpy.isNameUnique.and.returnValue(of(false));

        await service.saveGame();

        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
        expect(gameSaveServiceSpy.saveGame).not.toHaveBeenCalled();
    });

    it('should handle save server error', async () => {
        const errorResponse = new HttpErrorResponse({ error: 'Server error', status: 500 });
        gameValidationServiceSpy.validateGame.and.returnValue(null);
        gameSaveServiceSpy.isNameUnique.and.returnValue(of(true));
        gameSaveServiceSpy.saveGame.and.returnValue(throwError(() => errorResponse));

        await service.saveGame();

        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
    });

    it('should pick item correctly', () => {
        const position: Position = { x: 2, y: 2 };
        service.resetLastPicked();
        service.pickItem(position);
        expect(gameDataServiceSpy.removeItem).toHaveBeenCalled();
    });

    it('should return 1 for Flag in CTF mode', () => {
        gameDataServiceSpy.getGameMode.and.returnValue(GameMode.CTF);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getMaxItemCount').and.callThrough();
        const maxItemCount = service['getMaxItemCount'](ItemType.Flag, null);

        expect(maxItemCount).toBe(1);
    });

    it('should return 0 for Flag in non-CTF mode', () => {
        gameDataServiceSpy.getGameMode.and.returnValue(GameMode.FFA);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getMaxItemCount').and.callThrough();
        const maxItemCount = service['getMaxItemCount'](ItemType.Flag, null);

        expect(maxItemCount).toBe(0);
    });
});
