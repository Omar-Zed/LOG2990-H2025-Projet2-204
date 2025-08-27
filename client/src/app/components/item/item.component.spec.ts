import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemComponent } from '@app/components/item/item.component';
import { ITEM_IMAGES } from '@app/consts/images.const';
import { ITEM_DESCRIPTION } from '@common/consts/item-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';

describe('ItemComponent', () => {
    let component: ItemComponent;
    let fixture: ComponentFixture<ItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update description and image when itemType changes', () => {
        component.itemType = ItemType.Item1;
        component.ngOnChanges();

        expect(component.description).toBe(ITEM_DESCRIPTION.get(ItemType.Item1) as string);
        expect(component.image).toBe(ITEM_IMAGES.get(ItemType.Item1) as string);
    });
});
