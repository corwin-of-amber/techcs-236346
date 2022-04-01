import { Crt } from './crt';
import { Simulation } from './sim';
import { DeviceEmulator } from './device';
import { WorkerWithEvents } from './infra/worker-ipc';
import BitSet from './infra/bitset';


async function main() {
    var device = new DeviceEmulator(
        new Simulation("./ref/hw/cpu/bin/stack-machine"),
        new Crt(document.querySelector('#crt'))
    );

    var buttons = {
        start: document.querySelector('#toolbar [name=start]'),
        stop: document.querySelector('#toolbar [name=stop]')
    };
    device.sim.on('start', () => {
        buttons.start.setAttribute('disabled', '');
        buttons.stop.removeAttribute('disabled');
    });
    device.sim.on('end', () => {
        buttons.start.removeAttribute('disabled');
        buttons.stop.setAttribute('disabled', '');
    });
    buttons.start.addEventListener('click', () => device.start());
    buttons.stop.addEventListener('click', () => device.stop());

    device.start("ref/hw/cpu/blocks.bin");
    //asm_emu_main(device.crt);

    Object.assign(window, {device, buttons, BitSet});
}

function asm_emu_main(crt: Crt) {
    let worker = new WorkerWithEvents('worker.js');
    crt.start(25);
    worker.postMessage({type: 'start', ev: {asm: BLOCK_WAIT}});
    worker.on('video:out', ({y, data}) =>
        crt.setLine(y, BitSet.from(data)));
    worker.on('end', () => { crt.stop(); crt.refresh(); });
}

const BLOCK = ["block", ["DUP", 1], ["PUSH", 1], ["POP", 2], ["ALU", "AND"], ["POP", 1], ["JZ", "block:0"], ["PUSH", 65280], ["JMP", "block:1"], "block:0", ["PUSH", 255], "block:1", ["PUSH", "block:2"], ["PUSH", 40960], ["PUSH", 128], ["DUP", 4], ["POP", 2], ["ALU", "MUL"], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SHR"], ["POP", 2], ["ALU", "ADD"], ["PUSH", 16], ["PUSH", 8], ["DUP", 4], ["JMP", "memor_skip"], "block:2", ["YANK", [1, 1]], ["YANK", [1, 2]], ["POP", 2], ["RET", 1], "memor_skip", ["PUSH", 0], ["DUP", 2], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "memor_skip:0"], ["PUSH", "memor_skip:1"], ["DUP", 1], ["PUSH", "memor_skip:2"], ["DUP", 6], ["JMP", "mem_peek"], "memor_skip:2", ["POP", 2], ["ALU", "OR"], ["DUP", 5], ["JMP", "mem_poke"], "memor_skip:1", ["DUP", 4], ["DUP", 4], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SUB"], ["DUP", 4], ["YANK", [4, 5]], ["JMP", "memor_skip"], ["JMP", "memor_skip:3"], "memor_skip:0", ["PUSH", 0], "memor_skip:3", ["YANK", [1, 4]], ["POP", 2], ["RET", 1]];
const BLOCK_WAIT = ["main", ["PUSH", "main:0"], ["PUSH", 5], ["PUSH", 4], ["JMP", "block"], "main:0", ["POP", 1], ["PUSH", "main:1"], ["JMP", "wait"], "main:1", ["POP", 1], ["PUSH", "main:2"], ["PUSH", 6], ["PUSH", 4], ["JMP", "block"], "main:2", ["POP", 2], ["RET", 1], "block", ["DUP", 1], ["PUSH", 1], ["POP", 2], ["ALU", "AND"], ["POP", 1], ["JZ", "block:0"], ["PUSH", 65280], ["JMP", "block:1"], "block:0", ["PUSH", 255], "block:1", ["PUSH", "block:2"], ["PUSH", 40960], ["PUSH", 128], ["DUP", 4], ["POP", 2], ["ALU", "MUL"], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SHR"], ["POP", 2], ["ALU", "ADD"], ["PUSH", 16], ["PUSH", 8], ["DUP", 4], ["JMP", "memor_skip"], "block:2", ["YANK", [1, 1]], ["YANK", [1, 2]], ["POP", 2], ["RET", 1], "memor_skip", ["PUSH", 0], ["DUP", 2], ["POP", 2], ["ALU", "LT"], ["POP", 1], ["JZ", "memor_skip:0"], ["PUSH", "memor_skip:1"], ["DUP", 1], ["PUSH", "memor_skip:2"], ["DUP", 6], ["JMP", "mem_peek"], "memor_skip:2", ["POP", 2], ["ALU", "OR"], ["DUP", 5], ["JMP", "mem_poke"], "memor_skip:1", ["DUP", 4], ["DUP", 4], ["POP", 2], ["ALU", "ADD"], ["DUP", 4], ["DUP", 4], ["PUSH", 1], ["POP", 2], ["ALU", "SUB"], ["DUP", 4], ["YANK", [4, 5]], ["JMP", "memor_skip"], ["JMP", "memor_skip:3"], "memor_skip:0", ["PUSH", 0], "memor_skip:3", ["YANK", [1, 4]], ["POP", 2], ["RET", 1], "wait", ["PUSH", "wait:0"], ["PUSH", 49153], ["JMP", "mem_peek"], "wait:0", ["PUSH", "wait:1"], ["JMP", "wait_aux"], "wait:1", ["YANK", [1, 1]], ["POP", 2], ["RET", 1], "wait_aux", ["PUSH", "wait_aux:0"], ["PUSH", 49153], ["JMP", "mem_peek"], "wait_aux:0", ["DUP", 2], ["POP", 2], ["ALU", "SUB"], ["POP", 1], ["JZ", "wait_aux:1"], ["PUSH", "wait_aux:2"], ["PUSH", 49152], ["JMP", "mem_peek"], "wait_aux:2", ["JMP", "wait_aux:3"], "wait_aux:1", ["JMP", "wait_aux"], "wait_aux:3", ["POP", 2], ["RET", 1]];


console.log(document.currentScript);

document.addEventListener('DOMContentLoaded', main);