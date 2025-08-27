import { Overlay, OverlayContainer } from '@angular/cdk/overlay';
import { Component, ComponentRef } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { WarningConfirmationPopupComponent } from '@app/components/warning-confirmation-popup/warning-confirmation-popup.component';
import { Popup, PopupColor } from '@app/interfaces/popup';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { Subject } from 'rxjs';
import { PopupService } from './popup.service';
import { POPUP_DELAY } from './popup.service.const';

@Component({
    selector: 'app-warning-confirmation-popup',
    template: '',
    standalone: true,
})
class MockWarningConfirmationPopupComponent {
    message = '';
    isConfirmation = false;
    closed = new Subject<boolean>();
}

const HALF_DELAY = POPUP_DELAY / 2;

describe('PopupService', () => {
    let service: PopupService;
    let overlayContainer: OverlayContainer;
    let routerEventsSubject: Subject<NavigationEnd>;
    beforeEach(() => {
        routerEventsSubject = new Subject<NavigationEnd>();

        TestBed.configureTestingModule({
            imports: [MockWarningConfirmationPopupComponent],
            providers: [
                PopupService,
                Overlay,
                {
                    provide: Router,
                    useValue: {
                        events: routerEventsSubject.asObservable(),
                    },
                },
                {
                    provide: WarningConfirmationPopupComponent,
                    useClass: MockWarningConfirmationPopupComponent,
                },
            ],
        });

        service = TestBed.inject(PopupService);
        overlayContainer = TestBed.inject(OverlayContainer);
    });

    afterEach(() => {
        overlayContainer.ngOnDestroy();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should clear messages and overlays on clearMessages', () => {
        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        service.clearMessages();

        expect(service['messages'].length).toBe(0);
        expect(service['overlayRefs'].length).toBe(0);
    });

    it('should keep overlayRefs on navigation when keepMessages is called', () => {
        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        service.keepMessages();

        routerEventsSubject.next(new NavigationEnd(1, PageEndpoint.Edit, PageEndpoint.Admin));
        expect(service['overlayRefs'].length).toBe(1);
    });

    it('should execute action on confirmation', fakeAsync(() => {
        const actionSpy = jasmine.createSpy('action');
        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: true,
            action: actionSpy,
        };
        service.showPopup(popupMessage);

        tick();

        const popupComponent = service.popupComponents[0];
        expect(popupComponent).toBeDefined();

        popupComponent.closed.next(true);
        tick();

        expect(actionSpy).toHaveBeenCalled();
    }));

    it('should auto-close regular popup after delay', fakeAsync(() => {
        const popupMessage: Popup = {
            message: 'Regular message',
            hasCloseButton: false,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        expect(service['overlayRefs'].length).toBe(1);

        tick(POPUP_DELAY);
        expect(service['overlayRefs'].length).toBe(0);
    }));

    it('should adjust z-index correctly', () => {
        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        const container = overlayContainer.getContainerElement();
        expect(container.style.zIndex).toBe('99');

        service['setOverlayZIndexLow']();
        expect(container.style.zIndex).toBe('-99');
    });

    it('should clear messages on navigation by default', () => {
        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        routerEventsSubject.next(new NavigationEnd(1, '/new', '/new'));

        expect(service['overlayRefs'].length).toBe(0);
    });

    it('should handle multiple messages in sequence', fakeAsync(() => {
        const popupMessage1 = {
            message: 'First message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        const popupMessage2 = {
            message: 'Second message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage1);
        expect(service['overlayRefs'].length).toBe(1);
        tick(HALF_DELAY);

        service.showPopup(popupMessage2);
        expect(service['overlayRefs'].length).toBe(2);

        tick(HALF_DELAY);
        expect(service['overlayRefs'].length).toBe(1);
    }));

    it('should set and reset z-index correctly', () => {
        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        const container = overlayContainer.getContainerElement();
        expect(container.style.zIndex).toBe('99');

        service.clearMessages();
        expect(container.style.zIndex).toBe('-99');
    });

    it('should access popup components via getter', () => {
        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        const popupComponents = service.popupComponents;
        expect(popupComponents.length).toBe(1);
        expect(popupComponents[0].message).toBe('Test message');
    });

    it('should return null when no popups are active', () => {
        expect(service.popupComponents.length).toBe(0);

        const popupMessage: Popup = {
            message: 'Test message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage);
        expect(service.popupComponents.length).toBe(1);

        service.clearMessages();
        expect(service.popupComponents.length).toBe(0);
    });

    it('should display next popup when a popup is closed', fakeAsync(() => {
        const popupMessage1 = {
            message: 'First message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        const popupMessage2 = {
            message: 'Second message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(popupMessage1);
        service.showPopup(popupMessage2);

        expect(service.popupComponents.length).toBe(2);

        service.popupComponents[0].closed.next(false);
        tick();

        expect(service.popupComponents.length).toBe(1);
        expect(service.popupComponents[0].message).toBe('Second message');

        service.popupComponents[0].closed.next(false);
        tick();

        expect(service.popupComponents.length).toBe(0);
    }));

    it('should do nothing when no message is queued', () => {
        service['messages'] = [];
        service['displayPopup']();
        expect(service['overlayRefs'].length).toBe(0);
    });

    it('should remove messages by filter', () => {
        const popupMessage1 = {
            message: 'debug info',
            hasCloseButton: true,
            isConfirmation: false,
        };
        const popupMessage2 = {
            message: 'other message',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service['messages'] = [popupMessage1, popupMessage2];

        const mockOverlayRef1 = jasmine.createSpyObj('OverlayRef', ['dispose']);
        const mockOverlayRef2 = jasmine.createSpyObj('OverlayRef', ['dispose']);

        service['overlayRefs'] = [
            {
                overlayRef: mockOverlayRef1,
                componentRef: {
                    instance: { message: 'debug info' } as WarningConfirmationPopupComponent,
                } as ComponentRef<WarningConfirmationPopupComponent>,
            },
            {
                overlayRef: mockOverlayRef2,
                componentRef: {
                    instance: { message: 'other message' } as WarningConfirmationPopupComponent,
                } as ComponentRef<WarningConfirmationPopupComponent>,
            },
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        spyOn<any>(service, 'setOverlayZIndexLow');

        service['removeMessagesByFilter']((msg) => msg.includes('debug'));

        expect(service['messages'].length).toBe(1);
        expect(service['messages'][0].message).toBe('other message');
        expect(mockOverlayRef1.dispose).toHaveBeenCalled();
        expect(mockOverlayRef2.dispose).not.toHaveBeenCalled();
        expect(service['overlayRefs'].length).toBe(1);
        expect(service['setOverlayZIndexLow']).not.toHaveBeenCalled();

        service['overlayRefs'][0].componentRef.instance.message = 'debug too';
        service['removeMessagesByFilter']((msg) => msg.includes('debug') || msg.includes('other'));
        expect(service['setOverlayZIndexLow']).toHaveBeenCalled();
        expect(service['overlayRefs'].length).toBe(0);
    });

    it('should replace existing messages containing the same keyword when showing a new message', fakeAsync(() => {
        const debugMessage = {
            message: 'debug information',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(debugMessage);
        tick();
        expect(service.popupComponents.length).toBe(1);
        expect(service.popupComponents[0].message).toBe('debug information');

        const newDebugMessage = {
            message: 'new debug info',
            hasCloseButton: true,
            isConfirmation: false,
        };
        service.showPopup(newDebugMessage);
        tick();
        expect(service.popupComponents.length).toBe(1);
        expect(service.popupComponents[0].message).toBe('new debug info');

        const otherMessage = {
            message: 'regular message without keyword',
            hasCloseButton: true,
            isConfirmation: false,
            popupColor: PopupColor.Green,
        };
        service.showPopup(otherMessage);
        tick();
        expect(service.popupComponents.length).toBe(2);
        expect(service.popupComponents[0].message).toBe('new debug info');
        expect(service.popupComponents[1].message).toBe('regular message without keyword');
    }));
});
