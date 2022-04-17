import EventEmitter from 'events';
import { ChildProcess, spawn } from 'child_process';
import split2 from 'split2'; /* @kremlin.native */
import BitSet from './infra/bitset';


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

    async start(binFn: string = this.binFn, env: EnvOpts = this.env) {
        env = {...this.DEFAULT_OPTS, ...env};
        this.binFn = binFn;
        this.env = env;
        this.emit('start');
        this.log('phase', '-- simulation started --');
        await new Promise(r => setTimeout(r, 10));  /* spawn lag issue */
        this.process = spawn(this.exe, binFn ? [binFn] : [], {stdio: 'pipe', env});
        this.process.on('error', e => this.log('error', e.toString()));
        this.process.stdout.pipe(split2())
            .on('data', (ln: string) => this._processLine(ln));
        this.process.stderr.pipe(split2())
            .on('data', (ln: string) => this.log('error', ln));
        this.process.on('exit', (code, signal) => {
            if (code || signal) this.log('error', `simulation terminated (code=${code}, signal=${signal})`);
            this.log('phase', '-- simulation ended --');
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
                data: new BitSet(mo[2])
            });
        }
        if (ln.match(/^\[info\] /)) {
            this.log('info', ln);
        }
    }

    log(level: 'info' | 'error' | 'phase', message: string) {
        this.emit('log', {level, message});
        if (level === 'error')
            console.error(message);
        else
            console.log(`%c${message}`, {'phase': 'color: #f55'}[level] ?? 'color: blue');
    }
}

type EnvOpts = {MAX_CYCLES?: string, DEBUG_CPU?: string};


export { Simulation, EnvOpts }