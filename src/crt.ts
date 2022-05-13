import BitSet from './infra/bitset';
import { Timer } from './device';
import './crt.css';


class Crt {
    canvas: HTMLCanvasElement
    size: XY

    pixelData: BitSet[] = []
    dirtyY: Set<number> = new Set()
    timer: Timer

    constructor(canvas: HTMLCanvasElement, size: XY = {x: 256, y: 256}) {
        this.canvas = canvas;
        this.size = size;
        this.timer = new Timer();
        this.timer.on('tick', () => this.refresh());
    }

    clear() {
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);        
    }

    setLine(y: number, pixels: BitSet) {
        this.pixelData[y] = pixels;
        this.dirtyY.add(y);
    }

    refresh() {
        var ctx = this.canvas.getContext('2d');
        for (let y of this.dirtyY) {
            let line = this.pixelData[y];
            for (let x = 0; x < this.size.x; x++) {
                ctx.fillStyle = line.get(x) ? '#fff' : '#000';
                ctx.fillRect(x, y, 1, 1);
            }
        }
        this.dirtyY.clear();
    }

    start(fps=50) {
        this.timer.start(1000 / fps);
    }

    stop() {
        this.timer.stop();
    }
}


type XY = {x: number, y: number}


export { Crt }