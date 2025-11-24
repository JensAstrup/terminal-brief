#!/bin/bash

# terminal-brief uninstallation script

echo "Uninstalling terminal-brief..."

# Detect the shell and appropriate rc file
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ] || [ "$SHELL" = "/usr/bin/zsh" ]; then
  RC_FILE="$HOME/.zshrc"
  echo "Detected zsh shell"
elif [ -f "$HOME/.zshrc" ]; then
  RC_FILE="$HOME/.zshrc"
  echo "Found ~/.zshrc"
else
  RC_FILE="$HOME/.bashrc"
  echo "Using bash shell"
fi

# Remove wrapper script
WRAPPER_FILE="$HOME/.terminal-brief.sh"
if [ -f "$WRAPPER_FILE" ]; then
  rm "$WRAPPER_FILE"
  echo "✓ Removed $WRAPPER_FILE"
fi

# Remove lines from rc file
if [ -f "$RC_FILE" ]; then
  # Create a backup
  cp "$RC_FILE" "${RC_FILE}.backup"
  
  # Remove terminal-brief related lines
  sed -i.tmp '/# terminal-brief:/d' "$RC_FILE"
  sed -i.tmp '/alias terminal-brief=/d' "$RC_FILE"
  sed -i.tmp '/\[ -f.*\.terminal-brief\.sh.*\]/d' "$RC_FILE"
  
  # Clean up temporary file
  rm -f "${RC_FILE}.tmp"
  
  echo "✓ Removed terminal-brief configuration from $RC_FILE"
  echo "  (Backup saved as ${RC_FILE}.backup)"
fi

echo ""
echo "✓ Uninstallation complete!"
echo ""
echo "Note: Configuration files in ~/.config/welcome/ were not removed."
echo "To remove them, run: rm -rf ~/.config/welcome"
echo ""

