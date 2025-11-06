# Debate Platform

A simple web application for hosting debates between humans and AI, or between humans with AI evaluation.

## Features

- Human vs AI debates
- Human vs Human debates with AI evaluation
- Real-time argument submission
- Simple RAG implementation for context-aware AI responses
- Clean, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- An NVIDIA API key for accessing AI models

## Setup

1. Clone the repository
2. Navigate to the `backend` directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the `backend` directory with your NVIDIA API key:
   ```
   NVIDIA_API_KEY=your_nvidia_api_key_here
   PORT=3000
   ```
5. Start the server:
   ```
   npm start
   ```
   or for development:
   ```
   npm run dev
   ```

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Enter your name
3. Choose to create a new debate or join an existing one
4. For new debates, select a topic and debate mode (Human vs AI or Human vs Human)
5. In Human vs AI mode, the AI will automatically respond to your arguments
6. In Human vs Human mode, share the debate ID with another person to join
7. Submit arguments and see AI evaluations in Human vs Human mode

## Project Structure

- `backend/` - Express.js server with NVIDIA API integration
- `frontend/` - Simple HTML/CSS/JS frontend

## Implementation Details

The RAG (Retrieval-Augmented Generation) implementation uses a simple keyword-based approach for demonstration purposes. In a production environment, this would be replaced with a proper vector database for semantic search.