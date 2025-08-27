import { Injectable, inject } from '@angular/core';
import { RIGHT_CLICK_TILE_DESCRIPTION } from '@app/consts/tile-data.const';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { MatchService } from '@app/services/match/match.service';
import { RIGHT_CLICK_ITEM_DESCRIPTION } from '@common/consts/item-data.const';
import { OUTSIDE_OF_MAP } from '@common/consts/map-data.const';
import { PlayerData } from '@common/interfaces/player-data';
import { Position } from '@common/interfaces/position';

@Injectable({
    providedIn: 'root',
})
export class TileDescriptionService {
    visible: boolean = false;
    description: string = '';
    position: Position = structuredClone(OUTSIDE_OF_MAP);

    private matchService: MatchService = inject(MatchService);
    private gameDataService: GameDataService = inject(GameDataService);

    displayTileDescription(event: MouseEvent): number | null {
        if (!this.matchService.canUseDebugMove()) {
            event.preventDefault();

            const mapContainer = event.currentTarget as HTMLElement;
            const mapRect = mapContainer.getBoundingClientRect();
            const mapSize: number = this.gameDataService.gameData.mapData.size;
            const tileCoords = this.calculateTileCoordinates(event, mapRect, mapSize);

            if (this.isTileInBounds(tileCoords, mapSize)) {
                const playerOnTile = this.findPlayerAtPosition(tileCoords);
                if (playerOnTile) {
                    this.visible = false;
                    return this.matchService.data.players.findIndex((p) => p.id === playerOnTile.id);
                }
                this.position = this.calculateDescriptionPosition(tileCoords, mapRect, mapSize);
                this.description = this.getDescription(tileCoords);
                this.visible = true;
            }
        }
        return null;
    }

    hideTileDescription() {
        this.visible = false;
    }

    private calculateTileCoordinates(event: MouseEvent, mapRect: DOMRect, mapSize: number): Position {
        const relativeX = event.clientX - mapRect.left;
        const relativeY = event.clientY - mapRect.top;

        const tileWidth = mapRect.width / mapSize;
        const tileHeight = mapRect.height / mapSize;

        return {
            x: Math.floor(relativeY / tileHeight),
            y: Math.floor(relativeX / tileWidth),
        };
    }

    private isTileInBounds(position: Position, mapSize: number): boolean {
        return position.x >= 0 && position.x < mapSize && position.y >= 0 && position.y < mapSize;
    }

    private calculateDescriptionPosition(position: Position, mapRect: DOMRect, mapSize: number): Position {
        const tileWidth = mapRect.width / mapSize;
        const tileHeight = mapRect.height / mapSize;

        const tileTopRightX = mapRect.left + (position.y + 1) * tileWidth;
        const tileTopRightY = mapRect.top + position.x * tileHeight;

        const offset = 5;

        return {
            x: tileTopRightX + offset,
            y: tileTopRightY + offset,
        };
    }

    private getDescription(position: Position): string {
        const tileType = this.gameDataService.getTileFromPosition(position);
        let description = RIGHT_CLICK_TILE_DESCRIPTION.get(tileType) as string;

        const itemOnTile = this.gameDataService.getItem(position);
        if (itemOnTile) {
            description = `${RIGHT_CLICK_ITEM_DESCRIPTION.get(itemOnTile)}<br><br>${description}`;
        }

        return description;
    }

    private findPlayerAtPosition(position: Position): PlayerData | null {
        let playerAtPosition = null;

        for (const player of this.matchService.data.players) {
            if (player.position.x === position.x && player.position.y === position.y) {
                playerAtPosition = player;
            }
        }

        return playerAtPosition;
    }
}
