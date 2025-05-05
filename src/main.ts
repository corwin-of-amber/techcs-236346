import Vue from 'vue';
import { Crt } from './crt';
import { Simulation } from './sim';
import { DeviceEmulator } from './device';
import { Assembler } from './emulation/assembler';
import { CompilerBackend } from './ide/compiler';
import { Emulation } from './emulation';
import BitSet from './infra/bitset';
// @ts-ignore
import App_ from './components/main.vue';
import type { App } from './components/main';
import './ide.css';



const STARTUP_SETTINGS = {
    "mode": "csim",
    "csim": "hw/cpu/bin/csim",
    "bin": "hw/cpu/blocks.bin",
    "env": {
        "DEBUG_CPU": 0,
        "MAX_CYCLES": 1000
    }
};


function withProps<T>() { return <S>(s: S) => s as S & T; }

async function main() {
    var app = withProps<App>()(Vue.createApp(App_, {onRun})
                .mount(document.body));
    
    // This is a dummy device; should probably eliminate
    var device = new DeviceEmulator(
        new Simulation("dummy"),
        new Crt((<any>app.$refs).crt)
    );

    app.ready = false;
    app.device = device;
    /*
    device.sim.on('start', () => app.started = true);
    device.sim.on('end', () => app.started = false);

    app.device.sim.on('log', ({level, message}) => app.log(level, message));
    */

    function onRun() {
        try {
            start(app);
        }
        catch (e) { app.log('error', e.toString()); }
    }

    document.body.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
            onRun();
            ev.preventDefault();
            ev.stopPropagation();
        }
    }, {capture: true});

    //device.start("ref/hw/cpu/blocks.bin");
    //

    var settings = STARTUP_SETTINGS;
    await app.open('settings.json', JSON.stringify(settings, null, 2), {at: 'start'});

    await app.open('prog.asm', '');

    //var progAsm = await (await fetch('/ref/sw/compiler/simple-progs.asm')).text(),
    //    progIr = await (await fetch('/ref/sw/compiler/simple-progs.ir')).text();
    //await app.open('prog.asm', progAsm);
    //await app.open('prog.ir', progIr, {focus: true});
    //compileAndRun(app);

    window.addEventListener('beforeunload', () => app.persist());

    Object.assign(window, {device, app, BitSet});
}

function start(app: App) {
    var fn = app.currentTab() ?? '';
    if (fn.endsWith('.json')) {  /* simulation settings file */
        runCSimulation(app, fn);
    }
    else if (fn.endsWith('.asm')) {  /* StASM file */
        /** @todo test this */
        assembleAndRun(app, fn);
    }
    else if (fn.endsWith('.ir')) {  /* StaML IR file */
        /** @todo test this */
        compileAndRun(app, fn);
    }
}

function runCSimulation(app: App, fn?: string) {
    app.clearLog();
    var settings = parseSettings(app.getSource(fn)),
        sim = new Simulation(settings.csim, {wsl: settings.wsl});

    app.ready = true;
    app.device = attachDevice(app, new DeviceEmulator(sim, app.device.crt));
    app.device.start(settings.bin, settings.env);
}

function parseSettings(settings: string) {
    // strip comments
    settings = settings.replace(/\/\/.*/g, '');
    return JSON.parse(settings);
}

async function compileAndRun(app: App, prog?: string) {
    var comp = new CompilerBackend(),
        asm = new Assembler();

    app.ready = false;
    app.log(`Compiling ${prog ?? app.currentTab()}`)
    await new Promise(resolve => setTimeout(resolve, 25)); // some `child_process` silliness

    try {
        var s = await comp.compile(app.getSource(prog));
        app.log(`Compiled prog.asm`)
    }
    finally { app.ready = !!app.device; }
    app.open('prog.asm', s);
    
    run(app, [...asm.parseText(s)]);
}

async function assembleAndRun(app: App, prog?: string) {
    var asm = new Assembler();

    app.ready = false;
    app.log(`Assembling ${prog ?? app.currentTab()}`);
    try {
        var s = [...asm.parseText(app.getSource(prog))];
    }
    finally { app.ready = !!app.device; }

    run(app, s);
}

function run(app: App, asm: any) {
    app.clearLog();
    let emul = new Emulation();

    app.ready = true;
    app.device = attachDevice(app, new DeviceEmulator(emul, app.device.crt));
    app.device.start(asm);
}

function attachDevice(app: App, device: DeviceEmulator) {
    device.sim.on('start', () => app.started = true);
    device.sim.on('end', () => app.started = false);
    device.sim.on('log', ({level, message}) => app.log(level, message));
    return device;
}

const BLOCK = ["block", ["DUP", 1], ["PUSH", 1], ["POP", 2], ["ALU", "AND"], ["POP", 1], ["JZ", "block:0"], ["PUSH", 65280], ["JMP", "block:1"], "block:0", ["PUSH", 255], "block:1", ["PUSH", "block:2"], ["PUSH", 40960], ["PUSH", 128], ["DUP", 4], ["POP", 2], ["ALU", "MUL"], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SHR"], ["POP", 2], ["ALU", "ADD"], ["PUSH", 16], ["PUSH", 8], ["DUP", 4], ["JMP", "memor_skip"], "block:2", ["YANK", [1, 1]], ["YANK", [1, 2]], ["POP", 2], ["RET", 1], "memor_skip", ["PUSH", 0], ["DUP", 2], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "memor_skip:0"], ["PUSH", "memor_skip:1"], ["DUP", 1], ["PUSH", "memor_skip:2"], ["DUP", 6], ["JMP", "mem_peek"], "memor_skip:2", ["POP", 2], ["ALU", "OR"], ["DUP", 5], ["JMP", "mem_poke"], "memor_skip:1", ["DUP", 4], ["DUP", 4], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SUB"], ["DUP", 4], ["YANK", [4, 5]], ["JMP", "memor_skip"], ["JMP", "memor_skip:3"], "memor_skip:0", ["PUSH", 0], "memor_skip:3", ["YANK", [1, 4]], ["POP", 2], ["RET", 1]];
const BLOCK_WAIT = ["main", ["PUSH", "main:0"], ["PUSH", 5], ["PUSH", 4], ["JMP", "block"], "main:0", ["POP", 1], ["PUSH", "main:1"], ["JMP", "wait"], "main:1", ["POP", 1], ["PUSH", "main:2"], ["PUSH", 6], ["PUSH", 4], ["JMP", "block"], "main:2", ["POP", 2], ["RET", 1], "block", ["DUP", 1], ["PUSH", 1], ["POP", 2], ["ALU", "AND"], ["POP", 1], ["JZ", "block:0"], ["PUSH", 65280], ["JMP", "block:1"], "block:0", ["PUSH", 255], "block:1", ["PUSH", "block:2"], ["PUSH", 40960], ["PUSH", 128], ["DUP", 4], ["POP", 2], ["ALU", "MUL"], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SHR"], ["POP", 2], ["ALU", "ADD"], ["PUSH", 16], ["PUSH", 8], ["DUP", 4], ["JMP", "memor_skip"], "block:2", ["YANK", [1, 1]], ["YANK", [1, 2]], ["POP", 2], ["RET", 1], "memor_skip", ["PUSH", 0], ["DUP", 2], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "memor_skip:0"], ["PUSH", "memor_skip:1"], ["DUP", 1], ["PUSH", "memor_skip:2"], ["DUP", 6], ["JMP", "mem_peek"], "memor_skip:2", ["POP", 2], ["ALU", "OR"], ["DUP", 5], ["JMP", "mem_poke"], "memor_skip:1", ["DUP", 4], ["DUP", 4], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SUB"], ["DUP", 4], ["YANK", [4, 5]], ["JMP", "memor_skip"], ["JMP", "memor_skip:3"], "memor_skip:0", ["PUSH", 0], "memor_skip:3", ["YANK", [1, 4]], ["POP", 2], ["RET", 1], "wait", ["PUSH", "wait:0"], ["PUSH", 49153], ["JMP", "mem_peek"], "wait:0", ["PUSH", "wait:1"], ["JMP", "wait_aux"], "wait:1", ["YANK", [1, 1]], ["POP", 2], ["RET", 1], "wait_aux", ["PUSH", "wait_aux:0"], ["PUSH", 49153], ["JMP", "mem_peek"], "wait_aux:0", ["DUP", 2], ["POP", 2], ["ALU", "SUB"], ["POP", 1], ["JZ", "wait_aux:1"], ["PUSH", "wait_aux:2"], ["PUSH", 49152], ["JMP", "mem_peek"], "wait_aux:2", ["JMP", "wait_aux:3"], "wait_aux:1", ["JMP", "wait_aux"], "wait_aux:3", ["POP", 2], ["RET", 1]];
const SQUARE = ["main", ["PUSH", "main:0"], ["PUSH", 11], ["PUSH", 21], ["PUSH", 11], ["JMP", "horiz"], "main:0", ["POP", 1], ["PUSH", "main:1"], ["PUSH", 20], ["PUSH", 12], ["PUSH", 21], ["JMP", "vert"], "main:1", ["POP", 1], ["PUSH", "main:2"], ["PUSH", 19], ["PUSH", 11], ["PUSH", 20], ["JMP", "horiz"], "main:2", ["POP", 1], ["PUSH", "main:3"], ["PUSH", 11], ["PUSH", 20], ["PUSH", 11], ["JMP", "vert"], "main:3", ["POP", 1], ["PUSH", 0], ["POP", 2], ["RET", 1], "block", ["DUP", 1], ["PUSH", 1], ["POP", 2], ["ALU", "AND"], ["POP", 1], ["JZ", "block:0"], ["PUSH", 65280], ["JMP", "block:1"], "block:0", ["PUSH", 255], "block:1", ["PUSH", "block:2"], ["PUSH", 40960], ["PUSH", 128], ["DUP", 4], ["POP", 2], ["ALU", "MUL"], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SHR"], ["POP", 2], ["ALU", "ADD"], ["PUSH", 16], ["PUSH", 8], ["DUP", 4], ["JMP", "memor_skip"], "block:2", ["YANK", [1, 1]], ["YANK", [1, 2]], ["POP", 2], ["RET", 1], "memor_skip", ["PUSH", 0], ["DUP", 2], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "memor_skip:0"], ["PUSH", "memor_skip:1"], ["DUP", 1], ["PUSH", "memor_skip:2"], ["DUP", 6], ["JMP", "mem_peek"], "memor_skip:2", ["POP", 2], ["ALU", "OR"], ["DUP", 5], ["JMP", "mem_poke"], "memor_skip:1", ["DUP", 4], ["DUP", 4], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SUB"], ["DUP", 4], ["YANK", [4, 5]], ["JMP", "memor_skip"], ["JMP", "memor_skip:3"], "memor_skip:0", ["PUSH", 0], "memor_skip:3", ["YANK", [1, 4]], ["POP", 2], ["RET", 1], "wait", ["PUSH", "wait:0"], ["PUSH", 49153], ["JMP", "mem_peek"], "wait:0", ["PUSH", "wait:1"], ["JMP", "wait_aux"], "wait:1", ["YANK", [1, 1]], ["POP", 2], ["RET", 1], "wait_aux", ["PUSH", "wait_aux:0"], ["PUSH", 49153], ["JMP", "mem_peek"], "wait_aux:0", ["DUP", 2], ["POP", 2], ["ALU", "SUB"], ["POP", 1], ["JZ", "wait_aux:1"], ["PUSH", "wait_aux:2"], ["PUSH", 49152], ["JMP", "mem_peek"], "wait_aux:2", ["JMP", "wait_aux:3"], "wait_aux:1", ["JMP", "wait_aux"], "wait_aux:3", ["POP", 2], ["RET", 1], "horiz", ["DUP", 2], ["DUP", 2], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "horiz:0"], ["PUSH", 1], ["JMP", "horiz:1"], "horiz:0", ["DUP", 1], ["DUP", 3], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "horiz:2"], ["PUSH", 65535], ["JMP", "horiz:3"], "horiz:2", ["PUSH", 0], "horiz:3", "horiz:1", ["DUP", 0], ["POP", 1], ["JZ", "horiz:4"], ["PUSH", "horiz:5"], ["DUP", 4], ["DUP", 3], ["JMP", "block"], "horiz:5", ["POP", 1], ["PUSH", "horiz:6"], ["JMP", "wait"], "horiz:6", ["POP", 1], ["DUP", 3], ["DUP", 1], ["POP", 2], ["ALU", "ADD"], ["DUP", 3], ["DUP", 3], ["YANK", [3, 4]], ["JMP", "horiz"], ["JMP", "horiz:7"], "horiz:4", ["PUSH", 0], "horiz:7", ["YANK", [1, 1]], ["YANK", [1, 3]], ["POP", 2], ["RET", 1], "vert", ["DUP", 1], ["DUP", 1], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "vert:0"], ["PUSH", 1], ["JMP", "vert:1"], "vert:0", ["DUP", 0], ["DUP", 2], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "vert:2"], ["PUSH", 65535], ["JMP", "vert:3"], "vert:2", ["PUSH", 0], "vert:3", "vert:1", ["DUP", 0], ["POP", 1], ["JZ", "vert:4"], ["PUSH", "vert:5"], ["DUP", 4], ["DUP", 4], ["JMP", "block"], "vert:5", ["POP", 1], ["PUSH", "vert:6"], ["JMP", "wait"], "vert:6", ["POP", 1], ["DUP", 3], ["DUP", 3], ["DUP", 2], ["POP", 2], ["ALU", "ADD"], ["DUP", 3], ["YANK", [3, 4]], ["JMP", "vert"], ["JMP", "vert:7"], "vert:4", ["PUSH", 0], "vert:7", ["YANK", [1, 1]], ["YANK", [1, 3]], ["POP", 2], ["RET", 1]]


document.addEventListener('DOMContentLoaded', main);