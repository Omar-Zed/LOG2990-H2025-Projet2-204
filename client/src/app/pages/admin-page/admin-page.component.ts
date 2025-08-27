import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CreateGamePopupComponent } from '@app/components/create-game-popup/create-game-popup.component';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { PokeballButtonComponent } from '@app/components/pokeball-button/pokeball-button.component';
import { PopupMessage } from '@app/consts/popup-message.const';
import { BackgroundMusic, SoundEffect } from '@app/interfaces/sound-service';
import { VisibilityEvent } from '@app/interfaces/visibility-event';
import { AudioService } from '@app/services/audio/audio.service';
import { GameSaveService } from '@app/services/game-save/game-save.service';
import { PopupService } from '@app/services/popup/popup.service';
import { PageEndpoint } from '@common/interfaces/endpoint.enum';
import { GameData } from '@common/interfaces/game-data';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [GameCardComponent, PokeballButtonComponent, CreateGamePopupComponent, CommonModule, HeaderComponent],
})
export class AdminPageComponent implements OnInit {
    games: GameData[] = [];
    isCreationMode: boolean = false;
    private readonly audioService: AudioService = inject(AudioService);
    private readonly router: Router = inject(Router);
    private readonly gameSaveService: GameSaveService = inject(GameSaveService);
    private readonly popupService: PopupService = inject(PopupService);

    @HostListener('document:keydown.escape')
    onEscapeKeydown() {
        if (this.isCreationMode) {
            this.isCreationMode = false;
        }
    }

    navigateToMenu() {
        this.router.navigate([PageEndpoint.Menu]);
        this.audioService.playEffect(SoundEffect.Click);
    }

    ngOnInit() {
        this.loadGames();
        this.audioService.playBackgroundMusic(BackgroundMusic.Home);
    }

    editGame(id: string) {
        this.gameSaveService.getGame(id).subscribe({
            next: () => {
                this.router.navigate([PageEndpoint.Edit]);
            },
            error: (error: HttpErrorResponse) => {
                this.handleNotFoundError(error);
            },
        });
    }

    toggleVisibility(event: VisibilityEvent) {
        this.gameSaveService.toggleVisibility(event.id).subscribe({
            error: (error: HttpErrorResponse) => {
                this.handleNotFoundError(error);
            },
        });
    }

    deleteGame(id: string, name: string) {
        this.popupService.showPopup({
            message: `${PopupMessage.DeleteGame} ${name}`,
            hasCloseButton: true,
            isConfirmation: true,
            action: () => this.confirmDeleteGame(id),
        });
    }

    onCreateGame() {
        this.isCreationMode = !this.isCreationMode;
        this.audioService.playEffect(SoundEffect.Click);
    }

    getCardColor(index: number): string {
        const classes = ['blue-card', 'green-card', 'pink-card'];
        const classIndex = index % classes.length;
        return classes[classIndex];
    }

    private loadGames() {
        this.gameSaveService.getAllGames().subscribe({
            next: (games) => {
                this.games = games;
            },
            error: () => {
                this.popupService.showPopup({ message: PopupMessage.ErrorLoadingGames, hasCloseButton: true, isConfirmation: false });
            },
        });
    }

    private confirmDeleteGame(id: string) {
        this.gameSaveService.deleteGame(id).subscribe({
            next: () => {
                this.games = this.games.filter((game) => game._id !== id);
            },
            error: (error: HttpErrorResponse) => {
                this.handleNotFoundError(error);
            },
        });
    }

    private handleNotFoundError(error: HttpErrorResponse) {
        if (error.status === HttpStatusCode.NotFound) {
            this.popupService.showPopup({ message: PopupMessage.GameDoesNotExist, hasCloseButton: true, isConfirmation: false });
            this.loadGames();
        } else {
            this.popupService.showPopup({ message: PopupMessage.ErrorFetchingGame, hasCloseButton: true, isConfirmation: false });
        }
    }
}
