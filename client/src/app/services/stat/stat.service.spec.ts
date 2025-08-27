import { TestBed } from '@angular/core/testing';
import { Order } from '@app/interfaces/stat-data';
import { PlayerStatType } from '@app/interfaces/stat-type.enum';
import { MatchService } from '@app/services/match/match.service';
import { StatService } from '@app/services/stat/stat.service';
import { PERCENTAGE_FACTOR } from '@common/consts/track-data.const';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_MATCH_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_STAT_DATA, MOCK_WINNER_VISUAL_DATA } from '@common/test-consts/mock-stat-data';
import { MOCK_TRACKING_DATA } from '@common/test-consts/mock-track-data';

describe('StatService', () => {
    const mockTrackingData = structuredClone(MOCK_TRACKING_DATA);
    let service: StatService;
    let matchService: MatchService;

    beforeEach(() => {
        matchService = jasmine.createSpyObj('MatchService', [], {
            data: structuredClone(MOCK_MATCH_DATAS[0]),
        });

        TestBed.configureTestingModule({
            providers: [StatService, { provide: MatchService, useValue: matchService }],
        });
        service = TestBed.inject(StatService);
    });

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getTotalTiles').and.callThrough();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getWinnerAssets').and.callThrough();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getGlobalStats').and.callThrough();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getPlayerStats').and.callThrough();
        service.initializeData();
    });

    it('should call all necessary initialization methods', () => {
        expect(service['getTotalTiles']).toHaveBeenCalled();
        expect(service['getWinnerAssets']).toHaveBeenCalled();
        expect(service['getGlobalStats']).toHaveBeenCalled();
        expect(service['getPlayerStats']).toHaveBeenCalled();
    });

    it('should set all required properties', () => {
        expect(service['trackingData']).toBeDefined();
        expect(service['mapTotalTiles']).toBeDefined();
        expect(service.winnerData).toBeDefined();
        expect(service.globalStats).toBeDefined();
        expect(service.playerStats).toBeDefined();
    });

    it('should compute game duration correctly', () => {
        const gameDuration = mockTrackingData.endTime - mockTrackingData.startTime;
        expect(service['getGameDuration']()).toBe(gameDuration);
    });

    it('should get winner assets correctly', () => {
        const winnerData = service['getWinnerAssets']();
        expect(winnerData.name).toBe(structuredClone(MOCK_WINNER_VISUAL_DATA.name));
        expect(winnerData.avatarImage).toBe(structuredClone(MOCK_WINNER_VISUAL_DATA.avatarImage));
        expect(winnerData.tileImage).toBe(structuredClone(MOCK_WINNER_VISUAL_DATA.tileImage));
    });

    it('should compute bridge ratio correctly', () => {
        service['mapTotalTiles'] = { ground: 0, bridge: 4 };
        service['trackingData'].coveredBridges = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ];
        const ratio = service['getBridgeRatio']();
        const EXPECTED_RATIO = 0.5;
        expect(ratio).toBe(Number((EXPECTED_RATIO * PERCENTAGE_FACTOR).toFixed(2)));
    });

    it('should return 0 for bridge ratio when no bridges exist', () => {
        service['mapTotalTiles'] = { bridge: 0, ground: 4 };
        const ratio = service['getBridgeRatio']();
        expect(ratio).toBe(0);
    });

    it('should compute tile ratio correctly', () => {
        service['mapTotalTiles'] = { ground: 10, bridge: 0 };
        const coveredTiles = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ];
        const ratio = service['getTileRatio'](coveredTiles);
        const EXPECTED_RATIO = 0.2;
        expect(ratio).toBe(Number((EXPECTED_RATIO * PERCENTAGE_FACTOR).toFixed(2)));
    });

    it('should count total tiles correctly', () => {
        matchService.data.gameData.mapData.tiles = [
            [TileType.Path, TileType.Bridge],
            [TileType.Grass, TileType.BrokenBridge],
            [TileType.Bush, TileType.Water],
        ];
        const totalTiles = service['getTotalTiles']();
        const groundTilesCount = 3;
        const bridgeTilescount = 2;
        expect(totalTiles.ground).toBe(groundTilesCount);
        expect(totalTiles.bridge).toBe(bridgeTilescount);
    });

    it('should sort player stats correctly', () => {
        service.playerStats = structuredClone(MOCK_PLAYER_STAT_DATA);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        let playerVictories = [5, 9, 1];
        service.playerStats.forEach((player, i) => (player.VICTOIRES = playerVictories[i]));
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        playerVictories = [9, 5, 1];
        service.sortPlayerStatsBy(PlayerStatType.Victories, Order.Ascending);
        expect(service.playerStats.map((p) => p[PlayerStatType.Victories])).toEqual(playerVictories);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        playerVictories = [1, 5, 9];
        service.sortPlayerStatsBy(PlayerStatType.Victories, Order.Descending);
        expect(service.playerStats.map((p) => p[PlayerStatType.Victories])).toEqual(playerVictories);
    });

    it('should compute player stats correctly', () => {
        const mockTileRatio = 42.3;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getTileRatio').and.returnValue(mockTileRatio);

        const playerStats = service['getPlayerStats']();

        playerStats.forEach((player, index) => {
            const mockPlayer = mockTrackingData.players[index];
            expect(player.id).toBe(mockPlayer.id);
            expect(player.name).toBe(mockPlayer.name);
            expect(player[PlayerStatType.DiscoveredItemsCount]).toBe(mockPlayer.pickedUpItems.length);
            expect(player[PlayerStatType.VisitedTilesRatio]).toBe(mockTileRatio);
            expect(player[PlayerStatType.Combats]).toBe(mockPlayer.combats);
            expect(player[PlayerStatType.Victories]).toBe(mockPlayer.victories);
            expect(player[PlayerStatType.Defeats]).toBe(mockPlayer.defeats);
            expect(player[PlayerStatType.Escapes]).toBe(mockPlayer.escapes);
            expect(player[PlayerStatType.HpInflicted]).toBe(mockPlayer.hpInflicted);
            expect(player[PlayerStatType.HpLost]).toBe(mockPlayer.hpLost);
        });

        expect(service['getTileRatio']).toHaveBeenCalledTimes(mockTrackingData.players.length);
        mockTrackingData.players.forEach((player) => {
            expect(service['getTileRatio']).toHaveBeenCalledWith(player.coveredGroundTiles);
        });
    });

    it('should compute global stats correctly', () => {
        const mockDuration = 1000;
        const mockBridgeRatio = 75.5;
        const mockTileRatio = 42.3;
        const mockRounds = 5;
        const mockFlagHolders = 3;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getGameDuration').and.returnValue(mockDuration);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getBridgeRatio').and.returnValue(mockBridgeRatio);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'getTileRatio').and.returnValue(mockTileRatio);

        service['trackingData'] = { ...service['trackingData'], rounds: mockRounds, flagHoldersCount: mockFlagHolders, coveredGroundTiles: [] };

        const globalStats = service['getGlobalStats']();

        expect(service['getGameDuration']).toHaveBeenCalled();
        expect(service['getBridgeRatio']).toHaveBeenCalled();
        expect(service['getTileRatio']).toHaveBeenCalledWith(service['trackingData'].coveredGroundTiles);

        expect(globalStats.gameDuration).toBe(mockDuration);
        expect(globalStats.toggledBridgesRatio).toBe(mockBridgeRatio);
        expect(globalStats.visitedTilesRatio).toBe(mockTileRatio);
        expect(globalStats.rounds).toBe(mockRounds);
        expect(globalStats.flagHoldersCount).toBe(mockFlagHolders);
    });

    it('should compute ratio correctly', () => {
        const testCases = [
            { current: 1, total: 2 },
            { current: 3, total: 4 },
            { current: 0, total: 5 },
            { current: 5, total: 5 },
        ];

        testCases.forEach(({ current, total }) => {
            const ratio = service['getRatio'](current, total);
            const expected = Math.round((current / total) * PERCENTAGE_FACTOR);
            expect(ratio).toBe(expected);
        });
    });
});
