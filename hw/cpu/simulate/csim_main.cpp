#include <iostream>
#include <iomanip>
#include <chrono>
#include <vector>
#include <stdint.h>
#include "csim.h"



struct Word {
    uint32_t v;
    size_t nib;
    Word(uint32_t v) : v(v), nib(4) { }
    Word(uint32_t v, size_t nib): v(v), nib(nib) { }
};

std::ostream& operator<<(std::ostream& os, Word w) {
    return os << std::hex << std::setfill('0') << std::setw(w.nib) << w.v;
}


class CPU {
    
public:
    struct input_t inputs;
    struct output_t outputs;
    
    void step();
    void dump_regs() const;
    
    bool is_halted() const;
};

void CPU::step() {
    sim_run_all(1, (uint64_t*)&inputs, (uint64_t*)&outputs);
}

bool CPU::is_halted() const {
#ifdef _has_signal_out_d_instr
    return (outputs.d_instr & 0xf) == 0xf;
#else
    return false;
#endif
}

void CPU::dump_regs() const {
#if defined(_has_signal_out_d_pc) || defined(_has_signal_out_d_sp) || \
    defined(_has_signal_out_d_r0) && defined(_has_signal_out_d_r1) || \
    defined(_has_signal_out_d_instr)
    auto& o = outputs;
    std::cout 
#ifdef _has_signal_out_d_pc
        << Word(o.d_pc) << " "
#endif
#ifdef _has_signal_out_d_sp
        << Word(o.d_sp) << " " 
#endif
#if defined(_has_signal_out_d_r0) && defined(_has_signal_out_d_r1)
        << Word(o.d_r0) << " " << Word(o.d_r1)
#endif
#ifdef _has_signal_out_d_instr
        << "  " << Word(o.d_instr, 8) 
#endif
        << std::endl;
#endif
}


class GPIO {
    
public:
    GPIO(input_t& in_pins, const output_t& out_pins)
        : in_pins(in_pins), out_pins(out_pins)
    { }

    uint16_t serial_get_seq() const;
    void serial_send(uint16_t data, uint16_t seq);
    void serial_send(uint16_t data);
    
private:
    input_t& in_pins;
    const output_t& out_pins;
};

uint16_t GPIO::serial_get_seq() const {
#ifdef _has_signal_out_gpio_out
    return (out_pins.gpio_out >> 16) & 0xffff;
#else
    return 0xbeef;
#endif
}

void GPIO::serial_send(uint16_t data, uint16_t seq) {
#ifdef _has_signal_in_gpio_in
    in_pins.gpio_in = (uint32_t(seq) << 16) | data;
#endif
}

void GPIO::serial_send(uint16_t data) {
#ifdef _has_signal_in_gpio_in
    serial_send(data, (in_pins.gpio_in >> 16) + 1);
#endif
}


class GPIOBinUpload {
    
public:
    GPIOBinUpload(GPIO& gpio, const char *bin_filename);
        
    void tick();
    bool is_finished() const { return _is_finished; }
    
private:
    GPIO& gpio;
    FILE *bin;
    uint16_t next_seq;
    bool _is_finished;
};


GPIOBinUpload::GPIOBinUpload(GPIO& gpio, const char *bin_filename)
    : gpio(gpio), next_seq(0), _is_finished(false)
{
    bin = fopen(bin_filename, "rb");
    if (bin == 0) { perror("fopen"); fprintf(stderr, "  (%s)\n", bin_filename); exit(1); }
}

void GPIOBinUpload::tick() {
    if (gpio.serial_get_seq() == next_seq) {
        std::cout << "gpio_out sync=" << next_seq << std::endl;
        next_seq++;
        
        uint16_t next_data;
        if (fread(&next_data, sizeof(next_data), 1, bin) < 1) {
            if (feof(bin)) { next_data = 0xffff; _is_finished = true; }
            else { perror("fread"); exit(1); }
        }
        gpio.serial_send(next_data, next_seq);
    }
}    


class DisplayAdapter {

private:
    typedef std::vector<uint64_t> Row;
    std::vector<Row> memo;

    output_t& out_pins;

public:
    DisplayAdapter(output_t& out_pins): out_pins(out_pins) { }

    void bit_line(std::ostream& os, uint64_t arr[], size_t n) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < 64; j++) {
                os << ((arr[i] >> j) & 1);
            }
        }
    }

    bool vec_eq_arr(const Row& vec, uint64_t arr[], size_t n) {
        if (vec.size() != n) return false;
        for (int i = 0; i < n; i++) {
            if (vec[i] != arr[i]) return false;
        }
        return true;
    }

    bool is_dirty(uint16_t y, uint64_t arr[], size_t n) {
        if (y < memo.size()) {
            if (vec_eq_arr(memo[y], arr, n)) return false;
        }
        else memo.resize(y + 1);
        memo[y] = std::vector<uint64_t>(arr, arr + n);
        return true;
    }

#if defined(_has_signal_out_vid_out) && defined(_has_signal_out_vid_y)
    void out() {
        std::cout << Word(out_pins.vid_y, 2) << "|";
        bit_line(std::cout, out_pins.vid_out, WORDS_PER_ROW);
        std::cout << std::endl << std::flush;
    }

    void tick() {
        if (is_dirty(out_pins.vid_y, out_pins.vid_out, WORDS_PER_ROW)) {
            out();
        }
    }
#else
    void out() { }
    void tick() { }
#endif

    static const size_t WORDS_PER_ROW = 4;
};


class GPIOInput {

public:
    GPIOInput(GPIO& gpio): gpio(gpio) { }
    
    void start_thread() {
        pthread_create(&worker_tid, NULL, thread_main, this);
    }
    
protected:
    void process_input() {
        while (!feof(stdin)) {
            char c = fgetc(stdin);
            gpio.serial_send(c);
        }
    }
    
private:
    GPIO& gpio;
    pthread_t worker_tid;
    
    static void *thread_main(void *self);
};

void *GPIOInput::thread_main(void *data) {
    ((GPIOInput*)data)->process_input();
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



int main(int argc, char *argv[]) {
    const char *bin_filename = argc > 1 ? argv[1] : NULL;
    const char *env_debug_cpu = getenv("DEBUG_CPU");
    const char *env_debug_mem = getenv("DEBUG_MEM");
    const char *env_out_display = getenv("OUT_DISPLAY");
    const char *env_max_cycles = getenv("MAX_CYCLES");
    bool debug_cpu = env_debug_cpu ? atoi(env_debug_cpu) : true;
    bool debug_mem = env_debug_mem ? atoi(env_debug_mem) : true;
    bool out_display = env_out_display ? atoi(env_out_display) : true;
    size_t max_cycles = env_max_cycles ? atoi(env_max_cycles) : 64000;

    if (max_cycles == 0) max_cycles = (size_t)-1;

    initialize_mems();
    
    CPU cpu;
    GPIO gpio(cpu.inputs, cpu.outputs);
    GPIOBinUpload *gpio_upload =
        bin_filename ? new GPIOBinUpload(gpio, bin_filename) : NULL;
    GPIOInput gpio_input(gpio);
    gpio_input.start_thread();
    
    DisplayAdapter display(cpu.outputs);
    
    Timer wall;
    size_t cyc;
    
    for (cyc = 0; cyc < max_cycles && !cpu.is_halted(); cyc++) {
        cpu.step();
        if (debug_cpu) {
            cpu.dump_regs();
            /* @todo debug mem */
        }
        if (gpio_upload && !gpio_upload->is_finished()) {
            gpio_upload->tick();
            if (gpio_upload->is_finished()) {
                std::cout << std::dec
                    << "[info] Loaded executable binary: " << wall.elapsed_millis() << "ms" << std::endl;
            }
        }
        display.tick();
    }
    
    auto wall_ms = wall.elapsed_millis();
    std::cout << std::dec
              << "[info] Simulation time: " << wall_ms << "ms" << std::endl
              << "[info] # cycles: " << cyc << std::endl
              << "[info] " << cyc / wall_ms / 1000 << "MHz" << std::endl
              << std::hex;
    
    /* Flush the display */
#if defined(_has_signal_out_vid_out) && defined(_has_signal_out_vid_y)
    if (out_display) {
        int bar = 0;

        for (int i = 0; i < 1024 && bar < 2; i++) {
            cpu.step();
            if (cpu.outputs.vid_y == 0) bar++;
            if (bar == 1) display.out();
        }
    }
#endif
    
    return 0;
}

