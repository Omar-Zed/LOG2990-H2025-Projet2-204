import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';
import { PokeballButtonComponent } from '@app/components/pokeball-button/pokeball-button.component';
import { PlayService } from '@app/services/play/play.service';
import { MAX_ITEMS } from '@common/consts/player-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';

@Component({
    selector: 'app-item-drop-popup',
    templateUrl: './item-drop-popup.component.html',
    styleUrls: ['./item-drop-popup.component.scss'],
    imports: [ItemComponent, PokeballButtonComponent, CommonModule],
})
export class ItemDropPopupComponent {
    @Input() inventoryItems: ItemType[] = [];
    selectedItem: number = MAX_ITEMS;
    private playService: PlayService = inject(PlayService);

    validateChoise() {
        this.playService.dropItem(this.inventoryItems[this.selectedItem]);
    }
}
