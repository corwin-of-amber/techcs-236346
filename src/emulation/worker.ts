import { EventEmitter } from 'events';
import { AsmInterpreter, DisplayAdapter } from "./emulation";


type StartupOptions = {asm: any} & Options;

type Options = {
    trace?: boolean
    maxCycles?: number
}

const DEFAULT_OPTS: Options = {maxCycles: 1e7};


async function main(startup: StartupOptions) {
    let interp = new AsmInterpreter(startup.asm, 'block'),
        disp = new DisplayAdapter(interp.mem),
        opts = {...DEFAULT_OPTS, ...startup};

    interp.stack.push(-1);
    disp.on('video:out', (ev) => postMessage({type: 'video:out', ev}));
    let c = 0;
    dispatch.on('input', () => { interp.mem.set(0xc001, ++c); })

    for (var i = 0; i < opts.maxCycles && !interp.exit; i++) {
        if (opts.trace)
            console.trace(interp.pc, interp.code[interp.pc], interp.r, interp.stack);
        interp.step();
        if ((i & 0x3fff) == 0) { disp.scan(); await _yield(); }
    }

    disp.scanForced();
    postMessage({type: 'end', ev: {ncycles: i}});
}

function _yield() { return new Promise(r => setTimeout(r, 0)); }


var dispatch = new EventEmitter;
dispatch.on('start', ev => main(ev));

addEventListener('message', ({data: {type, ev}}) => dispatch.emit(type, ev));



export { StartupOptions, Options }