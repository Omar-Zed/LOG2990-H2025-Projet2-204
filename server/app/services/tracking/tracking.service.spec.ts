import { Match } from '@app/classes/match/match';
import { CombatService } from '@app/services/combat/combat.service';
import { MatchService } from '@app/services/match/match.service';
import { DEFAULT_PLAYER_TRACKING_DATA } from '@common/consts/track-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { MatchData } from '@common/interfaces/match-data';
import { Team } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_MATCH_DATAS, MOCK_PLAYER_COMBAT_DATAS } from '@common/test-consts/mock-matches';
import { Test, TestingModule } from '@nestjs/testing';
import * as sinon from 'sinon';
import { TrackingService } from './tracking.service';

describe('TrackingService', () => {
    let service: TrackingService;
    let match: Match;
    let mockMatchService: sinon.SinonStubbedInstance<MatchService>;
    let mockCombatService: sinon.SinonStubbedInstance<CombatService>;
    let matchData: MatchData;

    beforeEach(async () => {
        mockMatchService = sinon.createStubInstance(MatchService);
        mockCombatService = sinon.createStubInstance(CombatService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TrackingService,
                { provide: MatchService, useValue: mockMatchService },
                { provide: CombatService, useValue: mockCombatService },
            ],
        }).compile();

        service = module.get<TrackingService>(TrackingService);
        matchData = structuredClone(MOCK_MATCH_DATAS[0]);
        match = new Match(matchData, mockMatchService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should update start and stop tracking times', () => {
        const beforeStartTime = Date.now();
        service.startTrackingMatch(match);
        expect(matchData.trackingData.startTime).toBeGreaterThanOrEqual(beforeStartTime);
        expect(matchData.trackingData.startTime).toBeLessThanOrEqual(Date.now());
        service.stopTrackingMatch(match);
        expect(matchData.trackingData.endTime).toBeGreaterThanOrEqual(matchData.trackingData.startTime);
        expect(matchData.trackingData.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should initialize tracking data with only connected players', () => {
        matchData.players[0].isConnected = false;
        matchData.players[1].isConnected = false;
        const nLobbyPlayers = matchData.players.length;
        const nDiconnected = 2;

        service.startTrackingMatch(match);

        expect(matchData.trackingData.players.length).toBe(nLobbyPlayers - nDiconnected);
        expect(matchData.trackingData.players[0].id).toBe(matchData.players[nDiconnected].id);
        expect(matchData.trackingData.players[1].id).toBe(matchData.players[nDiconnected + 1].id);
    });

    it('should initialize player tracking data with default values for all connected players', () => {
        matchData.players[0].isConnected = true;
        matchData.players[1].isConnected = true;
        const expectedPlayerCount = matchData.players.filter((player) => player.isConnected).length;

        service.startTrackingMatch(match);

        expect(matchData.trackingData.players.length).toBe(expectedPlayerCount);

        matchData.trackingData.players.forEach((playerStats) => {
            const originalPlayer = matchData.players.find((p) => p.id === playerStats.id);
            expect(playerStats).toEqual({
                ...DEFAULT_PLAYER_TRACKING_DATA,
                id: originalPlayer.id,
                name: originalPlayer.name,
                team: originalPlayer.team,
                coveredGroundTiles: [originalPlayer.spawnPoint],
            });
            expect(playerStats.hpInflicted).toBe(0);
            expect(playerStats.hpLost).toBe(0);
            expect(playerStats.victories).toBe(0);
            expect(playerStats.defeats).toBe(0);
            expect(playerStats.escapes).toBe(0);
            expect(playerStats.combats).toBe(0);
            expect(playerStats.pickedUpItems).toEqual([]);
        });
    });

    it('should set start time when tracking begins', () => {
        const beforeTime = Date.now();

        service.startTrackingMatch(match);

        expect(matchData.trackingData.startTime).toBeGreaterThanOrEqual(beforeTime);
        expect(matchData.trackingData.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should update HPs correctly when the attack result is lower than current health', () => {
        const attackerCombat = match.data.combatData.playersCombatData[0];
        const attackedCombat = match.data.combatData.playersCombatData[1];
        const attackerPlayer = match.data.players[attackerCombat.playerIndex];
        const attackedPlayer = match.data.players[attackedCombat.playerIndex];
        const attackResult = attackedCombat.currentHealth - 1;
        const realDamage = attackResult;

        mockCombatService.getActivePlayerData.returns(attackerCombat);
        mockCombatService.getInactivePlayerData.returns(attackedCombat);

        service.updateHps(match, attackResult);
        expect(service['getPlayerStat'](match, attackerPlayer.id).hpInflicted).toEqual(realDamage);
        expect(service['getPlayerStat'](match, attackedPlayer.id).hpLost).toEqual(attackResult);
    });

    it('should update HPs correctly when the attacker is higher than current health', () => {
        const attackerCombat = match.data.combatData.playersCombatData[0];
        const attackedCombat = match.data.combatData.playersCombatData[1];
        const attackerPlayer = match.data.players[attackerCombat.playerIndex];
        const attackedPlayer = match.data.players[attackedCombat.playerIndex];
        const attackResult = attackedCombat.currentHealth + 1;

        mockCombatService.getActivePlayerData.returns(attackerCombat);
        mockCombatService.getInactivePlayerData.returns(attackedCombat);

        expect(match).toBeDefined();
        service.updateHps(match, attackResult);
        const realDamage = attackedCombat.currentHealth;
        expect(service['getPlayerStat'](match, attackerPlayer.id).hpInflicted).toEqual(realDamage);
        expect(service['getPlayerStat'](match, attackedPlayer.id).hpLost).toEqual(realDamage);
    });

    it('should update escapes correctly', () => {
        const playerCombat = structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]);
        service.updateEscapes(match, playerCombat);
        expect(service['getPlayerStat'](match, matchData.players[0].id).escapes).toEqual(1);
    });

    it('should update combats correctly', () => {
        const winner = structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]);
        const loser = structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]);
        service.updateCombats(match, winner, loser);
        expect(service['getPlayerStat'](match, matchData.players[0].id).victories).toEqual(1);
        expect(service['getPlayerStat'](match, matchData.players[1].id).defeats).toEqual(1);
        expect(service['getPlayerStat'](match, matchData.players[0].id).combats).toEqual(1);
        expect(service['getPlayerStat'](match, matchData.players[1].id).combats).toEqual(1);
    });

    it('should update rounds correctly', () => {
        const initialRounds = matchData.trackingData.rounds;
        service.updateRounds(match);
        expect(matchData.trackingData.rounds).toEqual(initialRounds + 1);
    });

    it('should update winner correctly', () => {
        const winnerPlayer = matchData.players[0];
        service.updateWinner(match, winnerPlayer);
        expect(matchData.trackingData.matchWinner).toEqual({
            id: winnerPlayer.id,
            name: winnerPlayer.name || undefined,
            avatar: winnerPlayer.avatar,
            tile: matchData.combatData.playersCombatData[0].standingTile,
        });
    });

    it('should update winner with team name in CTF mode', () => {
        const winnerPlayer = matchData.players[0];
        winnerPlayer.team = Team.Blue;
        matchData.gameData.mapData.gameMode = GameMode.CTF;

        service.updateWinner(match, winnerPlayer);

        expect(matchData.trackingData.matchWinner).toEqual({
            id: winnerPlayer.id,
            name: winnerPlayer.team,
            avatar: winnerPlayer.avatar,
            tile: matchData.combatData.playersCombatData[0].standingTile,
        });
    });

    it('should update items and flagHoldersCount correctly', () => {
        matchData.gameData.mapData.gameMode = GameMode.CTF;
        const playerId = matchData.players[0].id;
        const initialPickers = matchData.trackingData.flagHoldersCount;
        service.updateItems(match, ItemType.Flag, playerId);
        expect(service['getPlayerStat'](match, playerId).pickedUpItems).toContain(ItemType.Flag);
        expect(matchData.trackingData.flagHoldersCount).toEqual(initialPickers + 1);
        service.updateItems(match, ItemType.Flag, playerId);
        expect(matchData.trackingData.flagHoldersCount).toEqual(initialPickers + 1);
    });

    it('should update ground tiles correctly when tile is not Bridge', () => {
        const playerId = matchData.players[0].id;
        const positions = [{ x: 0, y: 0 }];
        service.updateGroundTiles(match, positions, playerId);
        expect(matchData.trackingData.coveredGroundTiles).toContainEqual({ x: 0, y: 0 });
        expect(service['getPlayerStat'](match, playerId).coveredGroundTiles).toContainEqual({ x: 0, y: 0 });
        service.updateGroundTiles(match, positions, playerId);
        const count = matchData.trackingData.coveredGroundTiles.filter((p: Position) => p.x === 0 && p.y === 0).length;
        expect(count).toEqual(1);
    });

    it('should not update ground tiles if tile is Bridge', () => {
        const playerId = matchData.players[0].id;
        matchData.gameData.mapData.tiles[0][0] = TileType.Bridge;

        const positions = [{ x: 0, y: 0 }];
        service.updateGroundTiles(match, positions, playerId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const addPosIfNewSpy = jest.spyOn(service as any, 'addPosIfNew');
        expect(addPosIfNewSpy).not.toBeCalled();
        expect(matchData.trackingData.coveredGroundTiles.length).toBe(0);
    });

    it('should update toggled bridges correctly', () => {
        const position = { x: 1, y: 1 };
        service.updateToggledBridges(match, position);
        expect(matchData.trackingData.coveredBridges).toContainEqual({ x: 1, y: 1 });
        service.updateToggledBridges(match, position);
        const count = matchData.trackingData.coveredBridges.filter((p: Position) => p.x === 1 && p.y === 1).length;
        expect(count).toEqual(1);
    });
});
