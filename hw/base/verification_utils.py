from z3.z3util import get_vars
from z3 import SolverFor, ForAll, Implies


class CHCs:
    """
    A system of CHC rules.
    """
    def __init__(self, rules: list=None, predicate_symbols: set=None):
        self.rules = rules or []
        self.predicate_symbols = predicate_symbols or set()
    
    def __iadd__(self, more_rules: list):
        self.rules += more_rules
        return self
    
    @property
    def freevars(self):
        return set(v for rule in self.rules for v in self.freevars_of(rule))
                         
    def freevars_of(self, rule):
        return [v for v in get_vars(rule)
                if v.decl() not in self.predicate_symbols]  # the condition is needed!
    
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
    
    @classmethod
    def query(cls, q):
        return [Implies(q, False)]

