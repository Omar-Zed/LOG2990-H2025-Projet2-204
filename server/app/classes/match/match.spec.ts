import { MatchService } from '@app/services/match/match.service';
import { MAX_PLAYERS } from '@common/consts/player-data.const';
import { MapSize } from '@common/interfaces/map-data';
import { MatchData, MatchState } from '@common/interfaces/match-data';
import { Message } from '@common/interfaces/message.enum';
import { MOCK_MATCH_DATAS, MOCK_PLAYER_COMBAT_DATAS } from '@common/test-consts/mock-matches';
import { MOCK_PLAYER_DATAS } from '@common/test-consts/mock-players';
import { SinonSandbox, SinonStubbedInstance, createSandbox, createStubInstance } from 'sinon';
import { Match } from './match';

describe('Match', () => {
    let match: Match;
    let sandbox: SinonSandbox;
    let mockMatchService: SinonStubbedInstance<MatchService>;
    let mockMatchData: MatchData;

    beforeAll(() => {
        sandbox = createSandbox();
        mockMatchService = createStubInstance(MatchService);
    });

    beforeEach(() => {
        mockMatchData = structuredClone(MOCK_MATCH_DATAS[0]);
        match = new Match(mockMatchData, mockMatchService);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be defined', () => {
        expect(match).toBeDefined();
    });

    it('send update should call match service', () => {
        match.sendUpdate();
        expect(mockMatchService.sendUpdate.calledWith(match)).toBe(true);
    });

    it('send message should send update and message', () => {
        match.sendMessage('test message');
        expect(mockMatchService.sendUpdate.called).toBe(true);
        expect(mockMatchService.sendMessage.calledWith(match.data.code, 'test message')).toBe(true);
    });

    it('send message to host should send message', () => {
        match.sendMessageToHost('test message');
        expect(mockMatchService.sendMessage.called).toBe(true);
    });

    it('set timeout should clear existing timeout', () => {
        const callback = sandbox.stub();
        match['timeout'] = setTimeout(() => ({}), 1);
        const timeout = setTimeout(() => ({}), 0);
        sandbox.stub(global, 'setTimeout').returns(timeout);

        match.setTimeout(callback, 0);

        expect(match['timeout']).toBe(timeout);
        expect(match.lastTimeoutStart).toBeInstanceOf(Date);
    });

    it('is state should return true if state matches', () => {
        match.data.state = MatchState.Lobby;

        const result = match.isState([MatchState.Lobby, MatchState.TurnWait]);

        expect(result).toBe(true);
    });

    it('join should add player', () => {
        const playerId = 'newPlayer';
        const initialLength = match.data.players.length;

        match.join(playerId);

        expect(match.data.players.length).toBe(initialLength + 1);
        expect(mockMatchService.sendUpdate.called).toBe(true);
    });

    it('change lock status should lock and kick if true', () => {
        match.data.players.push({ ...structuredClone(MOCK_PLAYER_DATAS[0]), isConnected: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const kickJoiningPlayersStub = sandbox.stub(match as any, 'kickJoiningPlayers');

        match.changeLockStatus(true);

        expect(match.data.lobbyData.isLocked).toBe(true);
        expect(kickJoiningPlayersStub.called).toBe(true);
    });

    it('change lock status should unlock if false', () => {
        match.data.lobbyData.isLocked = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        sandbox.stub(match as any, 'isFull').returns(false);

        match.changeLockStatus(false);

        expect(match.data.lobbyData.isLocked).toBe(false);
    });

    it('leave should handle lobby host leave', () => {
        match.data.state = MatchState.Lobby;
        match.data.lobbyData.hostPlayerIndex = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const hostLeaveLobbyStub = sandbox.stub(match as any, 'hostLeaveLobby');

        match.leave(match.data.players[0].id);

        expect(hostLeaveLobbyStub.calledWith(match.data.players[0].id)).toBe(true);
    });

    it('leave should handle lobby player leave', () => {
        match.data.state = MatchState.Lobby;
        match.data.lobbyData.hostPlayerIndex = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const playerLeaveLobbyStub = sandbox.stub(match as any, 'playerLeaveLobby');

        match.leave(match.data.players[1].id);

        expect(playerLeaveLobbyStub.calledWith(match.data.players[1].id)).toBe(true);
    });

    it('leave should handle stats leave', () => {
        match.data.state = MatchState.Statistics;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const playerLeaveStatsStub = sandbox.stub(match as any, 'playerLeaveStats');

        match.leave(match.data.players[0].id);

        expect(playerLeaveStatsStub.calledWith(match.data.players[0].id)).toBe(true);
    });

    it('leave should handle combat leave', () => {
        match.data.state = MatchState.CombatAnimation;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const playerLeaveCombatStub = sandbox.stub(match as any, 'playerLeaveCombat');

        match.leave(match.data.players[0].id);

        expect(playerLeaveCombatStub.calledWith(match.data.players[0].id)).toBe(true);
    });

    it('get connected player count should return count', () => {
        match.data.players[0].isConnected = true;
        match.data.players[1].isConnected = false;

        const result = match.getConnectedPlayerCount();

        const expectedResult = 3;
        expect(result).toBe(expectedResult);
    });

    it('is full should return true if max reached', () => {
        const mapSize = MapSize.Medium;
        match.data.gameData.mapData.size = mapSize;
        match.data.players = Array(MAX_PLAYERS[mapSize]).fill({ isConnected: true });

        const result = match.isFull();

        expect(result).toBe(true);
    });

    it('is host should return true for host', () => {
        match.data.lobbyData.hostPlayerIndex = 0;

        const result = match.isHost(match.data.players[0].id);

        expect(result).toBe(true);
    });

    it('is active player should return true for active player', () => {
        match.data.playData.activePlayerIndex = 0;

        const result = match.isActivePlayer(match.data.players[0].id);

        expect(result).toBe(true);
    });

    it('get player should return player data', () => {
        const playerId = match.data.players[0].id;

        const result = match.getPlayer(playerId);

        expect(result.id).toBe(playerId);
    });

    it('get player index should return index', () => {
        const playerId = match.data.players[1].id;

        const result = match.getPlayerIndex(playerId);

        expect(result).toBe(1);
    });

    it('clear timeout should clear existing timeout', () => {
        match['timeout'] = setTimeout(() => ({}), 1);
        const clearTimeoutStub = sandbox.stub(global, 'clearTimeout');

        match.clearTimeout();

        expect(clearTimeoutStub.called).toBe(true);
        expect(match['timeout']).toBeNull();
    });

    it('clear bot timeout should clear bot timeout', () => {
        match['botTimeout'] = setTimeout(() => ({}), 1);
        const clearTimeoutStub = sandbox.stub(global, 'clearTimeout');

        match.clearBotTimeout();

        expect(clearTimeoutStub.called).toBe(true);
        expect(match['botTimeout']).toBeNull();
    });

    it('kick player should remove player', () => {
        const playerId = match.data.players[0].id;
        const initialLength = match.data.players.length;

        match.kickPlayer(playerId, 'reason');

        expect(match.data.players.length).toBe(initialLength - 1);
        expect(mockMatchService.playerRemovedFromMatch.calledWith(playerId, 'reason')).toBe(true);
    });

    // Private Methods
    it('kick joining players should kick disconnected', () => {
        match.data.players.push({ ...structuredClone(MOCK_PLAYER_DATAS[0]), id: 'disconnected', isConnected: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const kickPlayerStub = sandbox.stub(match as any, 'kickPlayer');

        match['kickJoiningPlayers']();

        expect(kickPlayerStub.calledWith('disconnected', Message.LockedFromLobby)).toBe(true);
    });

    it('host leave lobby should kick all players', () => {
        match.data.players = [
            { ...structuredClone(MOCK_PLAYER_DATAS[0]), id: 'host' },
            { ...structuredClone(MOCK_PLAYER_DATAS[1]), id: 'player1' },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const kickPlayerStub = sandbox.stub(match as any, 'kickPlayer');

        match['hostLeaveLobby']('host');

        expect(match.data.players.length).toBe(1);
        expect(kickPlayerStub.calledWith('player1', Message.AdminQuit)).toBe(true);
    });

    it('player leave lobby should remove player', () => {
        const playerId = match.data.players[1].id;
        const initialLength = match.data.players.length;

        match['playerLeaveLobby'](playerId);

        expect(match.data.players.length).toBe(initialLength - 1);
        expect(mockMatchService.sendUpdate.called).toBe(true);
    });

    it('player leave combat should kill correct player', () => {
        sandbox.stub(match, 'getPlayerIndex').onFirstCall().returns(0).onSecondCall().returns(1);
        match.data.combatData.playersCombatData = [
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[0]), playerIndex: 0 },
            { ...structuredClone(MOCK_PLAYER_COMBAT_DATAS[1]), playerIndex: 1 },
        ];
        match['playerLeaveCombat']('player1');
        expect(mockMatchService.killPlayerCombat.calledWith(match)).toBe(true);
        match['playerLeaveCombat']('player2');
        expect(mockMatchService.killPlayerCombat.calledWith(match)).toBe(true);
    });

    it('player leave stats should mark disconnected', () => {
        const playerId = match.data.players[0].id;

        match['playerLeaveStats'](playerId);

        expect(match.data.players[0].isConnected).toBe(false);
        expect(mockMatchService.sendMessage.calledWith(match.data.code, `${match.data.players[0].name} a quitté la partie`)).toBe(true);
    });

    it('player leave match should kick last player', () => {
        match.data.players = [
            { ...structuredClone(MOCK_PLAYER_DATAS[0]), id: 'player1', isConnected: true },
            { ...structuredClone(MOCK_PLAYER_DATAS[1]), id: 'player2', isConnected: true },
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const kickPlayerStub = sandbox.stub(match as any, 'kickPlayer');

        match['playerLeaveMatch']('player1');

        expect(match.data.players[0].isConnected).toBe(false);
        expect(kickPlayerStub.calledWith('player2', Message.LastPlayerRemaining)).toBe(true);
    });

    it('player leave match should send message if not last', () => {
        match.data.players.push({ ...structuredClone(MOCK_PLAYER_DATAS[2]), id: 'player3', isConnected: true });

        match['playerLeaveMatch'](match.data.players[0].id);

        expect(match.data.players[0].isConnected).toBe(false);
        expect(mockMatchService.sendMessage.calledWith(match.data.code, `${match.data.players[0].name} a quitté la partie`)).toBe(true);
    });

    it('set bot timeout should set timeout and execute callback', () => {
        const callbackStub = sandbox.stub();
        sandbox.stub(global, 'setTimeout').callsFake((callback: () => void) => {
            callback();
            return {} as NodeJS.Timeout;
        });

        match.setBotTimeout(callbackStub, 0);

        expect(callbackStub.called).toBe(true);
    });
});
