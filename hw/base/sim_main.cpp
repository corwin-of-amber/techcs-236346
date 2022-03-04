#include <iostream>
#include <iomanip>
#include "Vtoplevel.h"
#include "verilated.h"


struct Word {
    uint32_t v;
    size_t nib;
    Word(uint32_t v) : v(v), nib(4) { }
    Word(uint32_t v, size_t nib): v(v), nib(nib) { }
};

std::ostream& operator<<(std::ostream& os, Word w) {
    return os << std::setfill('0') << std::setw(w.nib) << w.v;
}


void bit_line(std::ostream& os, uint32_t arr[], size_t n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < 32; j++) {
            os << ((arr[i] >> j) & 1);
        }
    }
}

void display_out(Vtoplevel *top) {
    if (top->clk == 0) {
        std::cout << Word(top->vid_y, 2) << "|";
        bit_line(std::cout, top->vid_out, 3);
        std::cout << std::endl;
    }
}


int main(int argc, char** argv, char** env) {
    VerilatedContext* contextp = new VerilatedContext;
    contextp->commandArgs(argc, argv);
    Vtoplevel* top = new Vtoplevel{contextp};

    std::cout << std::hex;

    top->clk = 0;
    for (int i = 0; i < 500; i++)
    {
        top->eval(); 

        if (top->clk == 0 && top->d_micro == 0 || top->d_instr == 0xf) {
            std::cout << Word(top->d_pc) << " " << Word(top->d_sp) << " " << Word(top->d_r0) << " " << Word(top->d_r1);
            uint32_t mem[] = { top->rd0,  top->rd1,  top->rd2,  top->rd3,
                               top->rd4,  top->rd5,  top->rd6,  top->rd7,
                               top->rd8,  top->rd9,  top->rd10, top->rd11,
                               top->rd12, top->rd13, top->rd14, top->rd15 };
            int j;
            for (j = 0; j < 8; j++)
                std::cout << " " << Word(mem[j], 8);
            std::cout << std::endl << Word(top->d_instr, 8) << std::setfill(' ') << std::setw(11) << "";
            for (; j < 16; j++)
                std::cout << " " << Word(mem[j], 8);
            std::cout << std::endl;
        }

        //display_out(top);

        top->clk = ~top->clk;

        if (top->d_instr == 0xf) break;
    }          

    int bar = 0;

    for (int i = 0; i < 64 && bar < 2; i++) {
        top->eval();
        if (top->clk == 0 && top->vid_y == 0) bar++;
        if (bar == 1) display_out(top);
        top->clk = ~top->clk;
    }

    delete top;
    delete contextp;
    return 0;
}
