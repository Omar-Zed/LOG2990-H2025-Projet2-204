import { inject, Injectable } from '@angular/core';
import { IMAGE_SUFIX, TILE_IMAGES_PREFIX, UNDERLAY_IMAGES_PREFIX } from '@app/consts/images.const';
import { MapVisualData, OverlayTiles, PlayerTileVisual, TileVisualData } from '@app/interfaces/map-visual-data';
import { TileComparisonData } from '@app/interfaces/tile-comparison-data';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { AVATAR_DATA } from '@common/consts/avatar-data.const';
import { SURROUNDING_POSITIONS_DONUT, SURROUNDING_POSITIONS_PLUS, SURROUNDING_POSITIONS_SQUARE } from '@common/consts/map-data.const';
import { MOVE_ANIMATION_DURATION } from '@common/consts/player-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MapData } from '@common/interfaces/map-data';
import { PlayerData } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import {
    ACTION_OVERLAY,
    BRIDGE_SIMILAR_TILES,
    BRIDGE_VARIANTS,
    DEFAULT_MAP_VISUAL_DATA,
    DEFAULT_OVERLAY_TILES,
    DEFAULT_TILE_VISUAL,
    HOVER_MOVE_OVERLAY,
    MAX_GRASS_VARIANT,
    MAX_UNDERLAY_VARIANT,
    PATH_SIMILAR_TILES,
    POSSIBLE_MOVE_OVERLAY,
    RANDOM_NUMBER_BASE,
    RANDOM_NUMBER_MULTIPLIER,
    WATER_SIMILAR_TILES,
} from './map.service.const';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    visualMapData: MapVisualData = structuredClone(DEFAULT_MAP_VISUAL_DATA);
    gameDataService: GameDataService = inject(GameDataService);
    private overlayTiles: OverlayTiles = structuredClone(DEFAULT_OVERLAY_TILES);
    private players: PlayerData[] = [];

    constructor() {
        this.updateAllTiles();
        this.gameDataService.mapUpdate.subscribe((x) => this.onMapUpdate(x));
    }

    setHoverMoves(hoverMoves: Position[]) {
        this.overlayTiles.hoverMoves = hoverMoves;
        this.updateAllTiles();
    }

    setPossibleMoves(possibleMoves: Position[], playerPosition: Position) {
        this.overlayTiles.playerPosition = playerPosition;
        this.overlayTiles.possibleMoves = possibleMoves;
        this.updateAllTiles();
    }

    setActions(actions: Position[], playerPosition: Position) {
        this.overlayTiles.actions = actions;
        this.overlayTiles.playerPosition = playerPosition;
        this.updateAllTiles();
    }

    clearOverlays() {
        this.overlayTiles = structuredClone(DEFAULT_OVERLAY_TILES);
        this.updateAllTiles();
    }

    clearActions() {
        this.overlayTiles.actions = [];
        this.updateAllTiles();
    }

    setPlayers(players: PlayerData[]) {
        this.players = players;
        this.updateAllTiles();
    }

    movePlayer(playerIndex: number, moves: Position[]) {
        for (let i = 1; i < moves.length; i++) {
            setTimeout(this.movePlayerAnimation.bind(this, playerIndex, moves[i]), MOVE_ANIMATION_DURATION * i);
        }
    }

    getTileImage(tiles: TileType[][], position: Position): string {
        const tile = this.gameDataService.getTile(tiles, position);
        const tileVariant = this.getTileVariant(tile, tiles, position);
        const imagePrefix = TILE_IMAGES_PREFIX.get(tile);

        return `${imagePrefix}${tileVariant}${IMAGE_SUFIX}`;
    }

    hasActionOverlay(): boolean {
        return this.overlayTiles.actions.length > 0;
    }
    private updateAllTiles() {
        const mapSize = this.gameDataService.gameData.mapData.size;

        this.visualMapData = {
            tiles: Array.from({ length: mapSize }, () => Array.from({ length: mapSize }, () => ({ ...structuredClone(DEFAULT_TILE_VISUAL) }))),
            size: mapSize,
        };

        for (let x = 0; x < mapSize; x++) {
            for (let y = 0; y < mapSize; y++) {
                this.updateTile({ x, y });
            }
        }
    }

    private movePlayerAnimation(playerIndex: number, move: Position) {
        const player = this.players[playerIndex];
        if (player) {
            player.position = move;
            this.updateAllTiles();
        }
    }

    private getTileVisualData(mapData: MapData, position: Position): TileVisualData {
        return {
            tile: this.getTileImage(mapData.tiles, position),
            underlay: this.getUnderlayImage(mapData.tiles, position),
            item: this.getItem(mapData.items, position),
            player: this.getPlayerAvatar(position),
            overlay: this.getOverlay(position),
        };
    }

    private getOverlay(position: Position): string | null {
        let overlay = null;

        if (this.hasActionOverlay()) {
            overlay = this.getActionOverlay(position);
        } else if (this.hasPossibleMove()) {
            overlay = this.getMoveOverlay(position);
        }

        return overlay;
    }

    private getActionOverlay(position: Position): string | null {
        let overlay = null;

        if (this.isAction(position) && !this.isOnPlayer(position)) {
            overlay = ACTION_OVERLAY;
        }

        return overlay;
    }

    private getMoveOverlay(position: Position): string | null {
        let overlay = null;

        if (this.isOnPlayer(position) || this.isPossibleMove(position)) {
            overlay = this.isHoveringPosition(position) ? HOVER_MOVE_OVERLAY : POSSIBLE_MOVE_OVERLAY;
        }

        return overlay;
    }

    private hasPossibleMove(): boolean {
        return this.overlayTiles.possibleMoves.length > 0;
    }

    private isPossibleMove(position: Position): boolean {
        return Boolean(this.overlayTiles.possibleMoves.find((pos) => pos.x === position.x && pos.y === position.y));
    }

    private isAction(position: Position): boolean {
        return Boolean(this.overlayTiles.actions.find((pos) => pos.x === position.x && pos.y === position.y));
    }

    private isOnPlayer(position: Position): boolean {
        return this.overlayTiles.playerPosition.x === position.x && this.overlayTiles.playerPosition.y === position.y;
    }

    private isHoveringPosition(position: Position): boolean {
        return Boolean(this.overlayTiles.hoverMoves.find((pos) => pos.x === position.x && pos.y === position.y));
    }

    private getPlayerAvatar(position: Position): PlayerTileVisual | null {
        const player = this.players.find((p) => p.position.x === position.x && p.position.y === position.y);

        if (!player) return null;

        return {
            imageFace: AVATAR_DATA[player.avatar].imageFace,
            id: player.id,
        };
    }

    private getTileVariant(tile: TileType, tiles: TileType[][], position: Position): string {
        switch (tile) {
            case TileType.Water:
                return this.getWaterVariant(tiles, position);
            case TileType.Path:
                return this.getPathVariant(tiles, position);
            case TileType.Bridge:
            case TileType.BrokenBridge:
                return this.getBridgeVariant(tiles, position);
            case TileType.Grass:
                return this.getGrassVariant(position);
            default:
                return '0';
        }
    }

    private onMapUpdate(position: Position | null) {
        if (!position) {
            this.updateAllTiles();
        } else {
            this.updateSuroundingTiles(position);
        }
    }

    private updateSuroundingTiles(position: Position) {
        SURROUNDING_POSITIONS_SQUARE.forEach((deltaPosition) => {
            this.updateTile({ x: position.x + deltaPosition.x, y: position.y + deltaPosition.y });
        });
    }

    private updateTile(position: Position) {
        const mapData = this.gameDataService.gameData.mapData;

        if (this.gameDataService.isOutOfBound(mapData.tiles, position)) {
            return;
        }

        const newData = this.getTileVisualData(mapData, position);
        const oldData = this.visualMapData.tiles[position.x][position.y];

        this.updateTileData(oldData, newData);
    }

    private updateTileData(oldData: TileVisualData, newData: TileVisualData) {
        if (oldData.tile !== newData.tile) {
            oldData.tile = newData.tile;
        }
        if (oldData.underlay !== newData.underlay) {
            oldData.underlay = newData.underlay;
        }
        if (oldData.item !== newData.item) {
            oldData.item = newData.item;
        }
        if (oldData.player !== newData.player) {
            oldData.player = newData.player;
        }
        if (oldData.overlay !== newData.overlay) {
            oldData.overlay = newData.overlay;
        }
    }

    private getItem(items: Record<ItemType, Position[]>, position: Position): ItemType | null {
        for (const itemType of Object.values(ItemType)) {
            const itemPositions: Position[] = items[itemType];

            const isItemInTile = itemPositions.some((itemPos) => {
                return itemPos.x === position.x && itemPos.y === position.y;
            });

            if (isItemInTile) {
                return itemType;
            }
        }

        return null;
    }

    private getUnderlayImage(tiles: TileType[][], position: Position): string | null {
        switch (this.gameDataService.getTile(tiles, position)) {
            case TileType.Water:
            case TileType.BrokenBridge:
                return `${UNDERLAY_IMAGES_PREFIX}${this.getUnderlayVariant(position)}${IMAGE_SUFIX}`;
            case TileType.Bridge:
                return `${UNDERLAY_IMAGES_PREFIX}0${IMAGE_SUFIX}`;
            default:
                return null;
        }
    }

    private getWaterVariant(tiles: TileType[][], position: Position): string {
        return this.getSimilarTiles({ tiles, position, deltaPositions: SURROUNDING_POSITIONS_DONUT, tileTypes: WATER_SIMILAR_TILES });
    }

    private getPathVariant(tiles: TileType[][], position: Position): string {
        return this.getSimilarTiles({ tiles, position, deltaPositions: SURROUNDING_POSITIONS_DONUT, tileTypes: PATH_SIMILAR_TILES });
    }

    private getBridgeVariant(tiles: TileType[][], position: Position): string {
        const similarTiles = this.getSimilarTiles({ tiles, position, deltaPositions: SURROUNDING_POSITIONS_PLUS, tileTypes: BRIDGE_SIMILAR_TILES });
        return BRIDGE_VARIANTS.get(similarTiles) || '0';
    }

    private getGrassVariant(position: Position): string {
        return this.getRandomString(position, MAX_GRASS_VARIANT);
    }

    private getUnderlayVariant(position: Position): string {
        return this.getRandomString(position, MAX_UNDERLAY_VARIANT);
    }

    private getRandomString(position: Position, max: number): string {
        const randomNumber = RANDOM_NUMBER_BASE + (position.x + position.y * this.visualMapData.size) * RANDOM_NUMBER_MULTIPLIER;
        return (randomNumber % (max + 1)).toString();
    }

    private getSimilarTiles(tileCompare: TileComparisonData): string {
        const similarTiles = this.compareTiles(tileCompare);
        return similarTiles.map((b) => (b ? '0' : '1')).join('');
    }

    private compareTiles(tileCompare: TileComparisonData): boolean[] {
        return tileCompare.deltaPositions.map((deltaPos) => {
            const newPosition = { x: tileCompare.position.x + deltaPos.x, y: tileCompare.position.y + deltaPos.y };
            return this.compareTile(tileCompare.tiles, newPosition, tileCompare.tileTypes);
        });
    }

    private compareTile(tiles: TileType[][], position: Position, tileTypes: TileType[]): boolean {
        const tile = this.gameDataService.getTile(tiles, position);
        return tileTypes.includes(tile);
    }
}
