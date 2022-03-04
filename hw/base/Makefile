.PHONY: FORCE

SRC = sim_main.cpp stack-machine.v

bin/stack-machine: FORCE
	@mkdir -p ${dir $@}
	verilator -o ../$@ --top toplevel --cc --exe --build --Mdir obj $(SRC)
