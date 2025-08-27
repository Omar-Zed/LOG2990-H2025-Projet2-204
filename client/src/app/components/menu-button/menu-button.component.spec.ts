import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MenuButtonComponent } from '@app/components/menu-button/menu-button.component';

describe('MenuButtonComponent', () => {
    let component: MenuButtonComponent;
    let fixture: ComponentFixture<MenuButtonComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    const delay = 200;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [MenuButtonComponent],
            providers: [{ provide: Router, useValue: routerSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(MenuButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default @Input values', () => {
        expect(component.containerClass).toBe('container orange-container');
        expect(component.spriteImage).toBe('./assets/images/menu/pokemon/normal/charizard.png');
        expect(component.textContent).toBe('');
    });

    it('should navigate with delay when navigateWithDelay is called', (done) => {
        component.routePath = '/test-path';

        component.navigateWithDelay();

        setTimeout(() => {
            expect(component.isActive).toBeFalse();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-path']);
            done();
        }, delay);
    });
});
