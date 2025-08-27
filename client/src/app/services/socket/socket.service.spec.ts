import { TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper/socket-test-helper';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';

describe('SocketService', () => {
    let service: SocketService;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketService);
        socketHelper = new SocketTestHelper();
        service['socket'] = socketHelper as unknown as Socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return socket id through selfId getter', () => {
        Object.defineProperty(service['socket'], 'id', { value: 'test-socket-id' });
        expect(service.selfId).toBe('test-socket-id');
    });

    it('should emit event with arguments', () => {
        const spy = spyOn(service['socket'], 'emit');
        const event = 'testEvent';
        const data1 = 'data1';
        const data2 = { key: 'value' };

        service.emit(event, data1, data2);

        expect(spy).toHaveBeenCalledWith(event, data1, data2);
    });

    it('should emit event with data and callback', () => {
        const event = 'testEvent';
        const data = 'testData';
        const mockCallback = jasmine.createSpy('callback');

        Object.defineProperty(service['socket'], 'emit', {
            value: (_msg: string, _value: string, callback: () => boolean) => {
                callback();
                return true;
            },
        });

        service.emit(event, data, mockCallback);

        expect(mockCallback).toHaveBeenCalled();
    });

    it('should register event listener on socket', () => {
        const spy = spyOn(service['socket'], 'on');
        const event = 'testEvent';
        const callback = jasmine.createSpy('callback');

        service.on(event, callback);

        expect(spy).toHaveBeenCalledWith(event, callback);
    });

    it('should execute callback when event is emitted', () => {
        const event = 'testEvent';
        const callbackSpy = jasmine.createSpy('callback');
        const testData = { message: 'test' };

        service.on(event, callbackSpy);
        (service['socket'] as unknown as SocketTestHelper).peerSideEmit(event, testData);

        expect(callbackSpy).toHaveBeenCalledWith(testData);
    });
});
