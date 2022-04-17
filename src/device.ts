import { EventEmitter } from 'events';
import { Crt } from './crt';
import { Simulation } from './sim';


class DeviceEmulator {
    sim: Simulation
    crt: Crt
    timer: Timer

    constructor(sim: Simulation, crt: Crt) {
        this.sim = sim;
        this.crt = crt;
        this.timer = new Timer;
        this.sim.on('video:out', ({y, data}) => crt.setLine(y, data));
        this.sim.on('end', () => this.cleanup());
        this.timer.on('tick', () => this.sim.send('-'))
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
        this.ival = window.setInterval(() => this.emit('tick'), every);
    }

    stop() {
        this.ival && window.clearInterval(this.ival);
        this.ival = undefined;
    }
}


export { DeviceEmulator, Timer }