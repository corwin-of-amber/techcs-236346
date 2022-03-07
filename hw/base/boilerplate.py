# https://github.com/UCSBarchlab/PyRTL/issues/410
import collections.abc
collections.Mapping = collections.abc.Mapping

# For jupyterlab:

# - include jQuery
from IPython.display import display, HTML, Javascript
display(HTML('<script src="https://unpkg.com/jquery@3.3.1/dist/jquery.js"></script>'))

# - monkey-patch graphviz
from graphviz import Source
Source._repr_svg_ = Source._repr_image_svg_xml