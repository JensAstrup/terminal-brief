# Terminal Brief

A beautiful, customizable terminal welcome message system that displays useful information when you open a new terminal.

## Features

- 🌤️ **Weather Information** - Current weather and forecasts
- 🐙 **GitHub Integration** - PR notifications and mentions
- 📐 **Linear Integration** - Stalled issue tracking
- 💻 **System Information** - Load, memory, battery, uptime
- 🎨 **Customizable** - Themes, modules, and display options
- ⚡ **Fast** - Caching and parallel execution support
- 🔧 **Easy Configuration** - Interactive CLI config menu

## Installation

1. **Build the project:**
   ```bash
   yarn install
   yarn build
   ```

2. **Run the installation script:**
   ```bash
   ./install.sh
   ```

3. **Apply changes:**
   ```bash
   source ~/.zshrc  # or ~/.bashrc for bash
   ```

## Usage

### Display Welcome Message
```bash
terminal-brief
```

### Configure Settings
```bash
terminal-brief config
```

The interactive config menu allows you to configure:
- **API Keys** - GitHub Personal Token and Linear API Key (saved to `~/.zshenv` or `~/.bashrc`)
- **User Settings** - Your name for personalized greetings
- **Weather Configuration** - Location, units, and display preferences
- **GitHub Configuration** - PR display preferences
- **Linear Configuration** - Team selection and stalled issue settings
- **System Display** - Choose which system metrics to show
- **Cache Settings** - Configure cache durations
- **Performance Settings** - Execution time limits and parallel processing
- **Display Preferences** - Emojis, color themes, log levels
- **Enabled Modules** - Select which modules to display

All configuration (except API keys) is saved to `~/.config/welcome/config.json`.

## Configuration

### API Keys

Run `terminal-brief config` and select "API Keys" to set up:
- **GitHub Personal Token**: Required for GitHub PR notifications
- **Linear API Key**: Required for Linear issue tracking

### Modules

Available modules:
- `system` - System information (load, memory, battery, uptime)
- `greeting` - Personalized greeting message
- `weather` - Weather information
- `github` - GitHub PR notifications
- `linearStalled` - Linear stalled issues

Enable/disable modules via `terminal-brief config` → "Enabled Modules"

### Themes

Available color themes:
- `default` - Standard terminal colors
- `light` - Light color scheme
- `dark` - Dark color scheme
- `pastel` - Soft pastel colors

## Uninstallation

To uninstall terminal-brief:
```bash
./uninstall.sh
```

This will:
- Remove the `~/.terminal-brief.sh` wrapper
- Remove the alias and startup configuration from your shell rc file
- Keep your config files in `~/.config/welcome/` (remove manually if desired)

## Development

### Scripts

- `yarn build` - Build TypeScript to JavaScript
- `yarn start` - Run the built application
- `yarn dev` - Run with ts-node (development)
- `yarn watch` - Watch mode with auto-reload
- `yarn clean` - Remove build artifacts
- `yarn rebuild` - Clean and build

### Project Structure

```
terminal-brief-1/
├── src/
│   ├── commands/
│   │   └── config.ts          # Interactive config CLI
│   ├── config/
│   │   └── index.ts           # Config loading and saving
│   ├── modules/
│   │   ├── base.ts            # Module registry and display
│   │   ├── greeting.ts        # Greeting module
│   │   ├── github.ts          # GitHub integration
│   │   ├── linearStalled.ts   # Linear integration
│   │   ├── system.ts          # System info module
│   │   └── weather.ts         # Weather module
│   ├── types/
│   │   └── config.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── cache.ts           # Caching utilities
│   │   ├── color.ts           # Color formatting
│   │   ├── logger.ts          # Logging utilities
│   │   └── performance.ts     # Performance tracking
│   └── index.ts               # Main entry point
├── bin/
│   └── terminal-brief.js      # Binary entry point
├── install.sh                 # Installation script
├── uninstall.sh              # Uninstallation script
├── terminal-brief.sh         # Shell wrapper
└── package.json
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

