"""Loads an WSGI entry point from *application_server* module after re-mounting
   with Python 3.
"""

import os
import sys

# insert path to user-level Python here
INTERP = os.path.abspath(os.path.expanduser("~/opt/python-3.6.2/bin/python3"))
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

from application_server import application
