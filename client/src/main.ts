import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CharacterPageComponent } from '@app/pages/character-page/character-page.component';
import { CombatPageComponent } from '@app/pages/combat-page/combat-page.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { EditPageComponent } from '@app/pages/edit-page/edit-page.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { LobbyPageComponent } from '@app/pages/lobby-page/lobby-page.component';
import { MenuPageComponent } from '@app/pages/menu-page/menu-page.component';
import { PlayPageComponent } from '@app/pages/play-page/play-page.component';
import { StatPageComponent } from '@app/pages/stat-page/stat-page.component';
import { environment } from './environments/environment';


if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', component: MenuPageComponent, pathMatch: 'full' },
    { path: 'play', component: PlayPageComponent },
    { path: 'lobby', component: LobbyPageComponent },
    { path: 'join', component: JoinPageComponent },
    { path: 'admin', component: AdminPageComponent },
    { path: 'create', component: CreatePageComponent },
    { path: 'edit', component: EditPageComponent },
    { path: 'combat', component: CombatPageComponent },
    { path: 'stat', component: StatPageComponent },
    { path: 'character', component: CharacterPageComponent },
    { path: '**', redirectTo: '' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations()],
});
