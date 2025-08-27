import { TIME_SCALE, TIMER_INTERVAL } from '@common/consts/match-data.const';

export class Timer {
    maxTime: number = 0;
    lastUnpauseTime: number = 0;
    currentTime: number = 0;
    currentTimeRounded: number = 0;
    isStarted: boolean = false;
    private interval: number | null = null;
    private currentPerformance: number = performance.now();

    constructor(time: number) {
        const scaledTime = time / TIME_SCALE;
        this.maxTime = scaledTime;
        this.lastUnpauseTime = scaledTime;
        this.currentTime = scaledTime;
        this.currentTimeRounded = Math.ceil(scaledTime);
    }

    startTimer() {
        if (!this.isStarted) {
            this.isStarted = true;
            this.startInterval();
        }
    }

    restartTimer(time: number) {
        if (this.isStarted) {
            this.stopInterval();
            this.isStarted = false;
        }
        const scaledTime = time / TIME_SCALE;
        this.lastUnpauseTime = scaledTime;
        this.maxTime = scaledTime;
        this.currentTime = scaledTime;
        this.currentTimeRounded = Math.floor(scaledTime);
        this.startTimer();
    }

    pauseTimer(time: number) {
        if (this.isStarted) {
            this.stopInterval();
            this.isStarted = false;
        }
        const scaledTime = time / TIME_SCALE;
        this.lastUnpauseTime = scaledTime;
        this.currentTime = scaledTime;
        this.currentTimeRounded = Math.floor(scaledTime);
    }

    private startInterval() {
        this.stopInterval();
        this.currentPerformance = performance.now();
        this.interval = window.setInterval(this.intervalTrigger.bind(this), TIMER_INTERVAL);
    }

    private stopInterval() {
        if (this.interval !== null) {
            window.clearInterval(this.interval);
            this.interval = null;
        }
    }

    private intervalTrigger() {
        const newPerformance = performance.now();
        const elapsedTime = (newPerformance - this.currentPerformance) / TIME_SCALE;
        this.currentPerformance = newPerformance;

        this.currentTime = Math.max(this.currentTime - elapsedTime, 0);

        if (this.currentTime <= 0) {
            this.stopInterval();
            this.currentTimeRounded = 0;
        } else if (this.currentTimeRounded >= this.currentTime) {
            this.currentTimeRounded--;
        }
    }
}
