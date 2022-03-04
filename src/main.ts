import { Crt } from './crt';
import { Simulation } from './sim';


function main() {
    var crt = new Crt(document.querySelector('#crt'));



    var sim = new Simulation("./hw/stack-machine/bin/stack-machine");
    sim.start();
    sim.on('video:out', ({y, data}) => crt.drawLine(y, data));
}

document.addEventListener('DOMContentLoaded', main);