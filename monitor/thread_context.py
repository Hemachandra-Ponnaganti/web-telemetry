import threading
from contextlib import contextmanager
import requests
from requests.sessions import Session

# Thread-local context to hold active language selection
local_context = threading.local()

# Maps React language selector names to Accept-Language headers
LANG_MAP = {
    "English": "en-US,en;q=0.9",
    "Deutsch": "de-DE,de;q=0.9",
    "Español": "es-ES,es;q=0.9",
    "Español – América Latina": "es-419,es;q=0.9",
    "Français": "fr-FR,fr;q=0.9",
    "Indonesia": "id-ID,id;q=0.9",
    "తెలుగు": "te-IN,te;q=0.9",
    "हिन्दी": "hi-IN,hi;q=0.9",
}

@contextmanager
def language_context(lang):
    """Context manager to set the active language in the current thread."""
    old_lang = getattr(local_context, "lang", None)
    local_context.lang = lang
    try:
        yield
    finally:
        local_context.lang = old_lang

def run_with_context(lang, fn, *args, **kwargs):
    """Runs a function within the specified language thread context."""
    with language_context(lang):
        return fn(*args, **kwargs)

# Original requests Session.send
original_send = Session.send

def custom_send(self, request, **kwargs):
    """Intercepts and injects custom Accept-Language headers dynamically."""
    lang = getattr(local_context, "lang", None)
    if lang:
        header_val = LANG_MAP.get(lang)
        if not header_val:
            # Fallback for case-insensitive matching
            for k, v in LANG_MAP.items():
                if k.lower() == lang.lower():
                    header_val = v
                    break
        if header_val:
            request.headers['Accept-Language'] = header_val
    return original_send(self, request, **kwargs)

# Inject monkeypatch
Session.send = custom_send
