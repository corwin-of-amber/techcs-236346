import EventEmitter from 'events';
import { ChildProcess, spawn } from 'child_process';
import split2 from 'split2'; /* @kremlin.native */
import BitSet from 'bitset';


const debug = require('debug')('Simulation');


class Simulation extends EventEmitter {
    exe: string
    process: ChildProcess
    binFn?: string
    env?: EnvOpts = {}

    DEFAULT_OPTS: EnvOpts = {MAX_CYCLES: '0', DEBUG_CPU: '0'}

    constructor(exe: string) {
        super();
        this.exe = exe;
    }

    start(binFn: string = this.binFn, env: EnvOpts = this.env) {
        env = {...this.DEFAULT_OPTS, ...env};
        this.binFn = binFn;
        this.env = env;
        this.emit('start');
        this.process = spawn(this.exe, binFn ? [binFn] : [], {stdio: 'pipe', env});
        this.process.stdout.pipe(split2())
            .on('data', (ln: string) => this._processLine(ln));
        this.process.stderr.pipe(split2())
            .on('data', (ln: string) => console.error(ln));
        this.process.on('exit', (code, signal) => {
            if (code || signal) console.error(`simulation terminated (code=${code}, signal=${signal})`);
            this.emit('end');
            this.process = undefined;
        });
        window.addEventListener('beforeunload', () => this.process.kill('SIGINT'));
    }

    stop() {
        this.process?.kill('SIGINT');
    }

    send(data: string) {
        this.process?.stdin?.write(data);
    }

    _processLine(ln: string) {
        debug(ln);
        var mo = ln.match(/^([0-9a-f]+)\|([01]+)$/i);
        if (mo) {
            this.emit('video:out', {
                y: parseInt(mo[1], 16), 
                data: new BitSet([...mo[2]].reverse().join(''))  /* BitSet is MSB-first */
            });
        }
        if (ln.match(/^\[info\] /)) {
            console.log(`%c${ln}`, 'color: blue');
        }
    }
}

type EnvOpts = {MAX_CYCLES?: string, DEBUG_CPU?: string};


export { Simulation }