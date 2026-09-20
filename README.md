# Repo Explainer
Interactive architecture explanations for GitHub repos.

[![CI](https://github.com/mde/ejs/actions/workflows/ci.yml/badge.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](#)

*Demo GIF Placeholder*

## Features
- Dependency Graph with cyclic dependency detection
- AI-Powered Explanations for Repos and Files
- Automatic Tech Stack Detection

## Architecture
```mermaid
graph LR
    A[Web React] --> B[Fastify API]
    B --> C[GitHub Octokit]
    B --> D[Anthropic LLM]
    B --> E[SQLite Cache]
```

## Quick Start
1. `cp .env.example .env` and add API keys.
2. `docker compose up` OR `npm install && npm run dev`
