import { SURROUNDING_POSITIONS_PLUS } from '@common/consts/map-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { MatchData } from '@common/interfaces/match-data';
import { DistancesAndPredecessors, NeighborContext, QueueNode, ShortestPath, VisitedQueue } from '@common/interfaces/movement';
import { Position } from '@common/interfaces/position';
import { TILE_COST, TileType } from '@common/interfaces/tile-type.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MapService {
    getPossibleMoves(matchData: MatchData): Position[] {
        const activePlayer = matchData.players[matchData.playData.activePlayerIndex];
        const currentPos = activePlayer.position;
        const movementRange = matchData.playData.movementLeft;
        return this.getPossibleMovesStandard(matchData, currentPos, movementRange);
    }

    getShortestPath(matchData: MatchData, target: Position): ShortestPath {
        if (this.isTileAccessible(matchData, target) && !this.isTileOccupiedByPlayer(matchData, target)) {
            const activePlayer = matchData.players[matchData.playData.activePlayerIndex];
            const startPos = activePlayer.position;
            const { distances, predecessors } = this.calculateDistancesAndPredecessors(matchData, startPos, Infinity);
            if (distances) {
                let path = this.reconstructPath(target, predecessors);
                path = this.stopPathAtItemEncounter(path, matchData);
                if (path) {
                    return { moveCost: distances[path[path.length - 1].x][path[path.length - 1].y], path };
                }
            }
        }
        return { moveCost: Infinity, path: [] };
    }

    getSurroundingPositionsPlus(position: Position): Position[] {
        return SURROUNDING_POSITIONS_PLUS.map((delta) => ({ x: position.x + delta.x, y: position.y + delta.y }));
    }

    getActions(matchData: MatchData): Position[] {
        const playerPosition = matchData.players[matchData.playData.activePlayerIndex].position;
        return this.getSurroundingPositionsPlus(playerPosition).filter((position) => {
            const hasEnemyPlayer = this.hasEnemyPlayer(matchData, position);
            const hasActivatableBridge = this.hasActivatableBridge(matchData, position);
            return hasEnemyPlayer || hasActivatableBridge;
        });
    }

    getPossibleMovesDebug(matchData: MatchData): Position[] {
        const size = matchData.gameData.mapData.size;
        const tiles: Position[] = [];

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const position: Position = { x, y };
                if (
                    this.isTileAccessible(matchData, position) &&
                    !this.isTileOccupiedByPlayer(matchData, position) &&
                    !this.isTileOccupiedByObject(matchData, position)
                ) {
                    tiles.push(position);
                }
            }
        }

        return tiles;
    }

    getNearestEmptyTile(matchData: MatchData, currentPos: Position): Position {
        if (this.isOutOfBounds(matchData, currentPos)) {
            return currentPos;
        }
        const size = matchData.gameData.mapData.size;
        const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
        const queue: Position[] = [];
        queue.push(currentPos);
        visited[currentPos.x][currentPos.y] = true;
        while (queue.length > 0) {
            const pos = queue.shift() as Position;
            if (this.isTileValidForMovement(matchData, pos)) {
                return pos;
            }
            this.enqueueValidNeighbors(matchData, pos, { visited, queue });
        }
        return currentPos;
    }

    getNearestItemDropSpot(matchData: MatchData, currentPos: Position): Position {
        if (this.hasNoItems(matchData, currentPos)) {
            return currentPos;
        }

        const size = matchData.gameData.mapData.size;
        const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
        const queue: Position[] = [];
        queue.push(currentPos);
        visited[currentPos.x][currentPos.y] = true;
        while (queue.length > 0) {
            const pos = queue.shift() as Position;
            if (this.isValidForDrop(matchData, pos)) {
                return pos;
            }
            this.enqueueValidNeighbors(matchData, pos, { visited, queue });
        }
        return currentPos;
    }

    getItemTypeAtPosition(matchData: MatchData, position: Position): ItemType | null {
        for (const [itemType, positions] of Object.entries(matchData.gameData.mapData.items)) {
            if (itemType !== ItemType.Spawn) {
                const foundItem = positions.find((itemPos) => itemPos.x === position.x && itemPos.y === position.y);
                if (foundItem) {
                    return itemType as ItemType;
                }
            }
        }
        return null;
    }

    private hasEnemyPlayer(matchData: MatchData, position: Position): boolean {
        let hasEnemyPlayer = false;
        const player = matchData.players.find((p) => p.position.x === position.x && p.position.y === position.y);
        if (player) {
            if (matchData.gameData.mapData.gameMode === GameMode.CTF) {
                const activePlayer = matchData.players[matchData.playData.activePlayerIndex];
                hasEnemyPlayer = player.team !== activePlayer.team;
            } else {
                hasEnemyPlayer = true;
            }
        }
        return hasEnemyPlayer;
    }

    private isValidForDrop(matchData: MatchData, position: Position): boolean {
        const tile = matchData.gameData.mapData.tiles[position.x][position.y];
        const isWater = tile !== TileType.Water;

        const hasNoItems = this.hasNoItems(matchData, position);
        const hasNoPlayers = !matchData.players.some((player) => player.position.x === position.x && player.position.y === position.y);

        return isWater && hasNoItems && hasNoPlayers;
    }

    private hasNoItems(matchData: MatchData, position: Position): boolean {
        return !Object.values(matchData.gameData.mapData.items).some((positions) =>
            positions.some((pos) => pos.x === position.x && pos.y === position.y),
        );
    }

    private isTileValidForMovement(matchData: MatchData, position: Position): boolean {
        return !this.isTileOccupiedByPlayer(matchData, position) && this.isTileAccessible(matchData, position);
    }

    private enqueueValidNeighbors(matchData: MatchData, position: Position, visitedQueue: VisitedQueue) {
        for (const offset of SURROUNDING_POSITIONS_PLUS) {
            const neighbor = { x: position.x + offset.x, y: position.y + offset.y };
            if (!this.isOutOfBounds(matchData, neighbor) && !visitedQueue.visited[neighbor.x][neighbor.y]) {
                visitedQueue.visited[neighbor.x][neighbor.y] = true;
                visitedQueue.queue.push(neighbor);
            }
        }
    }

    private hasActivatableBridge(matchData: MatchData, position: Position): boolean {
        let isBridge = false;
        if (!this.isOutOfBounds(matchData, position) && !this.hasItem(matchData, position)) {
            const tile = matchData.gameData.mapData.tiles[position.x][position.y];
            isBridge = tile === TileType.Bridge || tile === TileType.BrokenBridge;
        }
        return isBridge;
    }

    private hasItem(matchData: MatchData, position: Position): boolean {
        return Object.values(matchData.gameData.mapData.items).some((positions) =>
            positions.some((pos) => pos.x === position.x && pos.y === position.y),
        );
    }

    private getPossibleMovesStandard(matchData: MatchData, currentPos: Position, movementRange: number): Position[] {
        if (this.isOutOfBounds(matchData, currentPos)) {
            return [];
        }
        const { distances } = this.calculateDistancesAndPredecessors(matchData, currentPos, movementRange);
        const tiles: Position[] = [];
        const size: number = matchData.gameData.mapData.size;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const isDifferentPosition = x !== currentPos.x || y !== currentPos.y;
                if (distances[x][y] <= movementRange && isDifferentPosition) {
                    tiles.push({ x, y });
                }
            }
        }

        return tiles;
    }

    private processNeighbor(context: NeighborContext) {
        const neighbor: Position = { x: context.pos.x + context.offset.x, y: context.pos.y + context.offset.y };

        if (this.isOutOfBounds(context.matchData, neighbor) || this.isTileOccupiedByPlayer(context.matchData, neighbor)) {
            return;
        }

        const moveCost = this.getMovementCost(context.matchData, neighbor);
        const newCost = context.cost + moveCost;

        if (newCost <= context.maxCost && newCost < context.distances[neighbor.x][neighbor.y]) {
            context.distances[neighbor.x][neighbor.y] = newCost;
            context.predecessors.set(neighbor, context.pos);
            context.queue.push({ pos: neighbor, cost: newCost });
        }
    }

    private calculateDistancesAndPredecessors(matchData: MatchData, startPos: Position, maxCost: number): DistancesAndPredecessors {
        const size: number = matchData.gameData.mapData.size;
        const distances: number[][] = Array.from({ length: size }, () => Array(size).fill(Infinity));
        const predecessors: Map<Position, Position> = new Map();
        const queue: QueueNode[] = [{ pos: startPos, cost: 0 }];
        distances[startPos.x][startPos.y] = 0;

        while (queue.length) {
            const { pos, cost } = queue.shift() as QueueNode;
            SURROUNDING_POSITIONS_PLUS.forEach((offset) =>
                this.processNeighbor({ pos, cost, offset, maxCost, size, matchData, distances, predecessors, queue }),
            );
        }
        return { distances, predecessors };
    }

    private reconstructPath(target: Position, predecessors: Map<Position, Position>): Position[] | null {
        const stringPredecessor: Map<string, string> = new Map();

        for (const [key, value] of predecessors.entries()) {
            stringPredecessor.set(this.posToKey(key), this.posToKey(value));
        }

        const path: Position[] = [];
        let currentKey: string = this.posToKey(target);
        while (stringPredecessor.has(currentKey)) {
            path.unshift(this.keyToPos(currentKey));
            currentKey = stringPredecessor.get(currentKey) as string;
        }
        path.unshift(this.keyToPos(currentKey));

        return path;
    }

    private isTileOccupiedByPlayer(matchData: MatchData, position: Position): boolean {
        return matchData.players.some((p) => p.position.x === position.x && p.position.y === position.y);
    }

    private isTileOccupiedByObject(matchData: MatchData, position: Position, ignoreSpawnpoints: boolean = false): boolean {
        const curentPlayer = matchData.players[matchData.playData.activePlayerIndex];
        for (const [itemType, items] of Object.entries(matchData.gameData.mapData.items)) {
            const isCurentPlayerSpawnpoint = curentPlayer.spawnPoint.x === position.x && curentPlayer.spawnPoint.y === position.y;
            const isCapturingFlag = isCurentPlayerSpawnpoint && curentPlayer.items.includes(ItemType.Flag);

            if (ignoreSpawnpoints && itemType === ItemType.Spawn && !isCapturingFlag) {
                continue;
            }

            for (const item of items) {
                if (item.x === position.x && item.y === position.y) {
                    return true;
                }
            }
        }
        return false;
    }

    private isOutOfBounds(matchData: MatchData, position: Position): boolean {
        const size = matchData.gameData.mapData.size;
        const isXOutOfBounds: boolean = position.x < 0 || position.x >= size;
        const isYOutOfBounds: boolean = position.y < 0 || position.y >= size;
        return isXOutOfBounds || isYOutOfBounds;
    }

    private getMovementCost(matchData: MatchData, position: Position): number {
        return TILE_COST[matchData.gameData.mapData.tiles[position.x][position.y]];
    }

    private isTileAccessible(matchData: MatchData, position: Position): boolean {
        let isTileAccessible = false;
        if (!this.isOutOfBounds(matchData, position)) {
            const tile = matchData.gameData.mapData.tiles[position.x][position.y];
            isTileAccessible = tile !== TileType.Water && tile !== TileType.BrokenBridge;
        }
        return isTileAccessible;
    }

    private posToKey(p: Position): string {
        return `${p.x}-${p.y}`;
    }

    private keyToPos(key: string): Position {
        const [x, y] = key.split('-').map(Number);
        return { x, y };
    }

    private stopPathAtItemEncounter(path: Position[], matchData: MatchData): Position[] {
        if (path.length === 0) {
            return [];
        }

        for (let i = 1; i < path.length; i++) {
            if (this.isTileOccupiedByObject(matchData, path[i], true)) {
                return path.slice(0, i + 1);
            }
        }
        return path;
    }
}
