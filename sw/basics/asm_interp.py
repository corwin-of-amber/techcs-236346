
from array import array


class AsmInterp:
    def __init__(self):
        self.stack = []
        self.r0 = 0
        self.r1 = 0
        self.memory = array('H')  # unsigned 16-bit words
        self.labels = {}

    def execute_program(self, instructions):
        self._index_labels(instructions)
        ip = 0
        self.instructions = instructions

        while ip < len(instructions):
            instr = instructions[ip]
            if isinstance(instr, str):  # label
                ip += 1
                continue

            if isinstance(instr, tuple):
                assert len(instr) in [1, 2]
                op = instr[0].upper()
                arg = instr[1] if len(instr) > 1 else None

            if op == "JMP":
                ip = self._jump_to_label(arg)
                continue

            elif op == "JZ":
                if self.r0 == 0:
                    ip = self._jump_to_label(arg)
                    continue

            elif op == "JNZ":
                if self.r0 != 0:
                    ip = self._jump_to_label(arg)
                    continue

            elif op == "RET":
                flag = int(arg)
                if flag == 1:
                    self.stack.append(arg)
                ip = self.r0
                continue

            else:
                self.execute(op, arg)

            ip += 1

    def _index_labels(self, instructions):
        self.labels = {}
        for idx, line in enumerate(instructions):
            if isinstance(line, str):
                line = line.strip()
                if line.endswith(':'):
                    label = line[:-1]
                    self.labels[label] = idx + 1

    def _jump_to_label(self, label):
        if label not in self.labels:
            raise ValueError(f"Undefined label: {label}")
        return self.labels[label]

    def execute(self, op, arg):
        if op == "PUSH":
            value = int(arg) & 0xFFFF
            self.stack.append(value)

        elif op == "POP":
            n = arg or 1
            if len(self.stack) < n:
                raise RuntimeError("Stack underflow")
            if n == 1:
                self.r0 = self.stack.pop()
            elif n == 2:
                self.r1 = self.stack.pop()
                self.r0 = self.stack.pop()
            else:
                raise ValueError(f"invalid instruction {op} {n}")

        elif op == "DUP":
            n = arg or 0
            if len(self.stack) < n + 1:
                raise RuntimeError("Stack underflow")
            self.stack.append(self.stack[-1 - n])
        
        elif op == "ALU":
            self.alu(arg.upper())

        elif op == "LOAD":
            self.load()

        elif op == "STOR":
            self.store()

        else:
            raise ValueError(f"invalid instruction {op} {arg}")

    def alu(self, op):
        def mask(v): return v & 0xFFFF
        if op == "ADD": result = self.r0 + self.r1
        elif op == "SUB": result = self.r0 - self.r1
        elif op == "MUL": result = self.r0 * self.r1
        elif op == "NEG": result = -self.r0
        elif op == "AND": result = self.r0 & self.r1
        elif op == "OR":  result = self.r0 | self.r1
        elif op == "NOT": result = ~self.r0
        elif op == "SHL": result = self.r0 << 1
        elif op == "SHR": result = self.r0 >> 1
        elif op == "LT":  result = int(self.r0 < self.r1)
        else: raise ValueError(f"invalid instruction ALU {op}")
        self.stack.append(mask(result))

    def load(self):
        addr = self.r0
        self._ensure_memory_size(addr)
        self.stack.append(self.memory[addr])

    def store(self):
        addr = self.r1
        self._ensure_memory_size(addr)
        self.memory[addr] = self.r0 & 0xFFFF

    def _ensure_memory_size(self, addr):
        if addr >= len(self.memory):
            self.memory.extend([0] * (addr + 1 - len(self.memory)))

    def __str__(self):
        return (f"stack: {self.stack}\n"
                f"r0: {self.r0}, r1: {self.r1}\n"
                f"mem: {list(self.memory)}")
