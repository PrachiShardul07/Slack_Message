# Slack Sandbox Demo

A simple Node.js/Express project to interact with Slack via the Slack API.  
Supports authentication, sending, scheduling, retrieving, updating, and deleting messages in a safe development environment.

---

## **Features**

- **Authentication / Login**
  - OAuth 2.0 or direct bot token (`SLACK_BOT_TOKEN`)
  - `/slack/install` and `/slack/oauth/callback` handle OAuth flow
- **Messaging Operations**
  - Send messages
  - Schedule messages
  - Retrieve messages
  - Edit messages
  - Delete messages
- **Developer Sandbox**
  - Safe testing environment using a dedicated Slack workspace or channel
- **Ngrok Support**
  - Expose your local server to the web for testing Slack callbacks

---

## **Setup Instructions**

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
2. Install dependencies
bash
Copy code
npm install
3. Configure environment variables
Create a .env file in the project root:

env
Copy code
PORT=3000
BASE_URL=http://localhost:3000
SLACK_CLIENT_ID=<your-client-id>
SLACK_CLIENT_SECRET=<your-client-secret>
SLACK_BOT_TOKEN=<your-bot-token>  # optional if using OAuth
Important: Do not commit .env or tokens.json to GitHub.

4. Start the server
bash
Copy code
node index.js
The server runs on http://localhost:3000 (or ngrok URL if tunneling).

Visit http://localhost:3000/ to install the app and view endpoints.

API Endpoints
Method	Endpoint	Description
GET	/api/channels	List all channels accessible by the bot
POST	/api/send-message	Send a message { channel, text }
POST	/api/schedule-message	Schedule a message { channel, text, post_at }
GET	/api/messages	Retrieve messages by channel ?channel=CHANNEL_ID&limit=10
POST	/api/update-message	Update a message { channel, ts, text }
POST	/api/delete-message	Delete a message { channel, ts }

Testing via PowerShell
Send a message:

powershell
Copy code
Invoke-RestMethod -Uri http://localhost:3000/api/send-message `
  -Method POST `
  -Body (@{ channel = "C09JM2M09M1"; text = "Hello from demo" } | ConvertTo-Json) `
  -ContentType "application/json"
Retrieve channels:

powershell
Copy code
Invoke-RestMethod -Uri http://localhost:3000/api/channels
Update a message:

powershell
Copy code
Invoke-RestMethod -Uri http://localhost:3000/api/update-message `
  -Method POST `
  -Body (@{ channel = "C09JM2M09M1"; ts = "1759665587.945979"; text = "Updated text" } | ConvertTo-Json) `
  -ContentType "application/json"
Delete a message:

powershell
Copy code
Invoke-RestMethod -Uri http://localhost:3000/api/delete-message `
  -Method POST `
  -Body (@{ channel = "C09JM2M09M1"; ts = "1759665587.945979" } | ConvertTo-Json) `
  -ContentType "application/json"
Resources
Slack API Documentation

Messaging Guide

Developer Sandbox Setup



