import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { UpdateGameDto } from '@app/model/dto/game/update-game.dto';
import { Game } from '@app/model/schema/game.schema';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';

@Injectable()
export class GameService {
    @InjectModel(Game.name) private gameModel: Model<Game>;
    async getAllGames(): Promise<Game[]> {
        return this.gameModel.find().exec();
    }

    async findGame(id: string): Promise<Game> {
        return this.gameModel.findById(id).exec();
    }

    async getGame(id: string): Promise<Game> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException(`Invalid ID format: ${id}`);
        }
        const game = await this.findGame(id);
        if (!game) {
            throw new NotFoundException(`Game with ID ${id} not found.`);
        }
        return game;
    }

    async saveGame(gameDto: CreateGameDto): Promise<Game> {
        if (gameDto._id) {
            const existingGame = await this.gameModel.findById(gameDto._id).exec();
            if (existingGame) {
                return this.updateGame(gameDto._id, gameDto);
            }
        }
        delete gameDto._id;
        return this.addGame(gameDto);
    }

    async addGame(createGameDto: CreateGameDto): Promise<Game> {
        if (!(await this.isNameUnique(createGameDto.name))) {
            throw new BadRequestException(`Game with name ${createGameDto.name} already exists.`);
        }
        try {
            return await this.gameModel.create(createGameDto);
        } catch (error) {
            throw new BadRequestException(`Failed to insert game: ${error.message}`);
        }
    }

    async updateGame(id: string, updateGameDto: UpdateGameDto): Promise<Game> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException(`Invalid ID format: ${id}`);
        }
        if (!(await this.isNameUnique(updateGameDto.name, id))) {
            throw new BadRequestException(`Game with name ${updateGameDto.name} already exists.`);
        }
        const updatedGame = await this.gameModel.findByIdAndUpdate(id, updateGameDto, { new: true }).exec();
        if (!updatedGame) {
            throw new NotFoundException(`Game with ID ${id} not found.`);
        }
        return updatedGame;
    }

    async toggleVisibility(id: string): Promise<Game> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException(`Invalid ID format: ${id}`);
        }
        const game = await this.gameModel.findById(id).exec();
        if (!game) {
            throw new NotFoundException(`Game with ID ${id} not found.`);
        }
        game.isVisible = !game.isVisible;
        return game.save();
    }

    async deleteGame(id: string): Promise<void> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException(`Invalid ID format: ${id}`);
        }
        const result = await this.gameModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Game with ID ${id} not found.`);
        }
    }

    async isNameUnique(name: string, exceptId?: string): Promise<boolean> {
        if (!name) {
            throw new BadRequestException('Name is required.');
        }
        if (exceptId) {
            return (await this.gameModel.find({ name, _id: { $ne: exceptId } }).exec()).length === 0;
        } else {
            return (await this.gameModel.find({ name }).exec()).length === 0;
        }
    }
}
