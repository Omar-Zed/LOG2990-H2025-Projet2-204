import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from '@app/components/map/map.component';
import { AvatarVisualEffect, MapVisualData } from '@app/interfaces/map-visual-data';
import { GameDataService } from '@app/services/game-data/game-data.service';
import { MapService } from '@app/services/map/map.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayService } from '@app/services/play/play.service';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MapSize } from '@common/interfaces/map-data';
import { TileType } from '@common/interfaces/tile-type.enum';

describe('MapComponent', () => {
    let component: MapComponent;
    let fixture: ComponentFixture<MapComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let playServiceSpy: jasmine.SpyObj<PlayService>;
    let gameDataServiceSpy: jasmine.SpyObj<GameDataService>;
    let matchServiceSpy: jasmine.SpyObj<MatchService>;

    beforeEach(async () => {
        playServiceSpy = jasmine.createSpyObj('PlayService', ['displayMovementPath', 'rightClickTile', 'clickTile']);
        gameDataServiceSpy = jasmine.createSpyObj('GameDataService', ['getTileFromPosition']);
        gameDataServiceSpy.getTileFromPosition.and.returnValue(TileType.Grass);

        const mockVisualMapData: MapVisualData = {
            tiles: [
                [
                    { tile: 'grass0', underlay: null, item: null, player: null, overlay: null },
                    { tile: 'grass1', underlay: null, item: null, player: null, overlay: null },
                ],
                [
                    { tile: 'grass0', underlay: null, item: null, player: null, overlay: null },
                    { tile: 'grass1', underlay: null, item: null, player: null, overlay: null },
                ],
            ],
            size: MapSize.Small,
        };
        mapServiceSpy = jasmine.createSpyObj('MapService', ['getMapTile'], {
            visualMapData: mockVisualMapData,
            gameDataService: gameDataServiceSpy,
        });
        matchServiceSpy = jasmine.createSpyObj('MatchService', [], {
            data: {
                players: [
                    { id: 'player1', items: [ItemType.Item1, ItemType.Item6], position: { x: 0, y: 0 } },
                    { id: 'player2', items: [ItemType.Item1], position: { x: 1, y: 1 } },
                    { id: 'player3', items: [ItemType.Item6], position: { x: 2, y: 2 } },
                ],
            },
            selfPlayer: { id: 'player1' },
        });

        await TestBed.configureTestingModule({
            imports: [MapComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: PlayService, useValue: playServiceSpy },
                { provide: MatchService, useValue: matchServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should handle on hover correctly', () => {
        const position = { x: -2, y: 3 };
        component.isEditor = false;
        component.onHover(position);
        expect(playServiceSpy.displayMovementPath).toHaveBeenCalledWith(position);
    });

    it('should handle click tile correctly', () => {
        const position = { x: 5, y: 7 };
        component.isEditor = false;
        component.clickTile(position);
        expect(playServiceSpy.clickTile).toHaveBeenCalledWith(position);
    });

    it('should handle right click tile correctly', () => {
        component.isEditor = false;
        const position = { x: 5, y: 7 };
        component.rightClickTile(new MouseEvent('click'), position);
        expect(playServiceSpy.rightClickTile).toHaveBeenCalledWith(position);
    });
    it('should return correct visual effect for players based on their items', () => {
        expect(component.getTileEffect('player1')).toEqual(AvatarVisualEffect.Fade);
        expect(component.getTileEffect('player3')).toEqual(AvatarVisualEffect.Invisible);
        expect(component.getTileEffect('player2')).toEqual(AvatarVisualEffect.None);
        expect(component.getTileEffect('unknown')).toEqual(AvatarVisualEffect.None);
    });
});
