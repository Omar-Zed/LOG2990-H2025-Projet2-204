import { TestBed } from '@angular/core/testing';
import { MatchService } from '@app/services/match/match.service';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let mockMatchService: jasmine.SpyObj<MatchService>;
    let mockSocketService: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        mockMatchService = jasmine.createSpyObj('MatchService', ['isInMatch'], {
            selfPlayer: { name: 'TestUser' },
        });

        mockSocketService = jasmine.createSpyObj('SocketService', ['emit']);

        TestBed.configureTestingModule({
            providers: [ChatService, { provide: MatchService, useValue: mockMatchService }, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(ChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send a message', () => {
        const message = 'Hello, world!';
        mockSocketService.emit.and.callFake(async () => Promise.resolve(false));
        service.sendMessage(message);
        expect(mockSocketService.emit).toHaveBeenCalled();
    });
});
