import { Game } from '@app/model/schema/game.schema';
import { GameService } from '@app/services/game/game.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { GameController } from './game.controller';

describe('GameController', () => {
    let controller: GameController;
    let gameService: SinonStubbedInstance<GameService>;

    const fakeGame = new Game();

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameController],
            providers: [{ provide: GameService, useValue: gameService }],
        }).compile();

        controller = module.get<GameController>(GameController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('allGames() should return all games', async () => {
        const fakeGames = [new Game(), new Game()];
        gameService.getAllGames.resolves(fakeGames);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (games) => {
            expect(games).toEqual(fakeGames);
            return res;
        };

        await controller.allGames(res);
    });

    it('getGame() should return a game by ID', async () => {
        gameService.getGame.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.getGame('valid_id', res);
    });

    it('saveGame() should create or update a game', async () => {
        gameService.saveGame.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.saveGame({} as Game, res);
    });

    it('addGame() should create a new game', async () => {
        gameService.addGame.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.addGame({} as Game, res);
    });

    it('updateGame() should update a game', async () => {
        gameService.updateGame.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.updateGame('valid_id', {} as Game, res);
    });

    it('toggleVisibility() should toggle visibility of a game', async () => {
        gameService.toggleVisibility.resolves(fakeGame);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (game) => {
            expect(game).toEqual(fakeGame);
            return res;
        };

        await controller.toggleVisibility('valid_id', res);
    });

    it('deleteGame() should delete a game', async () => {
        gameService.deleteGame.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NO_CONTENT);
            return res;
        };
        res.send = () => res;

        await controller.deleteGame('valid_id', res);
    });

    it('isNameUnique() should return the correct uniqueness status without an ID', async () => {
        const cases = [
            { name: 'UniqueName', expected: true },
            { name: 'ExistingName', expected: false },
        ];

        for (const testCase of cases) {
            gameService.isNameUnique.resolves(testCase.expected);

            const res = {} as unknown as Response;
            res.status = (code) => {
                expect(code).toEqual(HttpStatus.OK);
                return res;
            };
            res.json = (data) => {
                expect(data).toEqual(testCase.expected);
                return res;
            };

            await controller.isNameUnique(testCase.name, undefined, res);
        }
    });

    it('isNameUnique() should return the correct uniqueness status with an ID', async () => {
        const cases = [
            { name: 'ExistingName', id: '123', expected: true },
            { name: 'ExistingName', id: '456', expected: false },
        ];

        for (const testCase of cases) {
            gameService.isNameUnique.resolves(testCase.expected);

            const res = {} as unknown as Response;
            res.status = (code) => {
                expect(code).toEqual(HttpStatus.OK);
                return res;
            };
            res.json = (data) => {
                expect(data).toEqual(testCase.expected);
                return res;
            };

            await controller.isNameUnique(testCase.name, testCase.id, res);
        }
    });
});
