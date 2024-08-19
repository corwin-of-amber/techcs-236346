import EventEmitter from 'events';
import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import split2 from 'split2'; /* @kremlin.native */
import BitSet from './infra/bitset';


const debug = require('debug')('Simulation');


class Simulation extends EventEmitter {
    exe: string
    process: ChildProcess
    binFn?: string
    runnerExe?: string[]   // set to `wsl.exe` when using WSL
    env?: EnvOpts = {}
    currentId = 0

    DEFAULT_OPTS: EnvOpts = {MAX_CYCLES: '0', DEBUG_CPU: '0'}

    constructor(exe: string, opts: SimulationOptions = {}) {
        super();
        this.exe = exe;
        if (opts.wsl ?? (process.platform === 'win32'))
            this.runnerExe = [String.raw`C:\Windows\System32\wsl.exe`];
    }

    async start(binFn: string = this.binFn, env: EnvOpts = this.env) {
        if (this.process) this.stop();

        env = {...this.DEFAULT_OPTS, ...env};
        this.binFn = binFn;
        this.env = env;
        var id = ++this.currentId;
        this.emit('start');
        this.log('phase', '-- simulation started --');
        await new Promise(r => setTimeout(r, 10));  /* spawn lag issue */
        var process = this._spawn(this.exe, binFn ? [binFn] : [], {stdio: 'pipe', env});
        process.on('error', e => this.log('error', e.toString()));
        process.stdout.pipe(split2())
            .on('data', (ln: string) => this._processLine(ln));
        process.stderr.pipe(split2())
            .on('data', (ln: string) => this.log('error', ln));
        process.on('exit', async (code, signal) => {
            if (id === this.currentId && (code || signal))
                this.log('error', `simulation terminated (code=${code}, signal=${signal})`);
            await when_stdout_done;
            if (id === this.currentId) {
                this.log('phase', '-- simulation ended --');
                this.process = undefined;
            }
            this.emit('end', {id});
        });
        var when_stdout_done = new Promise(r => process.stdout.on('end', r));
        window.addEventListener('beforeunload', () => process.kill('SIGINT'));
        this.process = process;
    }

    _spawn(exe: string, args: string[], opts: SpawnOptions) {
        if (this.runnerExe) {
            args = [...this.runnerExe.slice(1), exe, ...args];
            exe = this.runnerExe[0];
            if (opts.env) {
                /** @todo this is WSL-specific @@@ */
                opts.env['WSLENV'] ??= Object.keys(opts.env).join(':');
            }
        }
        return spawn(exe, args, opts);
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

type SimulationOptions = {wsl?: boolean};
type EnvOpts = {MAX_CYCLES?: string, DEBUG_CPU?: string, DEBUG_MEM?: string};


export { Simulation, EnvOpts }