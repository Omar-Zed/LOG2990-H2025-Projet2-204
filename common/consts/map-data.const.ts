import { ItemType } from '../interfaces/item-type.enum';
import { Position } from '../interfaces/position';

export const OUTSIDE_OF_MAP: Position = { x: -2, y: -2 };

export const SURROUNDING_POSITIONS_PLUS: Position[] = [
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
];

export const SURROUNDING_POSITIONS_SQUARE: Position[] = [
    { x: -1, y: -1 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -1 },
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
];

export const SURROUNDING_POSITIONS_DONUT: Position[] = [
    { x: -1, y: -1 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
];

export const REGULAR_ITEMS = [ItemType.Item1, ItemType.Item2, ItemType.Item3, ItemType.Item4, ItemType.Item5, ItemType.Item6];
