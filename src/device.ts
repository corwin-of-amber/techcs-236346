import { EventEmitter } from 'events';
import { Crt } from './crt';
import { Simulation } from './sim';


class DeviceEmulator {
    sim: Simulation
    crt: Crt
    timer: Timer
    keyboard: Keyboard

    constructor(sim: Simulation, crt: Crt) {
        this.sim = sim;
        this.crt = crt;
        this.timer = new Timer;
        this.keyboard = new Keyboard;
        this.sim.on('video:out', ({y, data}) => crt.setLine(y, data));
        this.sim.on('end', ({id}) => {
            id === this.sim.currentId && this.cleanup();
        });
        this.timer.on('tick', () =>
            this.sim.send(this.keyboard.getc() ?? '-'))
    }

    async start(binFn?: string, env?: any) {
        this.crt.clear();
        this.crt.start(25);
        this.timer.start(100);
        await Promise.resolve();
        this.sim.start(binFn, env);
    }

    stop() {
        this.sim.stop();
    }

    cleanup() {
        this.crt.stop();    setTimeout(() => this.crt.refresh(), 20); 
        this.timer.stop();
    }
}


class Timer extends EventEmitter {
    ival: number

    start(every: number /*ms*/) {
        this.stop();
        this.ival = window.setInterval(() => this.emit('tick'), every);
    }

    stop() {
        this.ival && window.clearInterval(this.ival);
        this.ival = undefined;
    }
}


/**
 * The keyboard stores at most one keystroke in a buffer, so that it
 * can be sent with the next timer event.
 */
class Keyboard {
    buffer?: string

    putc(key: string | KeyboardEvent) {
        if (typeof key !== 'string') {
            key = this.scancode(key.key);
        }
        this.buffer = key as string;
    }

    getc() {
        var v = this.buffer;
        if (v) console.log('%csending key', 'color: green', [v]);
        this.buffer = undefined;
        return v;
    }

    scancode(key: string) {
        return Keyboard.SCANCODES[key] ?? '?';
    }

    static readonly SCANCODES = {
        'ArrowRight': '\x4d', 'ArrowLeft': '\x4b',
        'ArrowUp': '\x48', 'ArrowDown': '\x50'
    }
}


export { DeviceEmulator, Timer }