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

# - monkey-patch graphviz
try:
    from graphviz import Source
    Source._repr_svg_ = Source._repr_image_svg_xml
except ImportError:
    pass