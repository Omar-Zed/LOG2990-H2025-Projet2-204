import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { GameService } from '@app/services/game/game.service';
import { Game, GameDocument, gameSchema } from '@app/model/schema/game.schema';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MapSize, GameMode } from '@common/interfaces/map-data';

describe('GameService', () => {
    let service: GameService;
    let gameModel: Model<GameDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;

    const fakeGame: Game = {
        name: 'Test Game',
        description: 'Test Description',
        lastEdited: new Date(),
        isVisible: true,
        mapData: {
            tiles: [[]],
            items: {
                [ItemType.Item1]: [],
                [ItemType.Item2]: [],
                [ItemType.Item3]: [],
                [ItemType.Item4]: [],
                [ItemType.Item5]: [],
                [ItemType.Item6]: [],
                [ItemType.Random]: [],
                [ItemType.Spawn]: [],
                [ItemType.Flag]: [],
            },
            size: MapSize.Small,
            gameMode: GameMode.FFA,
        },
    };

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]),
            ],
            providers: [GameService],
        }).compile();

        service = module.get<GameService>(GameService);
        gameModel = module.get<Model<GameDocument>>(getModelToken(Game.name));
        connection = await module.get(getConnectionToken());
    });

    afterEach(async () => {
        await gameModel.deleteMany({});
    });

    afterAll(async () => {
        await connection.close();
        await mongoServer.stop({ doCleanup: true });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(gameModel).toBeDefined();
    });

    it('getAllGames() should return all games in the database', async () => {
        await gameModel.create(fakeGame);
        expect((await service.getAllGames()).length).toBeGreaterThan(0);
    });

    it('getGame() should return a game by ID', async () => {
        const createdGame = await gameModel.create(fakeGame);
        const foundGame = await service.getGame(createdGame._id);
        expect(foundGame).toBeDefined();
        expect(foundGame._id.toString()).toEqual(createdGame._id.toString());
    });

    it('getGame() should throw BadRequestException for invalid ID format', async () => {
        await expect(service.getGame('invalid_id')).rejects.toThrow(BadRequestException);
    });

    it('getGame() should throw NotFoundException if game not found', async () => {
        const validObjectId = new gameModel()._id;
        await expect(service.getGame(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('should create a new game if _id is empty', async () => {
        const newGame = { ...fakeGame, _id: '' };
        const addSpy = jest.spyOn(service, 'addGame');
        const updateSpy = jest.spyOn(service, 'updateGame');
        const savedGame = await service.saveGame(newGame);
        expect(savedGame).toBeDefined();
        expect(addSpy).toHaveBeenCalled();
        expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should update an existing game if _id is not empty and exists', async () => {
        const existingGame = await gameModel.create(fakeGame);
        const updatedGame = { ...existingGame.toObject(), name: 'Updated Game' };
        const updateSpy = jest.spyOn(service, 'updateGame');
        const savedGame = await service.saveGame(updatedGame);
        expect(savedGame).toBeDefined();
        expect(updateSpy).toHaveBeenCalled();
    });

    it('addGame() should create a new game', async () => {
        const createdGame = await service.addGame(fakeGame);
        expect(createdGame).toBeDefined();
        expect(createdGame.name).toEqual(fakeGame.name);
    });

    it('addGame() should throw BadRequestException if name already exists', async () => {
        await gameModel.create(fakeGame);
        await expect(service.addGame(fakeGame)).rejects.toThrow(BadRequestException);
    });

    it('addGame() should throw BadRequestException if the database create() fails', async () => {
        jest.spyOn(gameModel, 'create').mockRejectedValueOnce(new Error('Database error'));
        await expect(service.addGame(fakeGame)).rejects.toThrow(BadRequestException);
    });

    it('updateGame() should update an existing game', async () => {
        const createdGame = await gameModel.create(fakeGame);
        const updateData = { name: 'Updated Game' };
        const updatedGame = await service.updateGame(createdGame._id, updateData);
        expect(updatedGame).toBeDefined();
        expect(updatedGame.name).toEqual(updateData.name);
    });

    it('updateGame() should throw BadRequestException for invalid ID format', async () => {
        const updateData = { name: 'Updated Game' };
        await expect(service.updateGame('invalid_id', updateData)).rejects.toThrow(BadRequestException);
    });

    it('updateGame() should throw BadRequestException if the new name already exists', async () => {
        const game1 = fakeGame;
        const game2 = { ...fakeGame, name: 'Another Game' };
        await gameModel.create(game1);
        const createdGame2 = await gameModel.create(game2);

        await expect(service.updateGame(createdGame2._id, { name: game1.name })).rejects.toThrow(BadRequestException);
    });

    it('updateGame() should throw NotFoundException if findByIdAndUpdate returns null', async () => {
        const nonExistentId = (await gameModel.create(fakeGame))._id.toString();
        await gameModel.deleteMany({});
        await expect(service.updateGame(nonExistentId, { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('toggleVisibility() should toggle the visibility of a game', async () => {
        const createdGame = await gameModel.create(fakeGame);
        await service.toggleVisibility(createdGame._id);
        const updatedGame = await gameModel.findById(createdGame._id);
        expect(updatedGame.isVisible).toBe(!createdGame.isVisible);
    });

    it('toggleVisibility() should throw NotFoundException if game not found', async () => {
        const nonExistentId = new gameModel()._id.toString();
        await expect(service.toggleVisibility(nonExistentId)).rejects.toThrow(NotFoundException);
    });

    it('toggleVisibility() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'findById').mockResolvedValueOnce(null);
        await expect(service.toggleVisibility(fakeGame._id)).rejects.toBeTruthy();
    });

    it('deleteGame() should delete the game', async () => {
        const createdGame = await gameModel.create(fakeGame);
        await service.deleteGame(createdGame._id);
        expect(await gameModel.countDocuments()).toEqual(0);
    });

    it('deleteGame() should fail if the game does not exist', async () => {
        const nonExistentId = new gameModel()._id.toString();
        await expect(service.deleteGame(nonExistentId)).rejects.toThrow(NotFoundException);
    });

    it('deleteGame() should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'findByIdAndDelete').mockResolvedValueOnce(null);
        await expect(service.deleteGame(fakeGame._id)).rejects.toBeTruthy();
    });

    it('isNameUnique() should return true if name is unique', async () => {
        const name = 'Unique Name';
        expect(await service.isNameUnique(name)).toBeTruthy();
    });

    it('isNameUnique() should return false if name is not unique', async () => {
        const name = 'Not Unique Name';
        await gameModel.create({ ...fakeGame, name });
        expect(await service.isNameUnique(name)).toBeFalsy();
    });

    it('isNameUnique() should throw BadRequestException if name is empty', async () => {
        await expect(service.isNameUnique('')).rejects.toThrow(BadRequestException);
    });
});
