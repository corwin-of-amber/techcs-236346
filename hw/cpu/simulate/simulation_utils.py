import os
from pyrtl import CompiledSimulation


class CCompiledSimulation(CompiledSimulation):
    def __init__(self, out_dir=".", *a, **kw):
        self.out_dir = out_dir
        super(CCompiledSimulation, self).__init__(*a, **kw)
    
    def _create_dll(self):
        def write_patched(f, s):
            if "#define mul128" in s:
                f.write(self.MUL128)
            else:
                f.write(s + "\n")
        csim_c, csim_h = self._scratch_files()
        with open(csim_c, "w") as f:
            self._create_code(lambda s: write_patched(f, s))
        with open(csim_h, "w") as f:
            for ln in self._create_header(): f.write(ln + "\n")

    def _create_header(self):
        yield from self.DECL
        yield from self._create_struct_and_defs("input_t",  "in",  self._inputpos)
        yield from self._create_struct_and_defs("output_t", "out", self._outputpos)

    def _create_struct_and_defs(self, struct_name, defs_prefix, field_pos_dict):
        yield from self._create_struct(struct_name, field_pos_dict)
        yield from self._create_defs(defs_prefix, field_pos_dict)
        
    def _create_struct(self, name, field_pos_dict):
        yield f"struct {name} {{"
        fields = sorted(field_pos_dict.items(), key=lambda t: t[1][0])
        for name, (ofs, sz) in fields:
            yield f"  uint64_t {name}{f'[{sz}]' if sz > 1 else ''};"       
        yield "};"
        
    def _create_defs(self, prefix, field_pos_dict):
        for name in field_pos_dict.keys():
            yield f"#define _has_signal_{prefix}_{name}"
        
    def _scratch_files(self):
        import os, os.path
        try: os.makedirs(self.out_dir)
        except FileExistsError: pass

        return [os.path.join(self.out_dir, fn) for fn in ["csim.c", "csim.h"]]
            
    def _initialize_mems(self):
        pass
    
    MUL128 = "#define mul128(t0, t1, pl, ph) g_mul128(t0, t1, &pl, &ph)\nvoid g_mul128(uint64_t t0, uint64_t t1, uint64_t *pl, uint64_t *ph) { *pl = t0 * t1; }\n"
    
    DECL = [
        '#ifdef __cplusplus', 'extern "C" {', '#endif',
        '    void initialize_mems();',
        '    void sim_run_all(uint64_t stepcount, uint64_t inputs[], uint64_t outputs[]);',
        '#ifdef __cplusplus', '}', '#endif',
    ]
