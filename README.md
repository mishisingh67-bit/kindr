# Kindr Platform

## Getting Started

To run the Kindr platform locally, you need to start the backend server.

1. Double-click **`start_server.bat`** to start the Python backend.
   - This will open a terminal window running on `http://127.0.0.1:8000`.
   - Keep this window open while using the app.

2. Open **`index.html`** or **`login.html`** in your browser.

## Troubleshooting

- **"Connection failed"**: If you see this error on the login page, it means `start_server.bat` is not running.
- **Port already in use**: The server will try to find an open port (8001, 8002, etc.), but the frontend expects port 8000. Ensure no other instances are running.
