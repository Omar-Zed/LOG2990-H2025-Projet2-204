import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { ItemComponent } from '@app/components/item/item.component';
import { MapComponent } from '@app/components/map/map.component';
import { DEFAULT_EDITOR_DATA, EDITOR_ERASE_TILE, ITEM_POOL_HIGHEST_ITEM, SHARED_ITEM_POOL } from '@app/consts/editor-data.const';
import { EMPTY_IMAGE, ITEM_IMAGES } from '@app/consts/images.const';
import { PopupMessage } from '@app/consts/popup-message.const';
import { EditorEvent, EditorItem, EditorVisualData } from '@app/interfaces/editor';
import { PopupColor } from '@app/interfaces/popup';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { AudioService } from '@app/services/audio/audio.service';
import { EditorService } from '@app/services/editor/editor.service';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { MapService } from '@app/services/map/map.service';
import { PopupService } from '@app/services/popup/popup.service';
import { ITEM_DESCRIPTION } from '@common/consts/item-data.const';
import { OUTSIDE_OF_MAP } from '@common/consts/map-data.const';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { GameData } from '@common/interfaces/game-data';
import { ItemType } from '@common/interfaces/item-type.enum';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';

@Component({
    selector: 'app-edit-page',
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],
    imports: [HeaderComponent, MapComponent, FormsModule, ItemComponent],
})
export class EditPageComponent {
    gameDataService: GameDataService = inject(GameDataService);
    editorVisualData: EditorVisualData = structuredClone(DEFAULT_EDITOR_DATA);
    readonly audioService: AudioService = inject(AudioService);
    readonly clickValue = SoundEffect.Click;
    private editorService: EditorService = inject(EditorService);
    private popupService: PopupService = inject(PopupService);
    private mapService: MapService = inject(MapService);
    private router: Router = inject(Router);
    private initialGameData: GameData = structuredClone(this.gameDataService.gameData);

    constructor() {
        if (this.gameDataService.isMapValid()) {
            this.mapService.clearOverlays();
            this.mapService.setPlayers([]);
            this.gameDataService.itemUpdate.subscribe(this.updateItems.bind(this));
            this.updateItems();
            this.audioService.playBackgroundMusic(BackgroundMusic.Edit);
        } else {
            this.goToAdminPage();
        }
    }

    backButton() {
        this.audioService.playEffect(SoundEffect.Click);
        if (this.gameDataService.isModified(this.initialGameData)) {
            this.popupService.showPopup({
                message: PopupMessage.QuitEditPage,
                hasCloseButton: true,
                isConfirmation: true,
                action: this.goToAdminPage.bind(this),
            });
        } else {
            this.goToAdminPage();
        }
    }

    async saveButton() {
        this.audioService.playEffect(SoundEffect.Click);
        const isGameSaved = await this.editorService.saveGame();
        if (isGameSaved) {
            this.popupService.showPopup({
                message: PopupMessage.SuccessfulSave,
                hasCloseButton: true,
                isConfirmation: false,
                popupColor: PopupColor.Green,
            });
            this.popupService.keepMessages();
            this.goToAdminPage();
        }
    }

    resetButton() {
        this.audioService.playEffect(SoundEffect.Click);
        if (this.gameDataService.isModified(this.initialGameData)) {
            this.popupService.showPopup({
                message: PopupMessage.CancelModification,
                hasCloseButton: true,
                isConfirmation: true,
                action: this.resetGameData.bind(this),
            });
        }
    }

    onMouseDown(event: MouseEvent) {
        const isLeftClick = event.button === 0;
        this.onClick(event, isLeftClick);
    }

    onRightClick(event: MouseEvent) {
        const editorEvent = this.getEventProperty(event);
        if (editorEvent.tilePosition) {
            event.preventDefault();
        }
    }

    onMouseUp(event: MouseEvent) {
        this.editorVisualData.paintingTile = null;
        this.editorVisualData.lastPaintedPosition = structuredClone(OUTSIDE_OF_MAP);

        if (this.editorVisualData.dragItem) {
            this.dropItem(this.getEventProperty(event));
        }
    }

    onMouseMove(event: MouseEvent) {
        if (this.editorVisualData.dragItem) {
            const position: Position = { x: event.clientX, y: event.clientY };

            if (position.x !== this.editorVisualData.dragPosition.x) {
                this.editorVisualData.dragPosition.x = position.x;
            }

            if (position.y !== this.editorVisualData.dragPosition.y) {
                this.editorVisualData.dragPosition.y = position.y;
            }
        }
    }

    onMouseOver(event: Event) {
        const editorEvent = this.getEventProperty(event);
        if (editorEvent.tilePosition) {
            const lastPosition = this.editorVisualData.lastPaintedPosition;
            const hasAlreadyPainted = lastPosition.x === editorEvent.tilePosition.x && lastPosition.y === editorEvent.tilePosition.y;

            if (!hasAlreadyPainted && this.editorVisualData.paintingTile) {
                this.editorVisualData.lastPaintedPosition = editorEvent.tilePosition;
                this.editorService.paintTile(this.editorVisualData.paintingTile, editorEvent.tilePosition);
            }
        }
    }

    private dropItem(editorEvent: EditorEvent) {
        const item = this.editorVisualData.dragItem as ItemType;
        this.setActiveItem(null, editorEvent);
        if (editorEvent.tilePosition) {
            this.editorService.placeItem(item, editorEvent.tilePosition);
        }
        this.updateItems();
    }

    private goToAdminPage() {
        this.router.navigate([PageEndpoint.Admin]);
    }

    private getEditorItems(): EditorItem[] {
        return Object.values(ItemType).map(this.getEditorItem.bind(this));
    }

    private getEditorItem(item: ItemType): EditorItem {
        return {
            item,
            image: ITEM_IMAGES.get(item) as string,
            description: ITEM_DESCRIPTION.get(item) as string,
            count: this.getRemainingItemCount(item),
        };
    }

    private resetGameData() {
        this.gameDataService.setGameData(structuredClone(this.initialGameData));
    }

    private onClick(event: MouseEvent, isLeftClick: boolean) {
        const editorEvent = this.getEventProperty(event);

        if (editorEvent.tilePosition) {
            this.clickOnMap(editorEvent, isLeftClick);
            return event.preventDefault();
        }

        if (editorEvent.tile && isLeftClick) {
            this.clickOnTile(editorEvent.tile as TileType);
            return event.preventDefault();
        }

        if (editorEvent.item && isLeftClick) {
            this.clickOnItem(editorEvent);
            return event.preventDefault();
        }
    }

    private getEventProperty(event: Event): EditorEvent {
        const target = event.target as HTMLElement;
        return {
            tilePosition: target.hasAttribute('x') ? { x: Number(target.getAttribute('x')), y: Number(target.getAttribute('y')) } : null,
            mousePosition: event instanceof MouseEvent ? { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY } : null,
            tile: (target.getAttribute('tile') ?? null) as TileType | null,
            item: (target.getAttribute('item') ?? null) as ItemType | null,
        };
    }

    private clickOnItem(editorEvent: EditorEvent) {
        const remainingItemCount = this.editorService.getRemainingItemCount(editorEvent.item as ItemType, this.editorVisualData.dragItem);
        if (remainingItemCount > 0) {
            this.editorService.resetLastPicked();
            this.setActiveItem(editorEvent.item, editorEvent);
            this.updateItems();
        }
    }

    private getRemainingItemCount(item: ItemType): number | null {
        let remainingItemCount: number | null = this.editorService.getRemainingItemCount(item, this.editorVisualData.dragItem);
        const isSingleSharedItem = SHARED_ITEM_POOL.includes(item) && item !== ITEM_POOL_HIGHEST_ITEM;
        const isSingleItem = item === ItemType.Flag || isSingleSharedItem;
        if (remainingItemCount === 1 && isSingleItem) {
            remainingItemCount = null;
        }
        return remainingItemCount;
    }

    private clickOnTile(tile: TileType) {
        this.editorVisualData.selectedTile = tile;

        for (const tileData of this.editorVisualData.tiles) {
            if (tileData.tile === tile) {
                tileData.isActive = true;
            } else if (tileData.isActive) {
                tileData.isActive = false;
            }
        }
    }

    private clickOnMap(editorEvent: EditorEvent, isLeftClick: boolean) {
        const tileHasItem = Boolean(this.gameDataService.getItem(editorEvent.tilePosition as Position));

        if (!this.editorVisualData.dragItem) {
            if (tileHasItem) {
                this.clickOnMapItem(editorEvent, isLeftClick);
            } else {
                this.updatePaintingTile(isLeftClick);
                this.editorService.paintTile(this.editorVisualData.paintingTile as TileType, editorEvent.tilePosition as Position);
            }
        }
    }

    private updatePaintingTile(isLeftClick: boolean) {
        this.editorVisualData.paintingTile = isLeftClick ? this.editorVisualData.selectedTile : EDITOR_ERASE_TILE;
    }

    private clickOnMapItem(editorEvent: EditorEvent, isLeftClick: boolean) {
        if (isLeftClick) {
            this.pickItem(editorEvent);
        } else {
            this.gameDataService.removeItem(editorEvent.tilePosition as Position);
        }
    }

    private pickItem(editorEvent: EditorEvent) {
        const item = this.gameDataService.getItem(editorEvent.tilePosition as Position) as ItemType;
        this.setActiveItem(item, editorEvent);
        this.editorService.pickItem(editorEvent.tilePosition as Position);
    }

    private updateItems() {
        this.editorVisualData.items = this.getEditorItems();
    }

    private setActiveItem(item: ItemType | null, editorEvent: EditorEvent) {
        this.editorVisualData.dragItem = item;

        if (item) {
            this.editorVisualData.dragItemImage = ITEM_IMAGES.get(item) as string;
        } else {
            this.editorVisualData.dragItemImage = EMPTY_IMAGE;
        }

        if (editorEvent.mousePosition) {
            this.editorVisualData.dragPosition = editorEvent.mousePosition;
        }
    }
}
