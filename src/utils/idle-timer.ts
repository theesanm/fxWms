type IdleTimerOptions = {
    timeout: number; // timeout in milliseconds
    onIdle: () => void;
    events?: string[]; // activity events to monitor
};

export class IdleTimer {
    private timeout: number;
    private onIdle: () => void;
    private timeoutId: NodeJS.Timeout | null = null;
    private events: string[];

    constructor({ timeout, onIdle, events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] }: IdleTimerOptions) {
        this.timeout = timeout;
        this.onIdle = onIdle;
        this.events = events;
        
        // Bind methods
        this.resetTimer = this.resetTimer.bind(this);
        this.handleIdle = this.handleIdle.bind(this);
    }

    start() {
        // Add event listeners
        this.events.forEach(event => {
            window.addEventListener(event, this.resetTimer);
        });
        
        // Start the timer
        this.resetTimer();
    }

    stop() {
        // Remove event listeners
        this.events.forEach(event => {
            window.removeEventListener(event, this.resetTimer);
        });
        
        // Clear the timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    private resetTimer() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(this.handleIdle, this.timeout);
    }

    private handleIdle() {
        this.onIdle();
        this.stop();
    }
}