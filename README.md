
# Text-to-Figma Generator

An AI-powered design generation tool that transforms natural language prompts into structured UI designs and converts them into editable Figma elements.

The project combines a web-based interface built with Next.js, a Python backend powered by FastAPI, and a custom Figma plugin to create an AI-assisted UI design workflow.

Describe your desired interface in plain English, generate a structured design, preview the result, and transfer the generated elements into Figma for further editing.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
  - [Clone the Repository](#1-clone-the-repository)
  - [Configure the Backend](#2-configure-the-backend)
  - [Start the Backend](#3-start-the-backend)
  - [Configure the Frontend](#4-configure-the-frontend)
  - [Build the Figma Plugin](#5-build-the-figma-plugin)
  - [Import the Plugin into Figma](#6-import-the-plugin-into-figma)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Development Commands](#development-commands)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

Text-to-Figma Generator is a full-stack application designed to simplify the process of turning design ideas into editable UI elements.

Traditional UI design workflows often require designers and developers to manually translate requirements into layouts, components, and visual elements.

This project introduces an AI-assisted workflow in which users describe their desired interface using natural language. An AI model processes the prompt and generates a structured design representation that can be previewed in the web application and converted into native Figma elements through a custom plugin.

The application is organised into three main components:

| Component | Description |
|---|---|
| Frontend | Provides the user interface for entering prompts and previewing generated designs. |
| Backend | Processes design generation requests, communicates with the AI model, and validates structured design output. |
| Figma Plugin | Converts the generated design structure into editable elements inside Figma. |

The application uses OpenRouter to access configurable AI models, allowing the model to be changed through environment variables.

## Features

### AI-Powered Design Generation

- Generate UI designs from natural language descriptions.
- Use configurable language models through the OpenRouter API.
- Convert AI-generated responses into a structured design representation.

### Interactive Web Interface

- Enter design prompts through a web-based interface.
- Preview generated designs before transferring them to Figma.
- Review the structured output through the application's design preview workflow.

### Structured Design Output

- Use a predefined Pydantic-based design schema.
- Validate generated design data before it is processed by the application.
- Maintain a consistent data structure between the backend, frontend, and Figma plugin.

### Figma Integration

- Import the generated design into Figma using a custom plugin.
- Convert structured design data into editable Figma elements.
- Continue customising the generated design directly inside Figma.

### Configurable AI Model

- Integrate OpenRouter through the OpenAI Python SDK.
- Configure the API key and model using environment variables.
- Change the configured model without redesigning the overall application architecture.

---

## How It Works

The application follows a prompt-to-design pipeline.

```text
                USER
                  |
                  v
       +----------------------+
       |   Next.js Frontend   |
       |                      |
       | Enter Design Prompt  |
       | Preview UI Design    |
       +----------------------+
                  |
                  | HTTP POST
                  | /generate
                  v
       +----------------------+
       |    FastAPI Backend   |
       |                      |
       | API Request Handling |
       | Design Generation    |
       | Schema Validation    |
       +----------------------+
                  |
                  v
       +----------------------+
       |   OpenRouter API     |
       |                      |
       | Configured AI Model  |
       | Natural Language     |
       | to Design JSON       |
       +----------------------+
                  |
                  | Structured Design
                  v
       +----------------------+
       |   Design Preview     |
       |                      |
       | Review Generated UI  |
       +----------------------+
                  |
                  | Design Data
                  v
       +----------------------+
       |    Figma Plugin      |
       |                      |
       | Parse Design Schema  |
       | Build Figma Elements |
       +----------------------+
                  |
                  v
       +----------------------+
       |   Figma Canvas       |
       |                      |
       | Editable UI Elements|
       +----------------------+
```

### Workflow Explanation

1. The user enters a natural language description of the desired UI in the Next.js frontend.
2. The frontend sends the prompt to the FastAPI backend through the design generation API.
3. The backend processes the request and communicates with the configured AI model through OpenRouter.
4. The generated response is converted into the application's structured design schema and validated.
5. The frontend displays the generated design in the preview interface.
6. The Figma plugin processes the structured design data and creates corresponding editable elements inside Figma.

---

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend Framework | Next.js 15, React 19 |
| Frontend Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend Framework | Python, FastAPI |
| Data Validation | Pydantic |
| AI Integration | OpenRouter API, OpenAI Python SDK |
| Design Integration | Figma Plugin API |
| Plugin Language | TypeScript |
| Frontend Build Tools | npm, Next.js |
| Plugin Build Tools | npm, esbuild |
| Backend Server | Uvicorn |

---

## Project Architecture

The repository is organised into three main directories.

```text
text-to-figma/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── logging.py
│   │   │
│   │   ├── data/
│   │   │   └── sample_design.py
│   │   │
│   │   ├── schemas/
│   │   │   └── design_schema.py
│   │   │
│   │   ├── services/
│   │   │   └── design_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── DesignPreview.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── public/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   └── tsconfig.json
│
├── figma-plugin/
│   ├── src/
│   │   ├── builder.ts
│   │   ├── code.ts
│   │   ├── components.ts
│   │   ├── helpers.ts
│   │   └── types.ts
│   │
│   ├── dist/
│   ├── manifest.json
│   ├── ui.html
│   └── package.json
│
├── .gitignore
└── README.md
```

### Backend

The backend is responsible for handling API requests, communicating with the configured AI model, and processing the generated design data.

| File | Responsibility |
|---|---|
| `app/main.py` | Initialises the FastAPI application and application configuration. |
| `app/api/routes.py` | Defines API routes for design generation and related operations. |
| `app/core/config.py` | Manages backend configuration and environment variables. |
| `app/core/logging.py` | Provides application logging functionality. |
| `app/schemas/design_schema.py` | Defines the structured design schema using Pydantic. |
| `app/services/design_service.py` | Handles the design generation service and AI integration. |
| `app/data/sample_design.py` | Contains sample design data. |

### Frontend

The frontend provides the web interface and communicates with the backend.

| File | Responsibility |
|---|---|
| `app/page.tsx` | Main application page. |
| `app/layout.tsx` | Root layout for the Next.js application. |
| `app/globals.css` | Global styling. |
| `components/DesignPreview.tsx` | Renders the generated design preview. |
| `lib/api.ts` | Handles communication with the backend API. |
| `lib/types.ts` | Defines TypeScript types used by the frontend. |

### Figma Plugin

The Figma plugin transforms the structured design representation into Figma elements.

| File | Responsibility |
|---|---|
| `src/code.ts` | Plugin entry point and Figma plugin execution logic. |
| `src/builder.ts` | Builds Figma elements from the design representation. |
| `src/components.ts` | Contains component-building functionality. |
| `src/helpers.ts` | Provides helper utilities for the plugin. |
| `src/types.ts` | Defines TypeScript types for plugin data. |
| `manifest.json` | Defines the plugin manifest and configuration. |
| `ui.html` | Plugin user interface. |

---

## Prerequisites

Before installing the project, ensure that the following software is available:

| Software | Purpose |
|---|---|
| Node.js and npm | Frontend and plugin dependencies and builds. |
| Python 3.10 or later | Backend runtime. |
| Figma Desktop | Running and testing the development plugin. |
| OpenRouter API Key | Accessing the configured AI model. |
| Git | Cloning and managing the repository. |

Check your installed versions:

```bash
node --version
npm --version
python --version
git --version
```

---

## Installation and Setup

The application consists of three separately started components: the backend, frontend, and Figma plugin.

### 1. Clone the Repository

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/Atik-bot/text-to-figma.git

cd text-to-figma
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
```

#### Create a Python Virtual Environment

Windows (Command Prompt):

```cmd
python -m venv .venv

.venv\Scripts\activate
```

Windows (PowerShell):

```powershell
python -m venv .venv

.\.venv\Scripts\Activate.ps1
```

macOS and Linux:

```bash
python3 -m venv .venv

source .venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a local `.env` file using the provided example.

Windows (Command Prompt):

```cmd
copy .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS and Linux:

```bash
cp .env.example .env
```

Open the `.env` file and configure the required values:

```env
APP_NAME=text-to-figma-backend
DEBUG=false
PORT=8000

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=qwen/qwen3-coder:free
```

Replace `your_openrouter_api_key` with your own API key.

Get an API key from:

https://openrouter.ai/keys

The model shown above is the default example configuration. You can change it to another model supported by your OpenRouter account.

Keep your actual `.env` file private. Never upload it to GitHub or share your API key publicly.

### 3. Start the Backend

From the `backend` directory, run:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend should now be accessible at:

| Resource | URL |
|---|---|
| Backend server | http://127.0.0.1:8000 |
| Health check | http://127.0.0.1:8000/health |
| Interactive API documentation | http://127.0.0.1:8000/docs |

Verify that the health endpoint responds:

```json
{
  "status": "ok"
}
```

Keep the backend terminal running while using the frontend.

### 4. Configure the Frontend

Open a new terminal window.

Navigate to the frontend directory from the project root:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Open the application in your browser:

http://localhost:3000

The frontend communicates with the FastAPI backend at:

```text
http://127.0.0.1:8000
```

If your backend runs on a different address or port, ensure the frontend API configuration in `frontend/lib/api.ts` matches the backend URL.

### 5. Build the Figma Plugin

Open another terminal window.

Navigate to the plugin directory:

```bash
cd figma-plugin
```

Install the plugin dependencies:

```bash
npm install
```

Build the plugin:

```bash
npm run build
```

This runs the configured plugin build process and generates the bundled plugin code in the `dist` directory.

The build process uses TypeScript and esbuild.

If the build fails, review the terminal output for TypeScript errors or missing dependencies.

### 6. Import the Plugin into Figma

The plugin can be imported into Figma Desktop as a development plugin.

1. Open the Figma Desktop application.
2. Open a Figma design file.
3. Open the Figma menu and navigate to Plugins.
4. Select the development plugin option.
5. Choose **Import plugin from manifest...**
6. Navigate to your local project directory.
7. Select `figma-plugin/manifest.json`.
8. Run the imported Text-to-Figma Generator plugin.

After the plugin is imported, it should be available in the development plugins menu.

Rebuild the plugin after making changes to its TypeScript source files.

---

## Usage

Follow these steps to generate and transfer a UI design.

### Step 1: Start the Backend

Start the FastAPI backend:

```bash
cd backend

uvicorn app.main:app --reload --port 8000
```

### Step 2: Start the Frontend

In a separate terminal:

```bash
cd frontend

npm run dev
```

Open:

http://localhost:3000

### Step 3: Enter a Design Prompt

Enter a natural language description of the UI you want to create.

Example:

```text
Create a modern dashboard for a project management
application with a sidebar, project statistics,
task cards, and a recent activity section.
```

You can describe the desired interface, its main sections, and the UI components you want to include.

### Step 4: Generate and Preview the Design

Submit the prompt through the frontend.

The application sends the request to the backend, which communicates with the configured AI model and processes the generated design structure.

Review the generated design in the preview interface.

### Step 5: Transfer the Design into Figma

Open the Text-to-Figma Generator development plugin in Figma.

Use the generated design data through the plugin workflow to create the corresponding editable elements on the Figma canvas.

The generated elements can then be reviewed and customised using Figma's native editing tools.

---

## API Reference

The backend exposes API endpoints through FastAPI.

Interactive API documentation is available at:

http://127.0.0.1:8000/docs

### Generate Design

Generates a structured UI design from a natural language prompt.

| Property | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/generate` |
| Content-Type | `application/json` |

#### Request

```json
{
  "prompt": "Create a modern dashboard for a project management application"
}
```

#### Request Fields

| Field | Type | Description |
|---|---|---|
| `prompt` | String | Natural language description of the desired UI design. |

The endpoint processes the prompt and returns a design object following the project's `DesignSchema`.

The precise response fields are defined by the backend's Pydantic schema.

### Health Check

Checks whether the backend is running.

| Property | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/health` |

Example response:

```json
{
  "status": "ok"
}
```

---

## Development Commands

### Frontend

Run these commands from the `frontend` directory.

| Command | Description |
|---|---|
| `npm install` | Install frontend dependencies. |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build the frontend for production. |
| `npm run start` | Start the production server after building. |
| `npm run lint` | Run the configured linting process. |

### Figma Plugin

Run these commands from the `figma-plugin` directory.

| Command | Description |
|---|---|
| `npm install` | Install plugin dependencies. |
| `npm run build` | Build and bundle the plugin. |
| `npm run typecheck` | Run TypeScript type checking. |

### Backend

Run these commands from the `backend` directory.

| Command | Description |
|---|---|
| `pip install -r requirements.txt` | Install Python dependencies. |
| `uvicorn app.main:app --reload --port 8000` | Start the backend development server. |

---

## Environment Variables

The backend uses environment variables for application configuration and AI integration.

| Variable | Description | Example |
|---|---|---|
| `APP_NAME` | Backend application name. | `text-to-figma-backend` |
| `DEBUG` | Debug configuration. | `false` |
| `PORT` | Configured backend port. | `8000` |
| `OPENROUTER_API_KEY` | OpenRouter API key. | `your_openrouter_api_key` |
| `OPENROUTER_MODEL` | OpenRouter model identifier. | `qwen/qwen3-coder:free` |

These values should be configured in `backend/.env`.

The `.env.example` file provides a template for local configuration and can be committed to the repository.

---

## Troubleshooting

### Backend Connection Error

**Problem:** The frontend cannot connect to the backend.

**Possible solutions:**

- Ensure the FastAPI server is running.
- Confirm that the backend is accessible at `http://127.0.0.1:8000`.
- Check the backend URL configured in `frontend/lib/api.ts`.
- Check the backend terminal for errors.

### OpenRouter API Error

**Problem:** The backend cannot generate a design using the configured AI model.

**Possible solutions:**

- Verify that your OpenRouter API key is valid.
- Ensure the key is configured in `backend/.env`.
- Check whether the selected model is available to your account.
- Review API usage limits and available credits.
- Check the backend logs for API errors.

### Figma Plugin Does Not Appear

**Problem:** The plugin is not visible in Figma.

**Possible solutions:**

- Ensure you are using Figma Desktop.
- Verify that the correct `figma-plugin/manifest.json` file was imported.
- Run `npm run build` inside the `figma-plugin` directory.
- Check for build errors and verify that the configured plugin entry point exists.

### Design Generation Fails

**Problem:** The design generation request fails or returns invalid output.

**Possible solutions:**

- Verify that the backend is running.
- Check the OpenRouter API configuration.
- Review the backend logs for validation errors.
- Ensure the generated response follows the expected `DesignSchema`.
- Check the browser console for frontend errors.

### Port Already in Use

**Problem:** The backend cannot start because port `8000` is already occupied.

**Possible solutions:**

- Stop the application using the port.
- Configure an alternative backend port.
- Update the frontend API configuration to use the new backend address.

---

## Security

Follow these practices when running or contributing to the project:

- Store API keys in environment variables.
- Never commit your actual `.env` file.
- Keep `.env.example` limited to placeholder credentials.
- Avoid sharing API credentials in screenshots, logs, or public repositories.
- Keep Python and Node.js dependencies updated.
- Review third-party dependencies before introducing them into the project.
- Do not expose private API credentials in frontend code or browser-accessible configuration.

The OpenRouter API key should be used by the backend rather than embedded in the public frontend.

---

## Future Improvements

Potential directions for extending the project include:

- Support for additional AI models and providers.
- Expanded UI component libraries and design templates.
- Improved design generation accuracy and layout consistency.
- More advanced design customisation options.
- Enhanced Figma component and Auto Layout support.
- Improved handling of complex UI structures.
- Additional export and design integration capabilities.

These are potential improvements and are not necessarily implemented in the current version.

---

## License

This project is currently provided without a specified open-source license.

Unless a license is added to the repository, the project should not be assumed to be available for unrestricted reuse, modification, or redistribution.

Add a `LICENSE` file if you intend to distribute the project under an open-source license.
