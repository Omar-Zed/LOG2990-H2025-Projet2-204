import { Match } from '@app/classes/match/match';
import { CombatService } from '@app/services/combat/combat.service';
import { DEFAULT_PLAYER_TRACKING_DATA } from '@common/consts/track-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { PlayerCombatData } from '@common/interfaces/match-data';
import { PlayerData } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { TrackingPlayerData } from '@common/interfaces/track-data';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class TrackingService {
    @Inject(forwardRef(() => CombatService)) private readonly combatService: CombatService;

    startTrackingMatch(match: Match) {
        match.data.players.forEach((player) => {
            match.data.trackingData.coveredGroundTiles.push(player.position);
        });
        match.data.trackingData.startTime = Date.now();
        match.data.trackingData.players = match.data.players
            .filter((player) => player.isConnected)
            .map((player) => ({
                ...structuredClone(DEFAULT_PLAYER_TRACKING_DATA),
                id: player.id,
                name: player.name,
                team: player.team,
                coveredGroundTiles: [player.spawnPoint],
            }));
    }

    stopTrackingMatch(match: Match) {
        match.data.trackingData.endTime = Date.now();
    }

    updateHps(match: Match, attackResult: number) {
        const attacked = this.combatService.getInactivePlayerData(match);
        const attacker = this.combatService.getActivePlayerData(match);
        const attackedId = match.data.players[attacked.playerIndex].id;
        this.getPlayerStat(match, attackedId).hpLost += Math.min(attackResult, attacked.currentHealth);
        const attackerId = match.data.players[attacker.playerIndex].id;
        this.getPlayerStat(match, attackerId).hpInflicted += Math.min(attackResult, attacked.currentHealth);
    }

    updateEscapes(match: Match, player: PlayerCombatData) {
        const escaperId = match.data.players[player.playerIndex].id;
        this.getPlayerStat(match, escaperId).escapes++;
    }

    updateCombats(match: Match, winner: PlayerCombatData, loser: PlayerCombatData) {
        const winnerId = match.data.players[winner.playerIndex].id;
        const loserId = match.data.players[loser.playerIndex].id;
        this.getPlayerStat(match, winnerId).victories++;
        this.getPlayerStat(match, loserId).defeats++;
        this.getPlayerStat(match, winnerId).combats++;
        this.getPlayerStat(match, loserId).combats++;
    }

    updateRounds(match: Match) {
        ++match.data.trackingData.rounds;
    }

    updateWinner(match: Match, winner: PlayerData) {
        const standingTile = match.data.gameData.mapData.tiles[winner.position.x][winner.position.y];
        const name = match.data.gameData.mapData.gameMode === GameMode.FFA ? winner.name : winner.team;
        match.data.trackingData.matchWinner = { id: winner.id, avatar: winner.avatar, name, tile: standingTile };
    }

    updateItems(match: Match, item: ItemType, playerId: string) {
        const itemList = this.getPlayerStat(match, playerId).pickedUpItems;
        const isNewItem = !itemList.includes(item);
        if (isNewItem) {
            const gameMode = match.data.gameData.mapData.gameMode;
            if (gameMode === GameMode.CTF && item === ItemType.Flag) {
                match.data.trackingData.flagHoldersCount++;
            }
            itemList.push(item);
        }
    }

    updateGroundTiles(match: Match, positions: Position[], playerId: string) {
        const tilePositions = match.data.gameData.mapData.tiles;
        for (const position of positions) {
            const targetTile = tilePositions[position.x][position.y];
            if (targetTile !== TileType.Bridge) {
                let visitedGroundTiles = match.data.trackingData.coveredGroundTiles;
                this.addPosIfNew(position, visitedGroundTiles);
                visitedGroundTiles = this.getPlayerStat(match, playerId).coveredGroundTiles;
                this.addPosIfNew(position, visitedGroundTiles);
            }
        }
    }

    updateToggledBridges(match: Match, position: Position) {
        const visitedBridges = match.data.trackingData.coveredBridges;
        this.addPosIfNew(position, visitedBridges);
    }

    private getPlayerStat(match: Match, playerId: string): TrackingPlayerData {
        return match.data.trackingData.players.find((player) => player.id === playerId);
    }

    private addPosIfNew(targetPosition: Position, visitedPositions: Position[]) {
        const isNewPosition = !visitedPositions.some((position) => targetPosition.x === position.x && targetPosition.y === position.y);
        if (isNewPosition) {
            visitedPositions.push(targetPosition);
        }
    }
}
