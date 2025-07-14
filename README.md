# todoist-linker

A lightweight Chrome extension that lets you add tasks to Todoist directly from any webpage. Built with Manifest V3 for modern Chrome browsers.

<img width="397" height="505" alt="Screenshot from 2025-07-15 02-07-36" src="https://github.com/user-attachments/assets/40e11f82-3063-4ab7-b3ba-df1062d1f773" />

## Features

- **Quick Task Creation** - Add tasks with title, description, due date, and priority
- **Project Integration** - Select from your existing Todoist projects
- **Priority Levels** - Set task priority from low to urgent
- **Keyboard Shortcut** - Use `Ctrl+Shift+T` to open the popup
- **Secure API Integration** - Uses official Todoist REST API v2
- **Visual Feedback** - Confirmation notifications when tasks are added

## Installation

### Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/todoist-chrome-extension.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the extension folder

5. Get your Todoist API token from [Todoist Integrations](https://todoist.com/prefs/integrations)

6. Click the extension icon and enter your API token

## Usage

### Adding Tasks

1. Click the extension icon in your toolbar
2. Fill in the task details:
   - Task name (required)
   - Description (optional)
   - Due date (optional)
   - Priority level (Low, Normal, High, Urgent)
   - Project selection
3. Click "Add Task" or press Enter

### Keyboard Shortcuts

- `Ctrl+Shift+T` - Open task creation popup
- `Enter` - Submit task when popup is focused

## File Structure

```
todoist-chrome-extension/
├── manifest.json     # Extension manifest
├── popup.html       # Main popup interface
├── popup.js         # Popup functionality
├── content.js       # Content script
└── README.md        # Documentation
```

## API Integration

This extension uses the Todoist REST API v2:
- Authentication via Bearer token
- Task creation endpoint: `POST /rest/v2/tasks`
- Project listing endpoint: `GET /rest/v2/projects`

## Permissions

- `activeTab` - Access current tab information
- `storage` - Store API token locally
- `https://api.todoist.com/*` - Access Todoist API

## Development

### Setup

1. Clone the repository
2. Make your changes
3. Load the extension in Chrome for testing
4. Test with a valid Todoist API token

### Building

No build process required. This is a vanilla JavaScript extension.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues or questions:
- Check [existing issues](https://github.com/yourusername/todoist-chrome-extension/issues)
- Create a new issue if needed
- Include Chrome version and error details in bug reports

## Privacy

- API token stored locally in Chrome storage
- No data collection or tracking
- Direct communication with Todoist API only
