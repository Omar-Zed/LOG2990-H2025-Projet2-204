import { Injectable } from '@angular/core';
import { SURROUNDING_POSITIONS_PLUS } from '@common/consts/map-data.const';
import { GameMode } from '@common/interfaces/map-data';
import { MatchData } from '@common/interfaces/match-data';
import { DistancesAndPredecessors, NeighborContext, QueueNode, ShortestPath } from '@common/interfaces/movement';
import { Position } from '@common/interfaces/position';
import { TILE_COST, TileType } from '@common/interfaces/tile-type.enum';

@Injectable({
    providedIn: 'root',
})
export class MovementService {
    getPossibleMoves(matchData: MatchData): Position[] {
        const activePlayer = matchData.players[matchData.playData.activePlayerIndex];
        const currentPos = activePlayer.position;
        const movementRange = matchData.playData.movementLeft;
        return this.getPossibleMovesStandard(matchData, currentPos, movementRange);
    }

    getShortestPath(matchData: MatchData, target: Position): ShortestPath {
        let shortestPath: ShortestPath = { moveCost: Infinity, path: [] };
        if (!this.isOutOfBounds(matchData, target)) {
            const activePlayer = matchData.players[matchData.playData.activePlayerIndex];
            const startPos = activePlayer.position;
            const { distances, predecessors } = this.calculateDistancesAndPredecessors(matchData, startPos, Infinity);
            const path = this.reconstructPath(target, predecessors);
            if (path) {
                shortestPath = { moveCost: distances[target.x][target.y], path };
            }
        }
        return shortestPath;
    }

    getActions(matchData: MatchData): Position[] {
        const playerPosition = matchData.players[matchData.playData.activePlayerIndex].position;
        return SURROUNDING_POSITIONS_PLUS.map((delta) => ({ x: playerPosition.x + delta.x, y: playerPosition.y + delta.y })).filter((position) => {
            const hasEnemyPlayer = this.hasEnemyPlayer(matchData, position);
            const hasActivatableBridge = this.hasActivatableBridge(matchData, position);
            return hasEnemyPlayer || hasActivatableBridge;
        });
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

    private hasItem(matchData: MatchData, position: Position): boolean {
        return Object.values(matchData.gameData.mapData.items).some((positions) =>
            positions.some((pos) => pos.x === position.x && pos.y === position.y),
        );
    }

    private hasActivatableBridge(matchData: MatchData, position: Position): boolean {
        let isBridge = false;
        if (!this.isOutOfBounds(matchData, position) && !this.hasItem(matchData, position)) {
            const tile = matchData.gameData.mapData.tiles[position.x][position.y];
            isBridge = tile === TileType.Bridge || tile === TileType.BrokenBridge;
        }
        return isBridge;
    }

    private getPossibleMovesStandard(matchData: MatchData, currentPos: Position, movementRange: number): Position[] {
        const tiles = [];
        if (!this.isOutOfBounds(matchData, currentPos)) {
            const { distances } = this.calculateDistancesAndPredecessors(matchData, currentPos, movementRange);
            const size: number = matchData.gameData.mapData.size;
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const isDifferentPosition = x !== currentPos.x || y !== currentPos.y;
                    if (distances[x][y] <= movementRange && isDifferentPosition) {
                        tiles.push({ x, y });
                    }
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

        return path.length > 1 ? path : null;
    }

    private isTileOccupiedByPlayer(matchData: MatchData, position: Position): boolean {
        return matchData.players.some((p) => p.position.x === position.x && p.position.y === position.y);
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

    private posToKey(p: Position): string {
        return `${p.x}-${p.y}`;
    }

    private keyToPos(key: string): Position {
        const [x, y] = key.split('-').map(Number);
        return { x, y };
    }
}
