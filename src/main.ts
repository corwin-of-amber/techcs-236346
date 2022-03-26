import { Crt } from './crt';
import { Simulation } from './sim';
import { DeviceEmulator } from './device';


async function main() {
    var device = new DeviceEmulator(
        new Simulation("./hw/stack-machine/bin/stack-machine"),
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

    device.start();

    Object.assign(window, {device, buttons});
}


document.addEventListener('DOMContentLoaded', main);