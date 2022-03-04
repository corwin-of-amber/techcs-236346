import BitSet from 'bitset';
import './crt.css';


class Crt {
    canvas: HTMLCanvasElement
    size: XY

    constructor(canvas: HTMLCanvasElement, size: XY = {x: 256, y: 256}) {
        this.canvas = canvas;
        this.size = size;
    }

    drawLine(y: number, pixels: BitSet) {
        var ctx = this.canvas.getContext('2d');
        for (let x = 0; x < this.size.x; x++) {
            ctx.fillStyle = pixels.get(x) ? '#fff' : '#000';
            ctx.fillRect(x, y, 1, 1);
        }
    }
}


type XY = {x: number, y: number}


export { Crt }