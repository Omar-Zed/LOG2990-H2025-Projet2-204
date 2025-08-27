import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PokeballButtonComponent } from './pokeball-button.component';

@Component({
    template: '<app-pokeball-button [buttonContent]="testContent" [delay]="delay"></app-pokeball-button>',
    imports: [PokeballButtonComponent],
    standalone: true,
})
class TestHostComponent {
    testContent = 'Test Button';
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- delay test
    delay = 300;
}

describe('PokeballButtonComponent', () => {
    let component: PokeballButtonComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PokeballButtonComponent, TestHostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.debugElement.query(By.css('app-pokeball-button')).componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should set is active to false on mouse leave', () => {
        component.isActive = true;
        component.onMouseLeave();
        expect(component.isActive).toBe(false);
    });

    it('should display Test Button as the button content', () => {
        expect(component.buttonContent).toBe('Test Button');
    });

    it('should set isActive to true on mouse down', () => {
        const event = new MouseEvent('click');
        component.onMouseDown(event);
        expect(component.isActive).toBeTrue();
    });

    it('should reset isActive to false after delay on mouse up', (done) => {
        const event = new MouseEvent('click');
        component.delay = 100;
        component.onMouseDown(event);
        expect(component.isActive).toBeTrue();
        component.onMouseUp();
        setTimeout(() => {
            expect(component.isActive).toBeFalse();
            done();
        }, component.delay);
    });

    it('should call onClickAction if defined when mouse is released', (done) => {
        const verificationTimeout = 50;
        component.delay = 100;
        component.isActive = true;
        component.onClickAction = jasmine.createSpy('onClickAction');

        component.onMouseUp();

        setTimeout(() => {
            expect(component.onClickAction).toHaveBeenCalled();
            done();
        }, component.delay + verificationTimeout);
    });

    it('should not throw an error if onClickAction is undefined', (done) => {
        const verificationTimeout = 50;
        component.delay = 100;
        component.onClickAction = undefined;
        expect(() => component.onMouseUp()).not.toThrow();
        setTimeout(() => {
            done();
        }, component.delay + verificationTimeout);
    });
});
