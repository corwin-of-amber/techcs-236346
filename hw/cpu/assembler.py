from collections import namedtuple
import array
import instruction_set as isa


class Assembly(namedtuple('Assembly', ['words', 'start_addr', 'label_addrs'])):

    def to_bin(self):
        assert _array_sanity()  # ensure that 'I' marks 32-bit words
        return array.array('I', self.words).tobytes()

    def save_bin(self, filename='a.bin'):
        with open(filename, 'wb') as f:
            f.write(self.to_bin())

    @classmethod
    def from_bin(cls, bin, start_addr=0x0):
        assert _array_sanity()  # ensure that 'I' marks 32-bit words
        a = array.array('I'); a.frombytes(bin)
        return cls(words=list(a), start_addr=start_addr, label_addrs={})

    @classmethod
    def load_bin(cls, filename, start_addr=0x0):
        with open(filename, 'rb') as f:
            return cls.from_bin(f.read())

class Label:
    def __init__(self, l):
        self.name = l[:-1] if l.endswith(':') else l

# these opcodes take a 16-bit arg
WIDE_ARG = [isa.PUSH, isa.JMP, isa.JZ, isa.JNZ]


def asm_bin(l, start_addr=0x0):
    return asm_ex(l, start_addr).to_bin()

def asm(l, start_addr=0x0):
    labels = {}
    
    def first_pass(l):
        for instr in l:
            if isinstance(instr, list):
                for i in first_pass(instr): yield i
            elif isinstance(instr, str):
                yield Label(instr)
            else:
                yield instr
                
    def second_pass(l):
        addr = start_addr
        for instr in l:
            if isinstance(instr, Label):
                labels[instr.name] = addr
            elif isinstance(instr, tuple):
                l = warg(*instr)
                addr += len(l)
                yield from l
            else:
                addr += 1
                yield instr

    def lookup(name):
        try: return labels[name]
        except: raise ValueError(f'label not found: `{name}`')
    
    def warg(op, arg=0):
        if isinstance(op, str): op = isa.CODES[op]
        if isinstance(arg, Label): arg = labels[arg.name]
        elif isinstance(arg, str):
            arg = isa.CODES[arg] if op == isa.ALU else Label(arg)
        elif isinstance(arg, tuple):
            arg = (arg[1] << 4) | arg[0]
        if op in WIDE_ARG:
            return [op, arg]
        else:
            return [(arg << 4) | op]

    def third_pass(l):
        for w in l:
            if isinstance(w, Label):
                yield lookup(w.name)
            else:
                yield w
                
    l = list(second_pass(first_pass(l)))
    return Assembly(list(third_pass(l)), start_addr, labels)


def disasm(l):
    from instruction_set import MNEMONICS as M
    if isinstance(l, bytes):
        assert _array_sanity()
        l = array.array('I', l)
    return [(M.get(instr & 0xf, '??'), instr >> 4) for instr in l]

def with_addr(l, start_addr=0):
    for i, el in enumerate(l):
        yield (start_addr + i, el)

def disasm_with_addr(l, start_addr=0):
    return with_addr(disasm(l), start_addr)

def disasm_pretty(l, start_addr=0):
    for addr, (op, arg) in disasm_with_addr(l, start_addr):
        print("%04x %s %x" % (addr, op, arg))


def _array_sanity():
    return array.array('I', [0xdead]).tobytes() == b'\xad\xde\x00\x00'

def chunk16(u32a):
    return [(u32 >> bi) & 0xffff for u32 in u32a for bi in [0, 16]]    
