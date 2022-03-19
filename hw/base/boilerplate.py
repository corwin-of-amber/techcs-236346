# https://github.com/UCSBarchlab/PyRTL/issues/410
import collections.abc
collections.Mapping = collections.abc.Mapping

# For jupyterlab:

# - include jQuery
try:
    import IPython
    if IPython.get_ipython():
        from IPython.display import display, HTML
        display(HTML('<script src="https://unpkg.com/jquery@3.3.1/dist/jquery.js"></script>'))
except ImportError:
    pass

# - monkey-patch graphviz (>= 0.19) for backward compatibility
try:
    from graphviz import Source, Digraph
    for cls in [Source, Digraph]:
        if not hasattr(cls, '_repr_svg_'):
            cls._repr_svg_ = Source._repr_image_svg_xml
except ImportError:
    pass