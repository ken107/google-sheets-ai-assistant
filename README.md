# Google Sheets AI Assistant

## Overview
Google Sheets AI Assistant is a Google Sheets add-on that lets you edit your spreadsheet using natural language commands.

## Features
- Retrieve and update data in Google Sheets.
- Format and manipulate data easily.
- User-friendly interface with custom menu items.

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/google-sheets-ai-assistant.git
   ```
2. Navigate to the project directory:
   ```
   cd google-sheets-ai-assistant
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Open Google Sheets and navigate to Extensions > Add-ons > Manage Add-ons.
2. Deploy the add-on using clasp:
   ```
   clasp deploy
   ```
3. Access the add-on from the Extensions menu in Google Sheets.

## Development
- The main entry point for the add-on is located in `src/main.ts`.
- Configuration for the Google Apps Script project can be found in `src/appsscript.json`.
- Services for interacting with Google Sheets API are defined in `src/services/sheetsService.ts`.
- Utility functions for data manipulation are located in `src/utils/index.ts`.
- Type definitions for data structures are in `src/types/index.ts`.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.