"""Entry point for the PyInstaller-frozen Stemify backend.

Packaged as a single binary and spawned by the Electron app as a child
process. Configuration arrives via environment variables set by the
launcher (paths point into the app's resources/userData, not the repo).
"""

import os

from waitress import serve

from app import app

if __name__ == "__main__":
    host = os.environ.get("STEMIFY_HOST", "127.0.0.1")
    port = int(os.environ.get("STEMIFY_PORT", "5001"))
    serve(app, host=host, port=port, threads=4)
