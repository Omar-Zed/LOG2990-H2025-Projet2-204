import { Overlay, OverlayConfig, OverlayContainer, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { WarningConfirmationPopupComponent } from '@app/components/warning-confirmation-popup/warning-confirmation-popup.component';
import { Popup } from '@app/interfaces/popup';
import { filter } from 'rxjs/operators';
import { POPUP_DELAY } from './popup.service.const';
import { KEYWORDS_TO_REPLACE } from '@app/consts/popup-message.const';

@Injectable({
    providedIn: 'root',
})
export class PopupService {
    private messages: Popup[] = [];
    private overlayRefs: { overlayRef: OverlayRef; componentRef: ComponentRef<WarningConfirmationPopupComponent> }[] = [];
    private keepMessagesOnNavigation: boolean = false;
    private overlay: Overlay = inject(Overlay);
    private overlayContainer: OverlayContainer = inject(OverlayContainer);
    private router: Router = inject(Router);

    constructor() {
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            if (!this.keepMessagesOnNavigation) {
                this.clearMessages();
            }
            this.keepMessagesOnNavigation = false;
        });
    }
    get popupComponents() {
        return this.overlayRefs.map((ref) => ref.componentRef.instance);
    }

    showPopup(popupMessage: Popup) {
        const containedKeyword = KEYWORDS_TO_REPLACE.filter((keyword) => popupMessage.message.toLowerCase().includes(keyword.toLowerCase()));
        if (containedKeyword.length > 0) {
            this.removeMessagesByFilter((message: string) => {
                return containedKeyword.some((keyword) => message.toLowerCase().includes(keyword.toLowerCase()));
            });
        }
        this.messages.push(popupMessage);
        this.displayPopup();
    }

    clearMessages() {
        this.setOverlayZIndexLow();
        this.messages = [];
        this.overlayRefs.forEach(({ overlayRef }) => overlayRef.dispose());
        this.overlayRefs = [];
    }

    keepMessages() {
        this.keepMessagesOnNavigation = true;
    }

    private removeMessagesByFilter(filterFn: (message: string) => boolean) {
        this.messages = this.messages.filter((popup) => !filterFn(popup.message));

        const popupsToRemove = this.overlayRefs.filter(({ componentRef }) => filterFn(componentRef.instance.message));

        popupsToRemove.forEach(({ overlayRef }) => {
            overlayRef.dispose();
        });

        this.overlayRefs = this.overlayRefs.filter((ref) => !popupsToRemove.includes(ref));

        if (this.overlayRefs.length === 0) {
            this.setOverlayZIndexLow();
        }
    }

    private displayPopup() {
        const currentMessage = this.messages.shift();
        if (!currentMessage) return;

        const overlayConfig = new OverlayConfig({
            hasBackdrop: false,
        });
        const overlayRef = this.overlay.create(overlayConfig);
        this.setOverlayZIndexHigh();

        const popupPortal = new ComponentPortal(WarningConfirmationPopupComponent);
        const popupComponentRef = overlayRef.attach(popupPortal);
        this.overlayRefs.push({ overlayRef, componentRef: popupComponentRef });

        popupComponentRef.instance.message = currentMessage.message;
        popupComponentRef.instance.hasCloseButton = currentMessage.hasCloseButton;
        popupComponentRef.instance.isConfirmation = currentMessage.isConfirmation;
        if (currentMessage.popupColor) {
            popupComponentRef.instance.popupColor = currentMessage.popupColor;
        }
        popupComponentRef.instance.closed.subscribe((confirmed: boolean) => {
            this.handlePopupClose(confirmed, overlayRef, currentMessage);
        });

        if (!currentMessage.isConfirmation) {
            setTimeout(() => {
                this.handlePopupClose(false, overlayRef, null);
            }, POPUP_DELAY);
        }
    }

    private handlePopupClose(confirmed: boolean, overlayRef: OverlayRef, message: Popup | null) {
        const isMessageConfirmed = message && message.isConfirmation;
        if (isMessageConfirmed && confirmed && message.action) {
            message.action();
        }

        overlayRef.dispose();
        this.overlayRefs = this.overlayRefs.filter(({ overlayRef: ref }) => ref !== overlayRef);

        if (this.overlayRefs.length === 0) {
            this.setOverlayZIndexLow();
        }
    }

    private setOverlayZIndexLow() {
        this.overlayContainer.getContainerElement().setAttribute('style', 'z-index: -99');
    }

    private setOverlayZIndexHigh() {
        this.overlayContainer.getContainerElement().setAttribute('style', 'z-index: 99');
    }
}
