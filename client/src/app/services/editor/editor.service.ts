import { inject, Injectable } from '@angular/core';
import { ITEM_POOL_HIGHEST_ITEM, SHARED_ITEM_POOL } from '@app/consts/editor-data.const';
import { PopupMessage } from '@app/consts/popup-message.const';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { GameSaveService } from '@app/services/game-save/game-save.service';
import { GameValidationService } from '@app/services/game-validation/game-validation.service';
import { PopupService } from '@app/services/popup/popup.service';
import { MAX_ITEM_COUNT } from '@common/consts/item-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { GameMode } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EditorService {
    private lastPickPosition: Position | null = null;
    private gameDataService: GameDataService = inject(GameDataService);
    private gameValidationService: GameValidationService = inject(GameValidationService);
    private gameSaveService: GameSaveService = inject(GameSaveService);
    private popupService: PopupService = inject(PopupService);

    pickItem(position: Position) {
        this.gameDataService.removeItem(position);
        this.lastPickPosition = position;
    }

    resetLastPicked() {
        this.lastPickPosition = null;
    }

    placeItem(item: ItemType, position: Position) {
        const tile = this.gameDataService.getTileFromPosition(position);

        const canPlaceItem = ![TileType.Water, TileType.Bridge, TileType.BrokenBridge].includes(tile);
        if (canPlaceItem) {
            this.gameDataService.addItem(item, position);
        } else if (this.lastPickPosition) {
            this.gameDataService.addItem(item, this.lastPickPosition);
        }

        this.resetLastPicked();
    }

    paintTile(tile: TileType, position: Position) {
        const oldTile = this.gameDataService.getTileFromPosition(position);

        if (tile === TileType.BrokenBridge && oldTile === TileType.BrokenBridge) {
            tile = TileType.Bridge;
        }

        if (tile !== oldTile) {
            this.gameDataService.editTile(tile, position);
            const tileCannotHaveItem = [TileType.Water, TileType.Bridge, TileType.BrokenBridge].includes(tile);
            if (tileCannotHaveItem) {
                this.gameDataService.removeItem(position);
            }
        }
    }

    async saveGame(): Promise<boolean> {
        const gameData = this.gameDataService.gameData;
        gameData.name = gameData.name.trim();

        const validationResult = this.gameValidationService.validateGame(this.gameDataService.gameData);
        if (validationResult) {
            const message = this.gameValidationService.getValidationErrorMessage(validationResult);
            this.popupService.showPopup({ message, hasCloseButton: true, isConfirmation: false });
            return false;
        }

        const isNameUnique = await firstValueFrom(this.gameSaveService.isNameUnique(gameData.name, gameData._id));
        if (!isNameUnique) {
            this.popupService.showPopup({ message: PopupMessage.NameAlreadyExists, hasCloseButton: true, isConfirmation: false });
            return false;
        }

        return await this.saveGameOnServer();
    }

    getRemainingItemCount(item: ItemType, activeItem: ItemType | null): number {
        const currentItemCount = this.getItemCount(item, activeItem);
        const maxItemCount = this.getMaxItemCount(item, activeItem);
        return maxItemCount - currentItemCount;
    }

    private getMaxItemCount(item: ItemType, activeItem: ItemType | null): number {
        if (item === ItemType.Flag) {
            return this.gameDataService.getGameMode() === GameMode.CTF ? 1 : 0;
        }

        let maxItemCount = MAX_ITEM_COUNT[this.gameDataService.getMapSize()][item];

        if (SHARED_ITEM_POOL.includes(item)) {
            const maxSharedItemCount = this.getMaxSharedItemCount(item, activeItem);
            maxItemCount = Math.min(maxItemCount, maxSharedItemCount);
        }

        return maxItemCount;
    }

    private getMaxSharedItemCount(item: ItemType, activeItem: ItemType | null): number {
        let sharedCount = 0;
        SHARED_ITEM_POOL.forEach((sharedItem) => {
            if (sharedItem !== item) {
                sharedCount += this.getItemCount(sharedItem, activeItem);
            }
        });
        const highestMaxItemCount = MAX_ITEM_COUNT[this.gameDataService.getMapSize()][ITEM_POOL_HIGHEST_ITEM];
        return highestMaxItemCount - sharedCount;
    }

    private getItemCount(item: ItemType, activeItem: ItemType | null): number {
        let itemCount = this.gameDataService.getItemCount(item);

        if (item === activeItem) {
            itemCount++;
        }

        return itemCount;
    }

    private async saveGameOnServer(): Promise<boolean> {
        this.gameDataService.gameData.isVisible = false;
        this.gameDataService.gameData.lastEdited = new Date();

        try {
            await firstValueFrom(this.gameSaveService.saveGame(this.gameDataService.gameData));
        } catch {
            this.popupService.showPopup({ message: PopupMessage.ConnectionError, hasCloseButton: true, isConfirmation: false });
            return false;
        }

        return true;
    }
}
