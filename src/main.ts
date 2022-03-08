import { Crt } from './crt';
import { Simulation } from './sim';


async function main() {
    var crt = new Crt(document.querySelector('#crt'));
    crt.start(25);

    var sim = new Simulation("./hw/stack-machine/bin/stack-machine");
    /* Video */
    sim.on('video:out', ({y, data}) => crt.setLine(y, data));
    sim.on('end', () => { setTimeout(() => crt.refresh(), 20); crt.stop(); });
    /* Input */
    var ival = window.setInterval(() => sim.process.stdin.write('-'), 100);
    sim.on('env', () => window.clearInterval(ival));

    /* Engage! */
    await Promise.resolve();
    sim.start("hw/stack-machine/blocks.bin");
    console.log('%c-- simulation started --', 'color: #f55')
    sim.on('end', () => console.log('%c-- simulation ended --', 'color: #f55'));

    Object.assign(window, {sim, crt});
}

document.addEventListener('DOMContentLoaded', main);