import { Component, Input } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { ItemComponent } from '@app/components/item/item.component';
import { MapComponent } from '@app/components/map/map.component';
import { EDITOR_ERASE_TILE } from '@app/consts/editor-data.const';
import { EMPTY_IMAGE, ITEM_IMAGES } from '@app/consts/images.const';
import { EditorEvent, EditorTile } from '@app/interfaces/editor';
import { AudioService } from '@app/services/audio/audio.service';
import { EditorService } from '@app/services/editor/editor.service';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { MapService } from '@app/services/map/map.service';
import { PopupService } from '@app/services/popup/popup.service';
import { OUTSIDE_OF_MAP } from '@common/consts/map-data.const';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { ItemType } from '@common/interfaces/item-type.enum';
import { TileType } from '@common/interfaces/tile-type.enum';
import { MOCK_GAME_DATAS } from '@common/test-consts/mock-games';
import { EditPageComponent } from './edit-page.component';

@Component({
    selector: 'app-map',
    standalone: true,
    template: '',
})
class MockMapComponent {
    @Input() isEditor: boolean = false;
}

@Component({
    selector: 'app-item',
    standalone: true,
    template: '',
})
class MockItemComponent {
    @Input() itemType: ItemType = ItemType.Item1;
    @Input() x: number = 0;
    @Input() y: number = 0;
    @Input() showDescription: boolean = false;
}

describe('EditPageComponent', () => {
    let component: EditPageComponent;
    let fixture: ComponentFixture<EditPageComponent>;

    let routerSpy: jasmine.SpyObj<Router>;
    let popupServiceSpy: jasmine.SpyObj<PopupService>;
    let editorServiceSpy: jasmine.SpyObj<EditorService>;
    let gameDataServiceSpy: jasmine.SpyObj<GameDataService>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        popupServiceSpy = jasmine.createSpyObj('PopupService', ['showPopup', 'keepMessages']);
        mapServiceSpy = jasmine.createSpyObj('MapService', ['clearOverlays', 'setPlayers']);
        editorServiceSpy = jasmine.createSpyObj('EditorService', [
            'saveGame',
            'paintTile',
            'getRemainingItemCount',
            'placeItem',
            'resetLastPicked',
            'pickItem',
        ]);
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'preloadEffectsForPage', 'playBackgroundMusic']);
        gameDataServiceSpy = jasmine.createSpyObj('GameDataService', ['isMapValid', 'isModified', 'getItem', 'setGameData', 'removeItem'], {
            itemUpdate: {
                subscribe: () => undefined,
            },
            gameData: structuredClone(MOCK_GAME_DATAS)[0],
            isOutOfBound: () => false,
            getTile: () => TileType.Grass,
            getMapSizeString: () => '',
            getGameModeString: () => '',
        });
        gameDataServiceSpy.isMapValid.and.returnValue(true);
        editorServiceSpy.getRemainingItemCount.and.returnValue(0);

        await TestBed.configureTestingModule({
            imports: [EditPageComponent, FormsModule, HeaderComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: PopupService, useValue: popupServiceSpy },
                { provide: EditorService, useValue: editorServiceSpy },
                { provide: GameDataService, useValue: gameDataServiceSpy },
                { provide: MapService, useValue: mapServiceSpy },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        TestBed.overrideComponent(EditPageComponent, {
            add: { imports: [MockMapComponent, MockItemComponent] },
            remove: { imports: [MapComponent, ItemComponent] },
        });

        fixture = TestBed.createComponent(EditPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should save game and navigate on success, do nothing on failure', fakeAsync(() => {
        editorServiceSpy.saveGame.and.returnValue(Promise.resolve(true));
        popupServiceSpy.showPopup.and.callFake((popupMessage) => popupMessage.action && popupMessage.action());
        component.saveButton();
        tick();

        expect(editorServiceSpy.saveGame).toHaveBeenCalled();
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
        expect(popupServiceSpy.keepMessages).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Admin]);

        editorServiceSpy.saveGame.calls.reset();
        popupServiceSpy.showPopup.calls.reset();
        popupServiceSpy.keepMessages.calls.reset();
        routerSpy.navigate.calls.reset();

        editorServiceSpy.saveGame.and.returnValue(Promise.resolve(false));
        component.saveButton();
        tick();

        expect(editorServiceSpy.saveGame).toHaveBeenCalled();
        expect(popupServiceSpy.showPopup).not.toHaveBeenCalled();
        expect(popupServiceSpy.keepMessages).not.toHaveBeenCalled();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('should show popup on back with modifications and call goToAdminPage, call goToAdminPage directly without', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(component, 'goToAdminPage');

        gameDataServiceSpy.isModified.and.returnValue(true);
        popupServiceSpy.showPopup.and.callFake((popupMessage) => {
            if (popupMessage.isConfirmation && popupMessage.action) popupMessage.action();
        });

        component.backButton();

        expect(gameDataServiceSpy.isModified).toHaveBeenCalledWith(component['initialGameData']);
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();

        expect(component['goToAdminPage']).toHaveBeenCalled();

        gameDataServiceSpy.isModified.calls.reset();
        popupServiceSpy.showPopup.calls.reset();

        gameDataServiceSpy.isModified.and.returnValue(false);

        component.backButton();

        expect(gameDataServiceSpy.isModified).toHaveBeenCalledWith(component['initialGameData']);
        expect(popupServiceSpy.showPopup).not.toHaveBeenCalled();
        expect(component['goToAdminPage']).toHaveBeenCalled();
    });

    it('should show popup on reset with modifications and call resetGameData, do nothing without', () => {
        gameDataServiceSpy.isModified.and.returnValue(true);
        component.resetButton();

        expect(gameDataServiceSpy.isModified).toHaveBeenCalledWith(component['initialGameData']);
        expect(popupServiceSpy.showPopup).toHaveBeenCalled();
    });

    it('should call onClick with correct isLeftClick value for mouse down events', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(component, 'onClick');
        const leftClickEvent = new MouseEvent('mousedown', { button: 0 });
        component.onMouseDown(leftClickEvent);

        expect(component['onClick']).toHaveBeenCalledWith(leftClickEvent, true);
    });

    it('should call preventDefault on right click with tile position, do nothing without', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const getEventPropertySpy = spyOn<any>(component, 'getEventProperty') as jasmine.Spy;

        const mockEventWithPosition = new MouseEvent('contextmenu', { button: 2 });
        spyOn(mockEventWithPosition, 'preventDefault');
        getEventPropertySpy.and.returnValue({ tilePosition: { x: 1, y: 1 }, mousePosition: null, tile: null, item: null });

        component.onRightClick(mockEventWithPosition);

        expect(getEventPropertySpy).toHaveBeenCalledWith(mockEventWithPosition);
        expect(mockEventWithPosition.preventDefault).toHaveBeenCalled();
    });

    it('should reset painting properties and call dropItem if dragItem exists', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const dropItemSpy = spyOn<any>(component, 'dropItem');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const getEventPropertySpy = spyOn<any>(component, 'getEventProperty') as jasmine.Spy;
        const mockEvent = new MouseEvent('mouseup');

        component.editorVisualData.dragItem = ItemType.Item1;
        component.editorVisualData.paintingTile = TileType.Grass;
        component.editorVisualData.lastPaintedPosition = { x: 1, y: 1 };
        getEventPropertySpy.and.returnValue({ tilePosition: { x: 2, y: 2 }, mousePosition: null, tile: null, item: null });
        component.onMouseUp(mockEvent);

        expect(component.editorVisualData.paintingTile).toBeNull();
        expect(component.editorVisualData.lastPaintedPosition).toEqual(structuredClone(OUTSIDE_OF_MAP));
        expect(getEventPropertySpy).toHaveBeenCalledWith(mockEvent);
        expect(dropItemSpy).toHaveBeenCalledWith({ tilePosition: { x: 2, y: 2 }, mousePosition: null, tile: null, item: null });
    });

    it('should update dragPosition on mouse move with dragItem, do nothing without', () => {
        const mockEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
        component.editorVisualData.dragItem = ItemType.Item1;
        component.editorVisualData.dragPosition = { x: 50, y: 150 };
        component.onMouseMove(mockEvent);
        expect(component.editorVisualData.dragPosition).toEqual({ x: 100, y: 200 });
        component.editorVisualData.dragPosition = { x: 100, y: 200 };
        component.onMouseMove(mockEvent);
        expect(component.editorVisualData.dragPosition).toEqual({ x: 100, y: 200 });
        component.editorVisualData.dragItem = null;
        component.editorVisualData.dragPosition = { x: 50, y: 150 };
        component.onMouseMove(mockEvent);
        expect(component.editorVisualData.dragPosition).toEqual({ x: 50, y: 150 });
    });

    it('should paint tile on mouse over with valid conditions, do nothing otherwise', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const getEventPropertySpy = spyOn<any>(component, 'getEventProperty') as jasmine.Spy;
        const mockEvent = new Event('mouseover');
        editorServiceSpy.paintTile.calls.reset();
        getEventPropertySpy.and.returnValue({ tilePosition: { x: 2, y: 2 }, mousePosition: null, tile: null, item: null });
        component.editorVisualData.paintingTile = TileType.Grass;
        component.editorVisualData.lastPaintedPosition = { x: 1, y: 1 };
        component.onMouseOver(mockEvent);
        expect(getEventPropertySpy).toHaveBeenCalledWith(mockEvent);
        expect(component.editorVisualData.lastPaintedPosition).toEqual({ x: 2, y: 2 });
        expect(editorServiceSpy.paintTile).toHaveBeenCalledWith(TileType.Grass, { x: 2, y: 2 });

        editorServiceSpy.paintTile.calls.reset();
        component.onMouseOver(mockEvent);
        component.editorVisualData.lastPaintedPosition = { x: 2, y: 2 };
        expect(editorServiceSpy.paintTile).not.toHaveBeenCalled();
    });

    it('should drop item and update state with tile position, skip placement without', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const setActiveItemSpy = spyOn<any>(component, 'setActiveItem');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const updateItemsSpy = spyOn<any>(component, 'updateItems');
        component.editorVisualData.dragItem = ItemType.Item1;
        const editorEventWithPosition: EditorEvent = { tilePosition: { x: 2, y: 2 }, mousePosition: null, tile: null, item: null };

        component['dropItem'](editorEventWithPosition);

        expect(setActiveItemSpy).toHaveBeenCalledWith(null, editorEventWithPosition);
        expect(editorServiceSpy.placeItem).toHaveBeenCalledWith(ItemType.Item1, { x: 2, y: 2 });
        expect(updateItemsSpy).toHaveBeenCalled();
    });

    it('should reset game data with initialGameData', () => {
        component['resetGameData']();
        expect(gameDataServiceSpy.setGameData).toHaveBeenCalledWith(jasmine.objectContaining(component['initialGameData']));
    });

    it('should handle click events based on editorEvent properties and isLeftClick', () => {
        const mockEvent: EditorEvent = { tilePosition: { x: 1, y: 1 }, mousePosition: null, tile: TileType.Bush, item: ItemType.Item1 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(component, 'getEventProperty').and.returnValue(mockEvent);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const clickOnMapSpy = spyOn<any>(component, 'clickOnMap');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const clickOnTileSpy = spyOn<any>(component, 'clickOnTile');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const clickOnItemSpy = spyOn<any>(component, 'clickOnItem');
        component['onClick'](new MouseEvent('click'), true);
        expect(clickOnMapSpy).toHaveBeenCalled();
        mockEvent.tilePosition = null;
        component['onClick'](new MouseEvent('click'), true);
        expect(clickOnTileSpy).toHaveBeenCalled();
        mockEvent.tile = null;
        component['onClick'](new MouseEvent('click'), true);
        expect(clickOnItemSpy).toHaveBeenCalled();
    });

    it('should return correct EditorEvent properties based on event and target', () => {
        const mockTargetWithAttributes = {
            hasAttribute: (attr: string) => attr === 'x' || attr === 'y' || attr === 'tile' || attr === 'item',
            getAttribute: (attr: string) => {
                if (attr === 'x') return '1';
                if (attr === 'y') return '2';
                if (attr === 'tile') return TileType.Grass;
                if (attr === 'item') return ItemType.Item1;
                return null;
            },
        } as unknown as HTMLElement;

        const mockMouseEvent1 = new MouseEvent('click', { clientX: 100, clientY: 200 });
        Object.defineProperty(mockMouseEvent1, 'target', { value: mockTargetWithAttributes, writable: false });
        const result1 = component['getEventProperty'](mockMouseEvent1);
        expect(result1).toEqual({
            tilePosition: { x: 1, y: 2 },
            mousePosition: { x: 100, y: 200 },
            tile: TileType.Grass,
            item: ItemType.Item1,
        });

        const mockMouseEvent2 = new Event('click');
        Object.defineProperty(mockMouseEvent2, 'target', { value: { hasAttribute: () => false, getAttribute: () => null }, writable: false });
        const result2 = component['getEventProperty'](mockMouseEvent2);
        expect(result2).toEqual({ tilePosition: null, mousePosition: null, tile: null, item: null });
    });

    it('should handle item click with remaining count, do nothing without', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const setActiveItemSpy = spyOn<any>(component, 'setActiveItem');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const updateItemsSpy = spyOn<any>(component, 'updateItems');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(component, 'getRemainingItemCount').and.returnValue(1);

        const editorEvent: EditorEvent = { tilePosition: null, mousePosition: null, tile: null, item: ItemType.Item1 };
        editorServiceSpy.getRemainingItemCount.and.returnValue(1);
        component['clickOnItem'](editorEvent);

        expect(editorServiceSpy.getRemainingItemCount).toHaveBeenCalledWith(ItemType.Item1, component.editorVisualData.dragItem);
        expect(component['editorService'].resetLastPicked).toHaveBeenCalled();
        expect(setActiveItemSpy).toHaveBeenCalledWith(ItemType.Item1, editorEvent);
        expect(updateItemsSpy).toHaveBeenCalled();
    });

    it('should set selectedTile and update tile activity states', () => {
        component.editorVisualData.tiles = [
            { tile: TileType.Grass, isActive: false } as EditorTile,
            { tile: TileType.Path, isActive: true } as EditorTile,
            { tile: TileType.Water, isActive: false } as EditorTile,
        ];
        component['clickOnTile'](TileType.Grass);

        expect(component.editorVisualData.selectedTile).toBe(TileType.Grass);
        expect(component.editorVisualData.tiles[0].isActive).toBeTrue();
    });

    it('should set active item properties based on item and mouse position', () => {
        component.editorVisualData.dragItem = ItemType.Item2;
        component.editorVisualData.dragItemImage = 'initialImage';

        const editorEvent: EditorEvent = { tilePosition: null, mousePosition: { x: 0, y: 0 }, tile: null, item: null };
        component['setActiveItem'](ItemType.Item1, editorEvent);
        expect(component.editorVisualData.dragItem).toBe(ItemType.Item1);
        expect(component.editorVisualData.dragItemImage).toBe(ITEM_IMAGES.get(ItemType.Item1) as string);

        component['setActiveItem'](null, editorEvent);
        expect(component.editorVisualData.dragItem).toBeNull();
        expect(component.editorVisualData.dragItemImage).toBe(EMPTY_IMAGE);
    });

    it('should handle map click based on dragItem, tileHasItem, and isLeftClick', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const clickOnMapItemSpy = spyOn<any>(component, 'clickOnMapItem');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const updatePaintingTileSpy = spyOn<any>(component, 'updatePaintingTile');
        const editorEvent: EditorEvent = { tilePosition: { x: 1, y: 1 }, mousePosition: null, tile: null, item: null };

        gameDataServiceSpy.getItem.and.returnValue(ItemType.Item1);
        component['clickOnMap'](editorEvent, true);
        expect(clickOnMapItemSpy).toHaveBeenCalledWith(editorEvent, true);

        gameDataServiceSpy.getItem.and.returnValue(null);
        component.editorVisualData.paintingTile = TileType.Grass;
        component['clickOnMap'](editorEvent, true);
        expect(updatePaintingTileSpy).toHaveBeenCalledWith(true);
        expect(editorServiceSpy.paintTile).toHaveBeenCalledWith(TileType.Grass, { x: 1, y: 1 });
    });

    it('should pick item on left click, remove item on right click', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const pickItemSpy = spyOn<any>(component, 'pickItem');
        const editorEvent: EditorEvent = { tilePosition: { x: 1, y: 1 }, mousePosition: null, tile: null, item: null };

        component['clickOnMapItem'](editorEvent, true);
        expect(pickItemSpy).toHaveBeenCalledWith(editorEvent);

        component['clickOnMapItem'](editorEvent, false);
        expect(gameDataServiceSpy.removeItem).toHaveBeenCalledWith({ x: 1, y: 1 });
    });

    it('should pick item and update active state', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const setActiveItemSpy = spyOn<any>(component, 'setActiveItem');
        const editorEvent: EditorEvent = { tilePosition: { x: 1, y: 1 }, mousePosition: null, tile: null, item: null };

        gameDataServiceSpy.getItem.and.returnValue(ItemType.Item1);
        component['pickItem'](editorEvent);
        expect(gameDataServiceSpy.getItem).toHaveBeenCalledWith({ x: 1, y: 1 });
        expect(setActiveItemSpy).toHaveBeenCalledWith(ItemType.Item1, editorEvent);
        expect(editorServiceSpy.pickItem).toHaveBeenCalledWith({ x: 1, y: 1 });
    });

    it('should update paintingTile based on isLeftClick', () => {
        component.editorVisualData.selectedTile = TileType.Grass;
        component['updatePaintingTile'](true);
        expect(component.editorVisualData.paintingTile).toBe(TileType.Grass);

        component['updatePaintingTile'](false);
        expect(component.editorVisualData.paintingTile).toBe(EDITOR_ERASE_TILE);
    });

    it('should return null on get remaining item count', () => {
        editorServiceSpy.getRemainingItemCount.and.returnValue(1);
        const result = component['getRemainingItemCount'](ItemType.Item2);
        expect(result).toBe(null);
    });

    it('should navigate to admin page if map is invalid', () => {
        gameDataServiceSpy.isMapValid.and.returnValue(false);
        fixture = TestBed.createComponent(EditPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageEndpoint.Admin]);
    });
});
