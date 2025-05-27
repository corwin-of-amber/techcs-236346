.PHONY: FORCE clean

MODE = PyRTL-C

CC = gcc
CXX = g++

CFLAGS = -O3 -Iobj
CXXFLAGS = $(CFLAGS) -std=c++11

VTRFLAGS = -O3 -CFLAGS -O3
#VTRFLAGS += -CFLAGS -DNO_DEBUG_MEM

ifeq ($(MODE),PyRTL-C)
bin/csim: obj/csim.o obj/csim_main.o
	@mkdir -p $(@D)
	$(CXX) -pthread -o $@ $+
endif

ifeq ($(MODE),Verilator)

bin/csim: FORCE
	@mkdir -p $(@D)
	verilator -o ../$@ --top toplevel --cc --exe --build --Mdir obj $(VTRFLAGS) simulate/vsim_main.cpp obj/cpu.v
endif

obj/%.o: %.c
	@mkdir -p $(@D)
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: obj/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

obj/%.o: simulate/%.cpp
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) -c -o $@ $<

obj/csim_main.o: obj/csim.h

clean:
	rm -rf obj/*.o bin/csim