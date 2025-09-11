# MMM-HK-Transport-ETA-Configurator

This project is a configurator for the MMM-HK-Transport-ETA MagicMirror module, built with Astro and Svelte.

## Project Structure

This project follows a standard Astro project structure. Key files and directories include:

- `src/`: Contains Astro pages, Svelte components, styles, and utilities.
- `public/`: Static assets, including external data and scripts.
- `astro.config.mjs`: Astro configuration, including the base path for deployment.
- `.github/workflows/deploy.yml`: GitHub Actions workflow for deployment to GitHub Pages.

## Configuration

### Astro Configuration

The `astro.config.mjs` file has been updated to include a `base` path for deployment to GitHub Pages. This ensures correct asset loading when hosted in a sub-directory.

```javascript
export default defineConfig({
	base: '/MMM-HK-Transport-ETA-Configurator/',
	// ... other configurations
});
```

### Git Ignore

The `.gitignore` file has been updated to exclude generated files and specific public directories:

- `/dist`
- `/.astro`
- `/node_modules`
- `/pnpm-lock.yaml`
- `/package-lock.json`
- `/public/external`
- `/public/scripts/providers`

## Deployment

This project uses GitHub Actions to deploy to GitHub Pages. The workflow is defined in `.github/workflows/deploy.yml`.

### GitHub Actions Permissions

To ensure the GitHub Actions bot has the necessary permissions to push to the `gh-pages` branch, the `deploy.yml` workflow includes `permissions: contents: write`:

```yaml
on:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  # ...
```

### GitHub Pages Settings

After a successful build, ensure your repository's GitHub Pages settings are configured to deploy from **GitHub Actions**.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).