HALT = 0b1111

PUSH = 0b1011
POP  = 0b1001
DUP  = 0b1100
YANK = 0b1010
STOR = 0b1101
LOAD = 0b1110

JMP  = 0b0111
JZ   = 0b0100
JNZ  = 0b0101
RET  = 0b0010

ALU  = 0b0000

MNEMONICS = {PUSH: 'PUSH', POP: 'POP', DUP: 'DUP', YANK: 'YANK', STOR: 'STOR', LOAD: 'LOAD',
             JMP: 'JMP', JZ: 'JZ', JNZ: 'JNZ', RET: 'RET', ALU: 'ALU', HALT: 'HALT'}

class AOP:
    ADD = 0b0001
    SUB = 0b0010
    MUL = 0b0011
    DIV = 0b0100   # - not implemented
    SHL = 0b0101
    SHR = 0b0110
    NEG = 0b0111
    AND = 0b1000
    OR  = 0b1001
    NOT = 0b1010
    LT  = 0b1100

    MNEMONICS = {ADD: 'ADD', SUB: 'SUB', MUL: 'MUL', DIV: 'DIV', SHL: 'SHL', SHR: 'SHR',
                 NEG: 'NEG', AND: 'AND', OR: 'OR', NOT: 'NOT', LT: 'LT'}


CODES = dict((v, k) for d in [MNEMONICS, AOP.MNEMONICS] for k, v in d.items())