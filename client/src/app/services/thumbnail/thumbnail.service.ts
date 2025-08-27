import { inject, Injectable } from '@angular/core';
import { ITEM_IMAGES } from '@app/consts/images.const';
import { MapService } from '@app/services/map/map.service';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MapData, MapSize } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';
import { BACKGROUND_COLOR, BATCH_DELAY, BATCH_SIZE, JOB_MAX_DELAY, JOB_MIN_DELAY, TILE_SIZE } from './thumbnail.service.const';

@Injectable({
    providedIn: 'root',
})
export class ThumbnailService {
    private mapService: MapService = inject(MapService);

    async getThumbnail(map: MapData, loadItems: boolean): Promise<string> {
        await new Promise((r) => setTimeout(r, this.getRandomNumber(JOB_MIN_DELAY, JOB_MAX_DELAY)));

        const { canvas, context } = this.createCanvas(map.size);
        const tilesPromises: Promise<[HTMLImageElement, number, number] | null>[] = [];
        const itemsPromises: Promise<[HTMLImageElement, number, number] | null>[] = [];

        await this.loadTiles(map, tilesPromises);
        if (loadItems) {
            this.loadItems(map, itemsPromises);
        }

        await this.renderImages(context, tilesPromises);
        await this.renderImages(context, itemsPromises);

        return canvas.toDataURL('image/png');
    }

    private getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    private createCanvas(size: MapSize): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;

        canvas.width = size * TILE_SIZE;
        canvas.height = size * TILE_SIZE;

        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);

        return { canvas, context };
    }

    private async loadTiles(map: MapData, promises: Promise<[HTMLImageElement, number, number] | null>[]): Promise<void> {
        const totalTiles = map.tiles.length * map.tiles[0].length;
        let tileIndex = 0;
        return new Promise((resolve) => {
            const processBatch = () => {
                const endIndex = Math.min(tileIndex + BATCH_SIZE, totalTiles);
                while (tileIndex < endIndex) {
                    const x = Math.floor(tileIndex / map.tiles[0].length);
                    const y = tileIndex % map.tiles[0].length;
                    const imagePath = this.mapService.getTileImage(map.tiles, { x, y });
                    promises.push(this.loadImage(imagePath, x, y));
                    tileIndex++;
                }
                if (tileIndex < totalTiles) {
                    setTimeout(processBatch, BATCH_DELAY);
                } else {
                    resolve();
                }
            };
            processBatch();
        });
    }

    private loadItems(map: MapData, promises: Promise<[HTMLImageElement, number, number] | null>[]) {
        for (const [itemType, positions] of Object.entries(map.items) as [ItemType, Position[]][]) {
            const itemImage = ITEM_IMAGES.get(itemType) as string;
            if (itemImage) {
                for (const position of positions) {
                    promises.push(this.loadImage(itemImage, position.x, position.y));
                }
            }
        }
    }

    private async renderImages(context: CanvasRenderingContext2D, promises: Promise<[HTMLImageElement, number, number] | null>[]) {
        const resolved = await Promise.all(promises);
        let index = 0;
        return new Promise<void>((resolve) => {
            const renderBatch = () => {
                const end = Math.min(index + BATCH_SIZE, resolved.length);
                for (; index < end; index++) {
                    const result = resolved[index];
                    if (result) {
                        const [image, x, y] = result;
                        context.drawImage(image, y * TILE_SIZE, x * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
                if (index < resolved.length) {
                    setTimeout(renderBatch, BATCH_DELAY);
                } else {
                    resolve();
                }
            };
            renderBatch();
        });
    }

    private async loadImage(imageUrl: string, x: number, y: number): Promise<[HTMLImageElement, number, number] | null> {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = imageUrl;
            image.onload = () => resolve([image, x, y]);
            image.onerror = () => resolve(null);
        });
    }
}
