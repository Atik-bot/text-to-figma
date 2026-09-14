# Text-to-Figma Generator

An AI-powered design generation tool that transforms natural language prompts into structured UI designs and converts them into editable Figma elements.

## Overview

Text-to-Figma Generator allows users to describe a user interface in plain English and generate a structured design using AI. The project combines a web-based interface, a Python backend, and a Figma plugin to provide an AI-assisted design workflow.

## Features

* **AI-powered design generation:** Generate UI designs from natural language prompts.
* **Web-based interface:** Enter prompts and preview generated designs.
* **Structured design output:** Convert AI-generated responses into a predefined JSON design schema.
* **Figma integration:** Create editable design elements inside Figma.
* **Backend API:** Process design generation requests using FastAPI.
* **Customisable AI model:** Configure the OpenRouter model through environment variables.

## Technology Stack

| Component          | Technologies                      |
| ------------------ | --------------------------------- |
| Frontend           | Next.js 15, React 19, TypeScript  |
| Styling            | Tailwind CSS 4                    |
| Backend            | Python, FastAPI, Pydantic         |
| AI Integration     | OpenRouter API, OpenAI Python SDK |
| Design Integration | Figma Plugin API, TypeScript      |
| Build Tools        | npm, esbuild, Uvicorn             |

## Project Structure

```text
text-to-figma/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── logging.py
│   │   ├── data/
│   │   │   └── sample_design.py
│   │   ├── schemas/
│   │   │   └── design_schema.py
│   │   ├── services/
│   │   │   └── design_service.py
│   │   └── main.py
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   │   └── DesignPreview.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   └── package.json
│
└── figma-plugin/
    ├── src/
    │   ├── builder.ts
    │   ├── code.ts
    │   ├── components.ts
    │   ├── helpers.ts
    │   └── types.ts
    ├── dist/
    ├── manifest.json
    ├── ui.html
    └── package.json
```

## Prerequisites

Make sure you have the following installed:

* Node.js and npm
* Python 3.10 or later
* Figma desktop application
* An OpenRouter API key

## Installation and Setup

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd text-to-figma
```

Replace `<YOUR_REPOSITORY_URL>` with your repository's Git URL.

### 2. Configure the backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment.

**Windows:**

```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file by copying `.env.example`.

```bash
copy .env.example .env
```

For macOS or Linux:

```bash
cp .env.example .env
```

Configure the environment variables:

```env
APP_NAME=text-to-figma-backend
DEBUG=false
PORT=8000

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=qwen/qwen3-coder:free
```

Get your API key from [OpenRouter](https://openrouter.ai/keys).

Keep your API key private and never commit your `.env` file.

### 3. Start the backend server

From the `backend` directory, run:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

Verify that the backend is running:

```text
http://127.0.0.1:8000/health
```

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

### 4. Start the frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

The frontend communicates with the backend at `http://127.0.0.1:8000`.

### 5. Build the Figma plugin

Open another terminal and navigate to the plugin directory:

```bash
cd figma-plugin
```

Install the dependencies:

```bash
npm install
```

Build the plugin:

```bash
npm run build
```

This runs the TypeScript type check and bundles the plugin code into the `dist` directory.

### 6. Import the plugin into Figma

1. Open the Figma desktop application.
2. Open a design file.
3. Navigate to the Plugins section in Figma's development menu.
4. Select the option to import a plugin from a manifest file.
5. Choose `figma-plugin/manifest.json`.
6. Run the imported Text-to-Figma Generator plugin.

## Usage

1. Start the backend server.
2. Start the frontend development server.
3. Open the application in your browser.
4. Enter a natural language description of the UI you want to create.
5. Generate the design and review the preview.
6. Use the Figma plugin to create the corresponding design elements in Figma.

Example prompt:

```text
Create a modern dashboard for a project management
application with a sidebar, project statistics,
task cards, and a recent activity section.
```

## API Reference

### Generate Design

**Endpoint:** `POST /generate`

Generates a structured UI design from a text prompt.

Request:

```json
{
  "prompt": "Create a modern dashboard for a project management application"
}
```

The endpoint accepts a prompt and returns a design object that follows the project's `DesignSchema`.

### Health Check

**Endpoint:** `GET /health`

Checks whether the backend is running.

Example response:

```json
{
  "status": "ok"
}
```

## Development Commands

### Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Figma Plugin

```bash
npm run build
npm run typecheck
```

## Troubleshooting

**Backend connection error**

Make sure the FastAPI server is running on port `8000` and that the frontend is configured to use the correct backend URL.

**OpenRouter API error**

Verify that your API key is valid, your account has the required API access, and the configured model is available.

**Figma plugin does not appear**

Make sure the plugin has been imported using the correct `manifest.json` file and that the build completed successfully.

**Design generation fails**

Check the backend terminal for errors and verify that the AI response conforms to the expected design schema.

## Security

* Store API keys in environment variables.
* Do not commit `.env` files or other secrets.
* Keep dependencies and development tools updated.
* Avoid sharing API credentials in screenshots or public repositories.

## Future Improvements

* Support additional AI models.
* Add more UI components and design templates.
* Improve design generation accuracy.
* Support additional design customisation options.
* Expand the range of supported Figma elements.

## License

This project is currently provided without a specified open-source license. Add a `LICENSE` file before distributing it under an open-source license.
