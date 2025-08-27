import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiEndpoint } from '@common/interfaces/endpoint.enum';
import { GameData } from '@common/interfaces/game-data';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameSaveService {
    private readonly baseUrl: string = environment.serverUrl;
    private readonly http: HttpClient = inject(HttpClient);

    getAllGames(): Observable<GameData[]> {
        return this.http.get<GameData[]>(`${this.baseUrl}/${ApiEndpoint.Games}`);
    }

    getGame(gameId: string): Observable<GameData> {
        return this.http.get<GameData>(`${this.baseUrl}/${ApiEndpoint.Games}/${gameId}`);
    }

    saveGame(gameData: GameData): Observable<GameData> {
        return this.http.put<GameData>(`${this.baseUrl}/${ApiEndpoint.Games}`, gameData);
    }

    toggleVisibility(gameId: string): Observable<GameData> {
        return this.http.patch<GameData>(`${this.baseUrl}/${ApiEndpoint.Games}/${gameId}/${ApiEndpoint.Toggle}`, {});
    }

    deleteGame(gameId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${ApiEndpoint.Games}/${gameId}`);
    }

    isNameUnique(name: string, id: string = ''): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/${ApiEndpoint.Games}/${ApiEndpoint.IsNameUnique}`, {
            params: { name, id },
        });
    }
}
