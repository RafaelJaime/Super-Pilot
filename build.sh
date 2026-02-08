#!/bin/bash
# Build script: assembles src/ modules into index.html
# Usage: bash build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

python3 -c "
import os

src = os.path.join('$SCRIPT_DIR', 'src')

def read(path):
    with open(os.path.join(src, path)) as f:
        return f.read()

template = read('base.html')

# CSS replacements
template = template.replace('/* BASE_CSS */', read('base.css'))
template = template.replace('/* SETTINGS_CSS */', read('settings/settings.css'))
template = template.replace('/* CHAT_CSS */', read('chat/chat.css'))
template = template.replace('/* INPUT_CSS */', read('input/input.css'))

# HTML: inject input inside chat first
chat_html = read('chat/chat.html').replace('<!-- INPUT_HTML -->', read('input/input.html'))
template = template.replace('<!-- CHAT_HTML -->', chat_html)
template = template.replace('<!-- SETTINGS_HTML -->', read('settings/settings.html'))

# JS replacements
template = template.replace('/* SETTINGS_JS */', read('settings/settings.js'))
template = template.replace('/* CHAT_JS */', read('chat/chat.js'))
template = template.replace('/* INPUT_JS */', read('input/input.js'))

out = os.path.join('$SCRIPT_DIR', 'index.html')
with open(out, 'w') as f:
    f.write(template)
print('Built:', out)
"

zip -r "$SCRIPT_DIR/super-pilot.zip" manifest.json plugin.js index.html icon.svg
echo "Packaged: $SCRIPT_DIR/super-pilot.zip"
