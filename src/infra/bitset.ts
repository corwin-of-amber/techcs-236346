
/**
 * Sorry but the standard BitSet sucks
 */
class BitSet {
    data: Uint32Array
    length: number

    constructor(param: Uint32Array | string, length?: number) {
        if (typeof param === 'string') {
            this.data = new Uint32Array(Math.ceil(param.length / BitSet.WORDSIZE));
            this.length = length ?? param.length;
            for (let i = 0; i < this.length; i++) {
                this.set(i, param[i] == '1' ? 1 : 0);
            }
        }
        else {
            this.data = param;
            this.length = length ?? (this.data.length * BitSet.WORDSIZE);
        }
    }

    get(index: number) {
        if (index >= 0 && index < this.length) {
            return (this.data[index >> BitSet.LOG_WORDSIZE] >> (index & BitSet.MASK_WORDSIZE)) & 1;
        }
    }

    set(index: number, bit: 0 | 1) {
        let i = index >> BitSet.LOG_WORDSIZE, j = index & BitSet.MASK_WORDSIZE;
        if (bit) this.data[i] |= (1 << j);
        else     this.data[i] &= ~(1 << j);
    }

    toString() {
        return new Array(this.length).fill(0).map((_, i) => this.get(i)).join('');
    }

    static readonly WORDSIZE = 32
    static readonly LOG_WORDSIZE = 5
    static readonly MASK_WORDSIZE = BitSet.WORDSIZE - 1
}


export default BitSet