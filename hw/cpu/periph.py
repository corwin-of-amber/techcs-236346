from pyrtl import Register, Output, concat, as_wires


# Video adapter
VIDEO_BASE = 0xa000

def video_adapter(mem, base_addr=VIDEO_BASE):
    scan = Register(bitwidth=8, name="vid_scan")
    vy = Output(bitwidth=8, name="vid_y")
    out = Output(bitwidth=256, name="vid_out")
    scan.next <<= scan + 1  # wraps around
    out <<= concat(*(mem[(base_addr + concat(scan, as_wires(i, bitwidth=4)))[:16]]
                   for i in reversed(range(16))))
    vy <<= scan
    


# GPIO adapter
GPIO_BASE = 0xc000

def gpio_adapter(mem, base_addr=GPIO_BASE):
    gpio_in = Input(bitwidth=32, name='gpio_in')
    gpio_out = Output(bitwidth=32, name='gpio_out')

    mem[base_addr + 0x0] <<= gpio_in[:16]
    mem[base_addr + 0x1] <<= gpio_in[16:]
    gpio_out <<= concat(mem[base_addr + 0x3], mem[base_addr + 0x2])
    return gpio_in, gpio_out

