import { TestBed } from '@angular/core/testing';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { Position } from '@common/interfaces/position';
import { RIGHT_CLICK_ITEM_DESCRIPTION } from '@common/consts/item-data.const';
import { RIGHT_CLICK_TILE_DESCRIPTION } from '@app/consts/tile-data.const';
import { MatchService } from '@app/services/match/match.service';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MatchData } from '@common/interfaces/match-data';
import { PlayerData } from '@common/interfaces/player-data';
import { MOCK_GAME_DATAS } from '@common/test-consts/mock-games';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { TileDescriptionService } from './tile-description.service';

describe('TileDescriptionService', () => {
    let service: TileDescriptionService;
    let mockGameDataService: jasmine.SpyObj<GameDataService>;
    let mockMatchService: jasmine.SpyObj<MatchService>;

    let mockPosition: Position = { x: 3, y: 4 };
    let mockPlayer: PlayerData;
    let mockMatchData: MatchData;

    beforeEach(() => {
        mockPosition = { x: 3, y: 4 };
        mockPlayer = { ...structuredClone(MOCK_PLAYER_DATAS[0]), position: mockPosition };
        mockMatchData = { ...structuredClone(MOCK_MATCH_DATAS[0]), players: [mockPlayer] };
        mockGameDataService = jasmine.createSpyObj('GameDataService', ['getTileFromPosition', 'getItem'], { gameData: mockMatchData.gameData });
        mockMatchService = jasmine.createSpyObj('MatchService', ['isActivePlayer', 'canUseDebugMove'], { data: mockMatchData });

        TestBed.configureTestingModule({
            providers: [
                TileDescriptionService,
                { provide: GameDataService, useValue: mockGameDataService },
                { provide: MatchService, useValue: mockMatchService },
            ],
        });
        service = TestBed.inject(TileDescriptionService);

        mockGameDataService.gameData = structuredClone(MOCK_GAME_DATAS[0]);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should hide tool description', () => {
        service.visible = true;
        service.hideTileDescription();
        expect(service.visible).toBeFalse();
    });

    it('should find player at position', () => {
        const result = service['findPlayerAtPosition'](mockPlayer.position);
        expect(result).toEqual(mockPlayer);
    });

    it('should display tool description', () => {
        const mockMapRect = {
            left: 100,
            top: 100,
            width: 800,
            height: 800,
            right: 900,
            bottom: 900,
            x: 100,
            y: 100,
        } as DOMRect;
        const mockElement = document.createElement('div');
        Object.defineProperty(mockElement, 'getBoundingClientRect', {
            value: () => mockMapRect,
        });
        mockMatchService.canUseDebugMove.and.returnValue(false);

        const mockEvent = {
            preventDefault: jasmine.createSpy('preventDefault'),
            clientX: 300,
            clientY: 200,
            currentTarget: mockElement,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock mouse event
        } as any as MouseEvent;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'isTileInBounds').and.returnValue(true);

        service.displayTileDescription(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'findPlayerAtPosition').and.returnValue(true);
        service.displayTileDescription(mockEvent);
        expect(service.visible).toBeFalse();
    });

    it('should correctly determine if a position is within map bounds', () => {
        const mapSize = mockGameDataService.gameData.mapData.size;
        expect(service['isTileInBounds']({ x: 2, y: 1 }, mapSize)).toBeTrue();
    });

    it('should return item description if item is present, else tile description', () => {
        const position: Position = { x: 2, y: 2 };
        const mockItemDescription = 'Item description';
        const mockTileDescription = 'Grass tile';

        spyOn(RIGHT_CLICK_ITEM_DESCRIPTION, 'get').and.returnValue(mockItemDescription);
        spyOn(RIGHT_CLICK_TILE_DESCRIPTION, 'get').and.returnValue(mockTileDescription);

        mockGameDataService.getItem.and.returnValue(ItemType.Item1);
        const result = service['getDescription'](position);
        expect(mockGameDataService.getItem).toHaveBeenCalledWith(position);
        expect(result).toBe(`${mockItemDescription}<br><br>${mockTileDescription}`);
    });
});
