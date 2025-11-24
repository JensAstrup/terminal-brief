#!/bin/bash

# terminal-brief installation script
# This script sets up terminal-brief to run automatically when opening a new terminal

set -e

echo "Installing terminal-brief..."

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

# Get the absolute path to the project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# Create a wrapper script in home directory that references the project
WRAPPER_DEST="$HOME/.terminal-brief.sh"

echo "Creating wrapper script at $WRAPPER_DEST"
cat > "$WRAPPER_DEST" << 'EOF'
#!/bin/bash
# terminal-brief shell wrapper
# This script provides a convenient interface for the terminal-brief command

# Project directory (set during installation)
PROJECT_DIR="__PROJECT_DIR__"

# Check if a command was provided
if [ "$1" = "config" ]; then
  # Call terminal-brief with the config command
  node "$PROJECT_DIR/dist/index.js" config
else
  # Default: run terminal-brief without arguments
  node "$PROJECT_DIR/dist/index.js"
fi
EOF

# Replace the placeholder with actual project directory
sed -i.bak "s|__PROJECT_DIR__|$PROJECT_DIR|g" "$WRAPPER_DEST"
rm -f "${WRAPPER_DEST}.bak"

chmod +x "$WRAPPER_DEST"
echo "Created wrapper script referencing $PROJECT_DIR"

# Add alias for terminal-brief command
if ! grep -q "alias terminal-brief=" "$RC_FILE" 2>/dev/null; then
  echo "" >> "$RC_FILE"
  echo "# terminal-brief: Command alias" >> "$RC_FILE"
  echo "alias terminal-brief='node \"$PROJECT_DIR/dist/index.js\"'" >> "$RC_FILE"
  echo "Added terminal-brief alias to $RC_FILE"
fi

# Check if terminal-brief startup is already configured in the rc file
if grep -q "# terminal-brief: Display welcome message on terminal startup" "$RC_FILE" 2>/dev/null; then
  echo "terminal-brief startup is already configured in $RC_FILE"
else
  echo "" >> "$RC_FILE"
  echo "# terminal-brief: Display welcome message on terminal startup" >> "$RC_FILE"
  echo "[ -f \"$HOME/.terminal-brief.sh\" ] && source \"$HOME/.terminal-brief.sh\"" >> "$RC_FILE"
  echo "" >> "$RC_FILE"
  echo "Added terminal-brief startup to $RC_FILE"
fi

# Source the rc file to apply changes
echo ""
echo "✓ Installation complete!"
echo ""
echo "To apply changes immediately, run:"
echo "  source $RC_FILE"
echo ""
echo "Or open a new terminal session."
echo ""
echo "After sourcing, you can use the following commands:"
echo "  terminal-brief        # Display welcome message"
echo "  terminal-brief config # Configure settings"
echo ""

