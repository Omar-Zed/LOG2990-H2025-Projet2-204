import { COMBAT_TURN_DURATION } from '@common/consts/combat-data.const';
import { Timer } from './timer';

describe('Timer', () => {
    let timer: Timer;

    beforeEach(() => {
        timer = new Timer(COMBAT_TURN_DURATION);
    });

    it('should be created', () => {
        expect(timer).toBeTruthy();
    });

    it('should start timer start interval', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const startIntervalSpy = spyOn<any>(timer, 'startInterval').and.callThrough();

        timer.startTimer();

        expect(timer.isStarted).toBeTrue();
        expect(startIntervalSpy).toHaveBeenCalled();
    });

    it('should restart timer stop and start timer', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const stopIntervalSpy = spyOn<any>(timer, 'stopInterval').and.callThrough();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const startTimerSpy = spyOn<any>(timer, 'startTimer').and.callThrough();
        timer.isStarted = true;

        timer.restartTimer(COMBAT_TURN_DURATION);

        expect(stopIntervalSpy).toHaveBeenCalled();
        expect(startTimerSpy).toHaveBeenCalled();
    });

    it('should restart timer stop and start timer', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const stopIntervalSpy = spyOn<any>(timer, 'stopInterval').and.callThrough();
        timer.isStarted = true;

        timer.pauseTimer(COMBAT_TURN_DURATION);

        expect(stopIntervalSpy).toHaveBeenCalled();
    });

    it('should start interval and stop any existing one', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const stopIntervalSpy = spyOn<any>(timer, 'stopInterval').and.callThrough();
        const setIntervalSpy = spyOn(window, 'setInterval').and.callThrough();

        timer['startInterval']();

        expect(stopIntervalSpy).toHaveBeenCalled();
        expect(setIntervalSpy).toHaveBeenCalled();
    });

    it('should stop interval and clear interval', () => {
        const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
        timer['interval'] = 1;

        timer['stopInterval']();

        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should interval trigger should stop interval', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private method
        const stopIntervalSpy = spyOn<any>(timer, 'stopInterval').and.callThrough();
        timer['currentTime'] = 0;

        timer['intervalTrigger']();

        expect(stopIntervalSpy).toHaveBeenCalled();
    });

    it('should set currentTimeRounded to 0 when timer reaches 0', () => {
        timer['currentTime'] = 0.1;
        timer['currentTimeRounded'] = 1;
        timer.isStarted = true;

        timer['intervalTrigger']();

        expect(timer.currentTimeRounded).toBe(0);
    });
});
