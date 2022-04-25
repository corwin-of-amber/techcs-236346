from collections import namedtuple
import array
import instruction_set as isa


class Assembly(namedtuple('Assembly', ['words', 'start_addr', 'label_addrs'])):
    def to_bin(self):
        return array.array('I', self.words).tobytes()
    def save_bin(self, filename='a.bin'):
        with open(filename, 'wb') as f:
            f.write(self.to_bin())

class Label:
    def __init__(self, l): self.name = l


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
            else:
                yield instr
                addr += 1

    def warg(op, arg):
        if isinstance(op, str): op = isa.CODES[op]
        if isinstance(arg, Label): arg = labels[arg.name]
        elif isinstance(arg, str):
            arg = isa.CODES[arg] if op == isa.ALU else labels[arg]
        elif isinstance(arg, tuple):
            arg = (arg[1] << 4) | arg[0]
        return (arg << 4) | op
                
    def third_pass(l):
        for instr in l:
            if isinstance(instr, tuple):
                yield warg(*instr)
            else:
                yield instr
                
    l = list(second_pass(first_pass(l)))
    return Assembly(list(third_pass(l)), start_addr, labels)


def disasm(l):
    from instruction_set import MNEMONICS as M
    return [(M.get(instr & 0xf, '??'), instr >> 4) for instr in l]

def with_addr(l, start_addr=0):
    for i, el in enumerate(l):
        yield (start_addr + i, el)

def disasm_with_addr(l, start_addr=0):
    return with_addr(disasm(l), start_addr)

def disasm_pretty(l, start_addr=0):
    for addr, (op, arg) in disasm_with_addr(l, start_addr):
        print("%04x %s %x" % (addr, op, arg))


def chunk16(u32a):
    return [(u32 >> bi) & 0xffff for u32 in u32a for bi in [0, 16]]    
