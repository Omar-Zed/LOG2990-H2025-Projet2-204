import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AudioService } from '@app/services/audio/audio.service';
import { WarningConfirmationPopupComponent } from './warning-confirmation-popup.component';

describe('WarningConfirmationPopupComponent', () => {
    let component: WarningConfirmationPopupComponent;
    let fixture: ComponentFixture<WarningConfirmationPopupComponent>;
    let mockAudioService: jasmine.SpyObj<AudioService>;

    beforeEach(async () => {
        mockAudioService = jasmine.createSpyObj('AudioService', ['playEffect', 'preloadEffectsForPage']);
        await TestBed.configureTestingModule({
            imports: [WarningConfirmationPopupComponent],
            providers: [{ provide: AudioService, useValue: mockAudioService }],
        }).compileComponents();

        fixture = TestBed.createComponent(WarningConfirmationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should display the correct message', () => {
        component.message = 'Test message';
        fixture.detectChanges();

        const messageElement = fixture.debugElement.query(By.css('#warning-details p'));
        expect(messageElement.nativeElement.textContent).toContain('Test message');
    });

    it('should emit true when confirm button is clicked', () => {
        component.isConfirmation = true;
        fixture.detectChanges();

        spyOn(component.closed, 'emit');

        const confirmButton = fixture.debugElement.query(By.css('#warning-confirm'));
        confirmButton.nativeElement.click();

        expect(component.closed.emit).toHaveBeenCalledWith(true);
    });

    it('should emit false when cancel button is clicked', () => {
        component.hasCloseButton = true;
        fixture.detectChanges();

        spyOn(component.closed, 'emit');

        const cancelButton = fixture.debugElement.query(By.css('#warning-dismiss'));
        cancelButton.nativeElement.click();

        expect(component.closed.emit).toHaveBeenCalledWith(false);
    });

    it('should display the confirmation button when isConfirmation is true', () => {
        component.isConfirmation = true;
        fixture.detectChanges();

        const confirmButton = fixture.debugElement.query(By.css('#warning-confirm'));
        expect(confirmButton).toBeTruthy();
    });

    it('should not display the confirmation button when isConfirmation is false', () => {
        component.isConfirmation = false;
        fixture.detectChanges();

        const confirmButton = fixture.debugElement.query(By.css('#warning-confirm'));
        expect(confirmButton).toBeFalsy();
    });
});
