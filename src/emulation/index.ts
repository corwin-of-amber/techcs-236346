import BitSet from '../infra/bitset';
import { WorkerWithEvents } from '../infra/worker-ipc';
import { Simulation, EnvOpts } from '../sim';


class Emulation extends Simulation {
    worker: WorkerWithEvents

    constructor() {
        super('');
    }

    start(binFn: string = this.binFn, env: EnvOpts = this.env) {
        this.binFn = binFn;
        this.env = env;
        this.emit('start');
        let worker = new WorkerWithEvents('worker.js');
        worker.postMessage({type: 'start', ev: {asm: binFn}});  /** @oops */
        worker.on('video:out', ({y, data}) =>
                this.emit('video:out', {y, data: BitSet.from(data)}));
        worker.on('end', ev => {
            this._info(`#cycles = ${ev.ncycles}`);
            this.emit('end', ev);
        });
        this.worker = worker;
    }
    
    send(input: string) {
        this.worker.postMessage({type: 'input', data: input});
    }

    stop() {
        this.worker.postMessage({type: 'terminate'}); 
    }

    _info(msg: string) {
        console.log(`%c[info] ${msg}`, 'color: blue');
    }
}


export { Emulation }