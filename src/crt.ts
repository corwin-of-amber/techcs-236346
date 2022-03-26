import BitSet from 'bitset';
import './crt.css';


class Crt {
    canvas: HTMLCanvasElement
    size: XY

    pixelData: BitSet[] = []
    dirtyY: Set<number> = new Set()
    _refreshInterval: number

    constructor(canvas: HTMLCanvasElement, size: XY = {x: 256, y: 256}) {
        this.canvas = canvas;
        this.size = size;
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
        this._refreshInterval = window.setInterval(() => this.refresh(), 1000 / fps);
        window.addEventListener('beforeunload', () => this.stop());
    }

    stop() {
        window.clearInterval(this._refreshInterval);
    }
}


type XY = {x: number, y: number}


export { Crt }