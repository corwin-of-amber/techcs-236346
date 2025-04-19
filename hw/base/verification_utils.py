from z3.z3util import get_vars
from z3 import SolverFor, ForAll, Implies, BitVecSort, BitVecVal, \
               K, Store, ArrayRef, IntSort, \
               FuncInterp, is_func_decl, substitute_vars, sat, unsat
from presentation_forms import vertically, table_repr, Legend


class CHCs:
    """
    A system of CHC rules.
    """
    def __init__(self, rules: list=None, predicate_symbols: set=None):
        self.rules = rules or []
        self.predicate_symbols = predicate_symbols or set()
        self.predicate_symbols_ids = set(u.get_id() for u in self.predicate_symbols)
    
    def __iadd__(self, more_rules: list):
        self.rules += more_rules
        return self
    
    def _repr_html_(self):
        return vertically(self.rules)._repr_html_()
    
    @property
    def freevars(self):
        return set(v for rule in self.rules for v in self.freevars_of(rule))
                         
    def freevars_of(self, rule):
        return [v for v in get_vars(rule)
                if v.decl().get_id() not in self.predicate_symbols_ids and  # the condition is needed!
                   v.get_id() not in self.predicate_symbols_ids]
    
    @property
    def relations(self):
        return self.U.values()
    
    def to_quantified(self):
        def forall_tentative(vs, body):
            return ForAll(vs, body) if vs else body
        return [forall_tentative(self.freevars_of(r), r) for r in self.rules]
    
    def create_solver(self, theory="HORN", engine=None):
        s = SolverFor(theory)
        if engine: s.set('engine', engine)
        for phi in self.to_quantified(): s.add(phi)
        return s
    
    def solve(self, params={}, theory="HORN", engine=None):
        s = self.create_solver(theory, engine)
        for k, v in params.items():
            s.set(k, v)
        res = s.check()
        if res == sat:
            return Solution(s.model())
        elif res == unsat:
            try:
                return HyperResolutionProof(s.proof())
            except:
                return res   # proof is turned off
        else:
            return res
    
    @classmethod
    def query(cls, q):
        return [Implies(q, False)]


class Solution:
    class Predicate:
        def __init__(self, interp: FuncInterp):
            self.interp = interp
        def __call__(self, *args):
            assert self.interp.num_entries() == 0
            return substitute_vars(self.interp.else_value(), *args)
        def _get(self):
            it = self.interp
            return it.else_value() if it.num_entries() == 0 else it
        def __repr__(self): return repr(self._get())
        def _repr_html_(self): return self._get()._repr_html_()

    def __init__(self, model):
        self.model = model

    def __getitem__(self, v):
        if is_func_decl(v):
            return self.Predicate(self.model[v])
        else:
            return self.model.eval(v)
    
    def __repr__(self): return repr(self.model)
    def _repr_html_(self):
        return table_repr([[d, self[d]] for d in self.model.decls()])._repr_html_()


class HyperResolutionProof(object):
    """
    Used to inspect a proof of unsat generated by Spacer.
    Visualizes proof steps as a directed graph.
    """

    def __init__(self, pf_ast):
        self._ast = pf_ast

    def _get_premises_and_conclusion(self, hrstep):
        ch = hrstep.children()
        return ch[:-1], ch[-1]

    def _get_conclusion(self, hrstep):
        return self._get_premises_and_conclusion(hrstep)[1]

    def _traverse(self, ast, cb, visited):
        if ast in visited:
            return

        visited.add(ast)

        subgoals, conclusion = self._get_premises_and_conclusion(ast)
        premises = [self._get_conclusion(k) for k in subgoals]
        
        if conclusion not in visited:
            cb['conjecture'](conclusion)
            visited.add(conclusion)
        
        for (subgoal, premise) in zip(subgoals, premises):
            self._traverse(subgoal, cb, visited)
            cb['dependency'](premise, conclusion)
            
        cb['inference'](premises, conclusion)

    def to_dot(self):
        import graphviz
        g = graphviz.Digraph()

        key = lambda phi: str(phi.get_id())
        
        cb = {
            'conjecture': lambda phi: g.node(key(phi), str(phi)),
            'dependency': lambda phi, psi: g.edge(key(phi), key(psi)),
            'inference':  lambda phis, psi: None
        }
        
        self._traverse(self._ast, cb, set())
        return g
    
    def to_roadmap(self):
        # @todo DRY definitely some duplication here
        import graphviz
        g = graphviz.Digraph()
        
        leg = Legend(by = lambda phi: phi.get_id())
        key = lambda phi: str(leg.key(phi))
        
        cb = {
            'conjecture': lambda phi: g.node(key(phi), key(phi)),
            'dependency': lambda phi, psi: g.edge(key(phi), key(psi)),
            'inference':  lambda phis, psi: None
        }

        self._traverse(self._ast, cb, set())

        trep = table_repr([[g, leg]])
        trep.col_styles[0] = 'width: 20%'
        return trep

    def _repr_svg_(self):
        return self.to_dot()._repr_svg_()

    def __str__(self):
        return str(self.to_dot())
    def raw(self):
        return self._ast


def mk_bv_array(*a):
    if len(a) == 2:
        width_spec, data = a
        if isinstance(width_spec, ArrayRef):
            sort = width_spec.sort()
            bitwidth, addrwidth = sort.range().size(), sort.domain().size()
        else:
            bitwidth, addrwidth = width_spec
    elif len(a) == 3:
        bitwidth, addrwidth, data = a
    else:
        raise TypeError(f"expected 2 or 3 arguments, {len(a)} given")
        
    return mk_bv_array_3(bitwidth, addrwidth, data)

        
def mk_bv_array_3(bitwidth, addrwidth, data):
    a = K(BitVecSort(addrwidth), BitVecVal(0, bitwidth))
    for i, d in enumerate(data):
        a = Store(a, i, d)
    return a

def mk_int_array(data):
    a = K(IntSort(), 0)
    for i, d in enumerate(data):
        a = Store(a, i, d)
    return a