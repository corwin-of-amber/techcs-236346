#include <iostream>
#include <iomanip>
#include <chrono>
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


class DisplayAdapter {

private:
    typedef std::vector<uint32_t> Row;
    std::vector<Row> memo;

    Vtoplevel *top;

public:
    DisplayAdapter(Vtoplevel *top): top(top) { }

    void bit_line(std::ostream& os, uint32_t arr[], size_t n) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < 32; j++) {
                os << ((arr[i] >> j) & 1);
            }
        }
    }

    bool vec_eq_arr(const Row& vec, uint32_t arr[], size_t n) {
        if (vec.size() != n) return false;
        for (int i = 0; i < n; i++) {
            if (vec[i] != arr[i]) return false;
        }
        return true;
    }

    bool is_dirty(uint16_t y, uint32_t arr[], size_t n) {
        if (y < memo.size()) {
            if (vec_eq_arr(memo[y], arr, n)) return false;
        }
        else memo.resize(y + 1);
        memo[y] = std::vector<uint32_t>(arr, arr + n);
        return true;
    }

    void out() {
        std::cout << Word(top->vid_y, 2) << "|";
        bit_line(std::cout, top->vid_out, WORDS_PER_ROW);
        std::cout << std::endl << std::flush;
    }

    void do_work() {
        if (top->clk == 0 && is_dirty(top->vid_y, top->vid_out, WORDS_PER_ROW)) {
            out();
        }
    }

    static const size_t WORDS_PER_ROW = 8;
};

struct process_input_data_t {
    Vtoplevel *top;
};

void *process_input(void *data) {
    Vtoplevel *top = ((process_input_data_t *)data)->top;

    while (!feof(stdin)) {
        char c = fgetc(stdin);
        top->gpio_in += (0x001 << 16);
    }
    return 0;
}


class Timer {
public:
    typedef std::chrono::time_point<std::chrono::high_resolution_clock> time_t;

private:
    time_t t_start;

public:
    Timer(): t_start(now()) { }

    double elapsed_millis() const {
        return std::chrono::duration<double, std::milli>(now() - t_start).count(); 
    }

    static time_t now() { return std::chrono::high_resolution_clock::now(); }
};


void dump_regs(Vtoplevel *top) {
    std::cout << Word(top->d_pc) << " " << Word(top->d_sp) << " " << Word(top->d_r0) << " " << Word(top->d_r1)
              << "  " << Word(top->d_instr, 8) << std::endl;
}

#ifdef NO_DEBUG_MEM
/* if memory debug regs are not available in simulation */
void dump_regs_mem(Vtoplevel *top) { dump_regs(top); }

#else

void dump_regs_mem(Vtoplevel *top) {
    std::cout << Word(top->d_pc) << " " << Word(top->d_sp) << " " << Word(top->d_r0) << " " << Word(top->d_r1);
    uint32_t mem[] = { top->rd0,  top->rd1,  top->rd2,  top->rd3,
                    top->rd4,  top->rd5,  top->rd6,  top->rd7,
                    top->rd8,  top->rd9,  top->rd10, top->rd11,
                    top->rd12, top->rd13, top->rd14, top->rd15 };
    int j, sp = top->d_sp;
    for (j = 0; j < 8; j++)
        std::cout << (j == sp ? "]" : " ") << Word(mem[j], 4);
    std::cout << std::endl << Word(top->d_instr, 8) << std::setfill(' ') << std::setw(11) << "";
    for (; j < 16; j++)
        std::cout << (j == sp ? "]" : " ") << Word(mem[j], 4);
    std::cout << std::endl;
}
#endif


int main(int argc, char** argv, char** env) {

    const char *bin_filename = argc > 1 ? argv[1] : "blocks.bin";
    const char *env_debug_cpu = getenv("DEBUG_CPU");
    const char *env_debug_mem = getenv("DEBUG_MEM");
    const char *env_out_display = getenv("OUT_DISPLAY");
    const char *env_max_cycles = getenv("MAX_CYCLES");
    bool debug_cpu = env_debug_cpu ? atoi(env_debug_cpu) : true;
    bool debug_mem = env_debug_mem ? atoi(env_debug_mem) : true;
    bool out_display = env_out_display ? atoi(env_out_display) : true;
    size_t max_cycles = env_max_cycles ? atoi(env_max_cycles) : 64000;

    if (max_cycles == 0) max_cycles = (size_t)-1;

    VerilatedContext* contextp = new VerilatedContext;
    contextp->commandArgs(argc, argv);
    Vtoplevel* top = new Vtoplevel{contextp};

    std::cout << std::hex;

    uint16_t gpio_sync = 0, gpio_data = 0;
    bool gpio_upload_finished = false;
    top->gpio_in = (gpio_sync << 16) | gpio_data;
    
    pthread_t process_input_thread;
    process_input_data_t process_input_data = { top };
    pthread_create(&process_input_thread, NULL, process_input, &process_input_data);

    uint16_t display_throttle = 0;

    FILE *bin = fopen(bin_filename, "r");
    if (bin == 0) { perror("fopen"); exit(1); }
    
    DisplayAdapter display(top);

    Timer timer;

    size_t i;
    top->clk = 0;
    for (i = 0; i < max_cycles * 2; i++)
    {
        top->eval(); 

        if (debug_cpu) {
            if (top->clk == 0 && top->d_micro == 1 || top->d_instr == 0xf) {
                if (debug_mem) dump_regs_mem(top);
                else dump_regs(top);
            }
        }

        top->clk = ~top->clk;

        if (!gpio_upload_finished) {
            if (((top->gpio_out >> 16) & 0xffff) == gpio_sync) {
                std::cout << "gpio_out sync=" << gpio_sync << std::endl;

                gpio_sync++;
                if (fread(&gpio_data, sizeof(gpio_data), 1, bin) < 1) {
                    if (feof(bin)) { gpio_data = 0xffff; gpio_upload_finished = true; }
                    else { perror("fread"); exit(1); }
                }
                top->gpio_in = (gpio_sync << 16) | gpio_data;
            }
        }
        else {
            if (out_display) display.do_work();
        }

        if (top->d_instr == 0xf) break;
    }

    auto wall_ms = timer.elapsed_millis();
    std::cout << std::dec
              << "[info] Simulation time: " << wall_ms << "ms" << std::endl
              << "[info] # cycles: " << i / 2 << std::endl
              << "[info] " << i / wall_ms / 2000 << "MHz" << std::endl
              << std::hex;

    /* Flush the display */
    if (out_display) {
        int bar = 0;

        for (int i = 0; i < 1024 && bar < 2; i++) {
            top->eval();
            if (top->clk == 0) {
                if (top->vid_y == 0) bar++;
                if (bar == 1) display.out();
            }
            top->clk = ~top->clk;
        }
    }

    delete top;
    delete contextp;
    return 0;
}
