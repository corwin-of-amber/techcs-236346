from collections import namedtuple

Const = namedtuple('Const', ['value'])
Var = namedtuple('Var', ['offset'])
Seq = namedtuple('Seq', ['stmts'])
If = namedtuple('If', ['cond', 'then', 'else_'])

class FuncDef(namedtuple('FuncDef', ['name', 'nargs', 'ret', 'body'])):
    def __new__(cls, name, nargs, ret=True, body=None):
        if not body and not isinstance(ret, bool):
            ret, body = True, ret
        if not body: raise TypeError('body is missing')
        return super(FuncDef, cls).__new__(cls, name, nargs, ret, body)