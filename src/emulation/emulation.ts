import assert from 'assert';
import { EventEmitter } from 'events';
import BitSet from '../infra/bitset';


class AsmInterpreter {
    code: AsmLine
    func: string
    pc: number
    r: number[]
    stack: number[]
    mem: Memory
    exit: boolean
    labels: Map<string, number>

    constructor(code: AsmLine[], func = '') {
        this.code = code
        this.func = func
        this.pc = 0
        this.r = []
        this.stack = []
        this.mem = new Map;
        this.exit = false
        this.labels = new Map([
            [func, 0],
            ['mem_peek', -2],
            ['mem_poke', -3],
            ...code.map((instr, i) => typeof instr === 'string' ? [instr, i] as [string, number] : undefined)
                    .filter(x => x)
        ]);
    }

    step() {
        if (this.pc < 0) { this.extern(-this.pc); return; }
        
        var instr = this.code[this.pc];
        if (typeof instr !== 'string') {  /* skip labels */
            var [op, arg] = instr;
            
            if (op != 'ALU' && typeof arg === 'string')
                arg = this.labels.get(arg)

            switch (op) {
            case 'PUSH': this.stack.push(arg); break;
            case 'DUP':  this.stack.push(this.stack.slice(-1 - arg)[0]); break;
            case 'POP':  this.r = this.pop(arg); break;
            case 'ALU':  this.stack.push(this.alu(arg)); break;
            case 'YANK': this.yank(...(arg as [number, number])); break;
            case 'JZ':
                if (this.r[0] == 0) { this.pc = arg; return; }
                break;
            case 'JMP':
                this.pc = arg; return;
            case 'RET':
                this.pc = this.r[0];
                if (arg) this.stack.push(this.r[1]);
                return;
            case 'HALT':
                this.exit = true; return;
            default:
                throw new Error(`unknown opcode: '${op}'`);
            }
        }
                
        this.pc++
    }

    pop(cnt = 1) {
        assert(cnt > 0);
        if (cnt > this.stack.length) throw new Error('stack underflow');
        return this.stack.splice(-cnt);
    }

    alu(op: string) {
        let r = this.r;
        switch (op) {
        case 'ADD': return (r[0] + r[1]) & 0xffff;
        case 'SUB': return (r[0] - r[1]) & 0xffff;
        case 'MUL': return (r[0] * r[1]) & 0xffff;
        case 'AND': return (r[0] & r[1]);
        case 'OR' : return (r[0] | r[1]);
        case 'NOT': return ~r[0] & 0xffff;
        case 'SHL': return (r[0] << r[1]) & 0xffff;
        case 'SHR': return (r[0] >> r[1]) & 0xffff;
        case 'LT': return (r[0] < r[1]) ? 1 : 0;
        default:
            throw new Error(`unknown alu opcode: '${op}'`);
        }
    }

    yank(take: number, drop: number) {
        assert(take > 0 && drop > 0);
        this.stack.splice(-(take + drop), drop);
    }

    extern(fcode: number) {
        var ret_addr: number, addr: number, value: number, ret = 0;
        switch (fcode) {
        case 1: this.exit = true; return;
        case 2:
            [ret_addr, addr] = this.pop(2);
            ret = this.mem.get(addr) ?? 0;
            break;
        case 3:  // mem_poke
            [ret_addr, value, addr] = this.pop(3);
            console.log('^^^^ mem_poke', addr, value);
            this.mem.set(addr, value);
            break;
        default:
            throw new Error(`unknown extern function code ${fcode}`);
        }
        this.stack.push(ret);
        this.pc = ret_addr;
    }
}

type Instruction = any
type Label = string
type AsmLine = Instruction | Label
type Memory = Map<number, number>


class DisplayAdapter extends EventEmitter {
    mem: Memory
    baseAddr = 0xa000
    height = 256

    constructor(mem: Memory) {
        super();
        this.mem = mem;
    }

    scan() {
        for (let y = 0; y < this.height; y++) {
            this.scanLine(y);
        }
    }

    scanLine(y: number) {
        this.emit('video:out', {y, data: this.getLine(y)});
    }

    getLine(y: number) {
        var arr = new Uint32Array(8), base = this.baseAddr + (y << 4);
        for (let xw = 0; xw < 8; xw++) {
            let ofs = base + (xw << 1);
            let [w0, w1] = [ofs, ofs+1].map(ofs => this.mem.get(ofs) ?? 0);
            arr[xw] = w0 | (w1 << 16);
        }
        return new BitSet(arr);
    }
}



export { AsmInterpreter, Instruction, Label, AsmLine, Memory, DisplayAdapter }