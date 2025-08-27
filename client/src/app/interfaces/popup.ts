export interface Popup {
    message: string;
    hasCloseButton: boolean;
    isConfirmation: boolean;
    popupColor?: PopupColor;
    action?: () => void;
}

export enum PopupColor {
    Blue = 'blue',
    Green = 'green',
    Orange = 'orange',
}
