import re
import pyparsing as pp
from pyparsing import OpAssoc, one_of, infix_notation

from ir import Var, Const, Seq, If, FuncDef


# This is global :/
pp.ParserElement.enable_packrat()

# Some utils
class GroupUnlessOne(pp.Group):
    def postParse(self, instring, loc, tokenlist):
        if len(tokenlist) == 1:
            return tokenlist
        return super(GroupUnlessOne, self).postParse(instring, loc, tokenlist)

def infix_notation_prime(atom, opspec):
    '''
    An oversimplistic (but faster) version of `pyparsing.helpers.infix_notation`
    '''
    lpar, rpar = pp.Suppress('('), pp.Suppress(')')
    fwd = pp.Forward()
    expr = lpar + fwd + rpar | atom
    for op, arity, assoc in opspec:
        if isinstance(op, str): op = pp.Literal(op)
        # @todo ignoring assoc for now
        if arity == 1:
            expr = pp.Group(op + expr) | expr
        elif arity == 2:
            expr = GroupUnlessOne(expr + (op + expr)[...])
        else:
            raise NotImplemented
    
    fwd << expr
    
    return expr


class IRParser:
    num = (pp.Suppress("0x") + pp.common.hex_integer) | pp.common.signed_integer
    var = pp.Group("$" + pp.common.signed_integer)
    id = pp.common.identifier
    arg = pp.Forward()
    conditional = pp.Forward()
    funcall = (id + arg[...]).set_parse_action(lambda x: [["@", *x.as_list()]])
    tailcall = (pp.Suppress(".") + id + arg[...]).set_parse_action(lambda x: [["@.", *x.as_list()]])
    
    comment = pp.Regex(r'/\*.*?\*/', flags=re.DOTALL)
    
    expr = infix_notation_prime(num | var | conditional | funcall | tailcall, [
        ('-', 1, OpAssoc.RIGHT),
        ('~', 1, OpAssoc.RIGHT),
        (one_of('* /'), 2, OpAssoc.LEFT),
        (one_of('+ -'), 2, OpAssoc.LEFT),
        (one_of('<< >>'), 2, OpAssoc.LEFT),
        ('<', 2, OpAssoc.LEFT),
        ('|', 2, OpAssoc.LEFT),
        ('^', 2, OpAssoc.LEFT),
        ('&', 2, OpAssoc.LEFT),
        (pp.Keyword('ignore'), 1, OpAssoc.RIGHT),
        (';', 2, OpAssoc.LEFT)
    ])
    
    UNOPS = ['-', '~']
    BINOPS = ['-', '*', '/', '+', '-', '<<', '>>', '<', '|', '^', '&']
    
    arg << (num | var | (pp.Suppress("(") + expr + pp.Suppress(")")))
    conditional << pp.Group(pp.Keyword("if") + expr + pp.Keyword("then") + expr + pp.Keyword("else") + expr)
    
    expr.ignore(comment)  # needs to be here to also apply to forwards
    
    fundef = (id + pp.Suppress("(") + pp.common.integer + pp.Suppress(")") + pp.Suppress("=") + expr) \
        .set_parse_action(lambda x: FuncDef(name=x[0], nargs=x[1], body=x[2]))
    
    comp_unit = fundef[...].ignore(comment)
    
    def __call__(self, compilation_unit_text):
        st = self.comp_unit.parse_string(compilation_unit_text, True)
        return [self._fundef_post(fd) for fd in st]
    
    def body(self, input_text):
        return self._expr_post(self.expr.parse_string(input_text, True))

    def _fundef_post(self, fd):
        return FuncDef(name=fd.name, nargs=fd.nargs, ret=fd.ret, body=self._expr_post(fd.body))
                        
    def _expr_post(self, st):
        def aux(t):
            if isinstance(t, int): return Const(t)
            elif len(t) == 1: return aux(t[0])
            elif t[0] == '$': return Var(t[1])
            elif t[0] in ['@', '@.']: return (t[0], t[1], *(aux(s) for s in t[2:]))
            elif t[0] == 'ignore': return ('ignore', aux(t[1]))
            elif t[0] == 'if': return If(aux(t[1]), aux(t[3]), aux(t[5]))
            elif t[1] == ';': return Seq([aux(s) for s in t[::2]])
            elif t[0] in self.UNOPS: return (t[0], aux(t[1]))
            elif t[-2] in self.BINOPS: return (t[-2], *(aux(s) for s in [t[:-2], t[-1]]))
            else: return t
        return aux(st)