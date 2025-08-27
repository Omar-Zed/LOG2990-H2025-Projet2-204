import { Component, inject, Input } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';
import { AvatarVisualEffect } from '@app/interfaces/map-visual-data';
import { MapService } from '@app/services/map/map.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayService } from '@app/services/play/play.service';
import { OUTSIDE_OF_MAP } from '@common/consts/map-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { Position } from '@common/interfaces/position';

@Component({
    selector: 'app-map',
    standalone: true,
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    imports: [ItemComponent],
})
export class MapComponent {
    @Input() isEditor: boolean = false;
    mapService: MapService = inject(MapService);
    avatarVisualEffect = AvatarVisualEffect;
    matchService: MatchService = inject(MatchService);
    private playService: PlayService = inject(PlayService);
    private lastHover: Position = structuredClone(OUTSIDE_OF_MAP);

    onHover(position: Position) {
        const hoveringLastTile = this.lastHover.x !== position.x || this.lastHover.y !== position.y;
        if (!this.isEditor && hoveringLastTile) {
            this.lastHover = position;
            this.playService.displayMovementPath(position);
        }
    }

    clickTile(position: Position) {
        if (!this.isEditor) {
            this.playService.clickTile(position);
        }
    }

    rightClickTile(event: MouseEvent, position: Position) {
        event.preventDefault();
        if (!this.isEditor) {
            this.playService.rightClickTile(position);
        }
    }

    getTileEffect(id: string): AvatarVisualEffect {
        const player = this.matchService.data.players.find((p) => p.id === id);
        if (player?.items.includes(ItemType.Item6)) {
            if (player.id === this.matchService.selfPlayer.id) {
                return AvatarVisualEffect.Fade;
            } else {
                return AvatarVisualEffect.Invisible;
            }
        }
        return AvatarVisualEffect.None;
    }
}
