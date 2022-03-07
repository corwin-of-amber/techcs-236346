import EventEmitter from 'events';
import { ChildProcess, spawn } from 'child_process';
import split2 from 'split2'; /* @kremlin.native */
import BitSet from 'bitset';


class Simulation extends EventEmitter {
    exe: string
    process: ChildProcess

    constructor(exe: string) {
        super();
        this.exe = exe;
    }

    start() {
        this.process = spawn(this.exe, {stdio: 'pipe'});
        this.process.stdout.pipe(split2())
            .on('data', (ln: string) => this._processLine(ln));
    }

    _processLine(ln: string) {
        var mo = ln.match(/^([0-9a-f]+)\|([01]+)$/i);
        if (mo) {
            this.emit('video:out', {
                y: parseInt(mo[1], 16), 
                data: new BitSet([...mo[2]].reverse().join(''))  /* BitSet is MSB-first */
            });
        }
    }
}


export { Simulation }