import { AsmInterpreter, DisplayAdapter } from "./emulation";


function main(startup: {asm: any}) {
    let interp = new AsmInterpreter(startup.asm, 'block'),
        disp = new DisplayAdapter(interp.mem);

    interp.stack.push(-1);
    disp.on('video:out', (ev) => postMessage({type: 'video:out', ev}));

    for (let i = 0; i < 1500 && !interp.exit; i++) {
        console.log(interp.pc, interp.code[interp.pc], interp.r, interp.stack);
        interp.step();
        if (i == 1000) { disp.scan(); interp.mem.set(0xc001, 1); }
    }

    disp.scan();
    postMessage({type: 'end'});
}


addEventListener('message', ({data: {type, ev}}) => {
    switch (type) {
        case 'start':  main(ev); break;
    }
});