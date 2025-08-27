import { MatchData } from './match-data';
import { Position } from './position';

export interface NeighborContext {
    pos: Position;
    cost: number;
    offset: Position;
    maxCost: number;
    size: number;
    matchData: MatchData;
    distances: number[][];
    predecessors: Map<Position, Position>;
    queue: QueueNode[];
}

export interface QueueNode {
    pos: Position;
    cost: number;
}

export interface DistancesAndPredecessors {
    distances: number[][];
    predecessors: Map<Position, Position>;
}

export interface VisitedQueue {
    visited: boolean[][];
    queue: Position[];
}

export interface ShortestPath {
    moveCost: number;
    path: Position[];
}
