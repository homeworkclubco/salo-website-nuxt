# Salo Website - Nuxt Frontend

A Nuxt.js frontend that integrates with Payload CMS backend, deployed on Cloudflare Pages with hybrid static/dynamic rendering.

## Features

- **Static Generation**: Most pages are pre-rendered at build time for optimal performance
- **Dynamic Preview Routes**: `/preview/*` routes remain dynamic for Payload CMS live preview
- **Payload CMS Integration**: Fetches content from deployed backend API
- **Cloudflare Pages Deployment**: Optimized for Cloudflare's edge network

## Setup

Make sure to install dependencies:

```bash
# pnpm (recommended)
pnpm install

# npm
npm install

# yarn
yarn install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `NUXT_PUBLIC_PAYLOAD_URL`: Your Payload CMS backend URL
  - Development: `http://localhost:3000`
  - Production: `https://your-backend-url.com`

## Development

Start the development server on `http://localhost:3001`:

```bash
pnpm dev
```

## Production Build

Build and deploy to Cloudflare Workers:

```bash
# Build the application
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy
```

For local testing:
```bash
pnpm preview
```

## Deployment Configuration

1. Update `wrangler.toml` with your actual backend URL
2. Set environment variables in Cloudflare Pages dashboard
3. Deploy using the deploy script

## Architecture

- **Static Pages**: Homepage and content pages are pre-rendered
- **Dynamic Preview**: `/preview/pages/[id]` routes stay dynamic for live preview
- **API Integration**: Uses `usePayloadAPI` composable for backend communication
