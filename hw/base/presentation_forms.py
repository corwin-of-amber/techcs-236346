class table_repr:
    def __init__(self, iter):
        self.rows = list(iter)
        self.td_style = "text-align: left"
        self.col_styles = {}
    def _cell_html(self, obj):
        if hasattr(obj, '_repr_html_'): return obj._repr_html_()
        if hasattr(obj, '_repr_svg_'): return obj._repr_svg_()
        else: return str(obj)  # @todo escape
    def _td(self, obj, col_index):
        style = ";".join(x for x in [self.td_style, self.col_styles.get(col_index, None)] if x)
        return f'<td style="{style}">{self._cell_html(obj)}</td>'
    def _tr(self, data):
        if not (isinstance(data, list) or isinstance(data, tuple)):
            data = (data,)
        return f'<tr>{"".join(self._td(v, i) for i, v in enumerate(data))}</tr>'
    def _repr_html_(self):
        return f'<table style="background: white; color: black">{"".join(map(self._tr, self.rows))}</table>'


def vertically(iter):
    return table_repr([x] for x in iter)


class Legend:
    """
    Generates a table of objects by consecutive keys.
    """
    def __init__(self, by=lambda x: x, start_at=0):
        self.keys = {}  # item -> key
        self.items = [] # (key, item)
        self.by = by
        self._keygen = iter(range(start_at, 2 ** 31))

    def key(self, item):
        k = self.by(item)
        v = self.keys.get(k, None)
        if v is None:
            v = self._keygen.__next__()
            self.keys[k] = v
            self.items.append((v, item))
        return v
    
    def _repr_html_(self):
        return table_repr(self.items)._repr_html_()