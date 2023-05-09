from instruction_set import *

# Some shorthands
POP1 = (POP, 1)
POP2 = (POP, 2)

_ = AOP
ADD = [POP2, (ALU, _.ADD)]
SUB = [POP2, (ALU, _.SUB)]
SHL = [POP2, (ALU, _.SHL)]
LT  = [POP2, (ALU, _.LT)]


BLINK = [
    # Draw cursor
    *[[(PUSH, 0xff00), (PUSH, 0xa082 + 16 * i), POP2, STOR] for i in range(8)],
    # Wait 4 ticks (GPIO)
    (PUSH, 4),  # i
    'loop1',
    (PUSH, 0xc001), POP1, LOAD,    # c
    'wait1',
    DUP,
    (PUSH, 0xc001), POP1, LOAD,
    LT, POP1, (JZ, 'wait1'),
    POP1,                          # /c
    (PUSH, 1), SUB, DUP, POP1, (JNZ, 'loop1'),
    POP1,    # /i
    # Erase cursor
    *[[(PUSH, 0x0000), (PUSH, 0xa082 + 16 * i), POP2, STOR] for i in range(8)],
    # Wait 4 ticks (GPIO)
    (PUSH, 4),  # i
    'loop2',
    (PUSH, 0xc001), POP1, LOAD,    # c
    'wait2',
    DUP,
    (PUSH, 0xc001), POP1, LOAD,
    LT, POP1, (JZ, 'wait2'),
    POP1,                          # /c
    (PUSH, 1), SUB, DUP, POP1, (JNZ, 'loop2'),
    POP1,    # /i
    # Repeat forever
    (JMP, 0),
    HALT
]


BLOCKS = [
    ('PUSH', 0x0f),
    # while i > 0
    '_main_loop',
    (PUSH, 0), (DUP, 1), LT, POP1, (JZ, 'exit'),
    (PUSH, '_main_ret1'),
    (DUP,  1),     # x = i
    (PUSH, 0x03),  # y = 3
    (JMP, 'draw_block'),
    '_main_ret1',
    # i--
    (PUSH, 1), SUB,
    # wait(DELAY)
    (PUSH, '_main_ret2'),
    #(PUSH, DELAY),
    (JMP, 'wait'),
    '_main_ret2',
    (JMP, '_main_loop'),
    'exit',
    HALT,
    'draw_block',  # void func(x, y)
    (PUSH, '_draw_block_ret1'),
    # ofs = (y << 7) + x
    (DUP, 2), (DUP, 2), (PUSH, 7), SHL, ADD,
    # draw_block_lowlevel(0xa000 + ofs, 5)
    (PUSH, 0xa000), ADD,
    (PUSH, 0x8),
    (JMP, 'draw_block_lowlevel'),
    '_draw_block_ret1',
    POP2,
    POP1, RET,
    'draw_block_lowlevel',  # void func(addr, i)
    # while i > 0
    '_draw_block_lowlevel:loop',
    (PUSH, 0), (DUP, 1), LT, POP1, (JZ, '_draw_block_lowlevel:exit'),
    # mem[addr + (i << 4)] = 0xff
    DUP, (PUSH, 4), SHL, (DUP, 2), ADD,
    (PUSH, 0xff), (DUP, 1), POP2, STOR, POP1,
    # i--
    (PUSH, 1), SUB,
    (JMP, '_draw_block_lowlevel:loop'),
    '_draw_block_lowlevel:exit',
    POP2,     # - cleanup stack surplus
    POP1, RET,
    
    'wait',
    (PUSH, 0xc000), POP1, LOAD,
    '_wait:loop',
    (PUSH, 0xc000), POP1, LOAD, (DUP, 1), SUB, POP1, (JZ, '_wait:loop'),
    POP1,
    POP1, RET,

    'busy_wait',    # void func(cycles)
    # while cycles > 0
    '_busy_wait:loop',
    (PUSH, 0), (DUP, 1), LT, POP1, (JZ, '_busy_wait:exit'),
    # cycles--
    (PUSH, 1), SUB,
    (JMP, '_busy_wait:loop'),
    '_busy_wait:exit',
    POP1, POP1, RET,   
]