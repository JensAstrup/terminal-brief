#!/bin/bash

# terminal-brief shell wrapper
# This script provides a convenient interface for the terminal-brief command

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if a command was provided
if [ "$1" = "config" ]; then
  # Call terminal-brief with the config command
  node "$SCRIPT_DIR/dist/index.js" config
else
  # Default: run terminal-brief without arguments
  node "$SCRIPT_DIR/dist/index.js"
fi

