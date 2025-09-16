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

This project is already configured for automatic deployment to GitHub Pages using GitHub Actions.

### GitHub Actions (Recommended)

The project uses GitHub Actions to automatically deploy to GitHub Pages. The workflow is defined in `.github/workflows/static.yml`. This is the recommended deployment method because:

- It's more secure (no personal access tokens required)
- It's automatic (deploys on every push to main branch)
- It's reliable (uses official GitHub Pages actions)

The workflow already:

- Uses pnpm to install dependencies
- Downloads the necessary data and provider scripts
- Builds the site using `pnpm run build`
- Deploys to GitHub Pages using the official GitHub Actions

#### GitHub Pages Settings

After a successful build, ensure your repository's GitHub Pages settings are configured to deploy from **GitHub Actions**.

### Manual Deployment with gh-pages (Alternative)

As an alternative, you can manually deploy to GitHub Pages using the gh-pages package:

1. Run `pnpm run deploy` to build and deploy your site
2. Your site will be available at `https://[your-username].github.io/MMM-HK-Transport-ETA-Configurator/`

Note: For manual deployment, you'll need to configure a personal access token with proper permissions in your repository settings.

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
| `npm run deploy`          | Deploy your site to GitHub Pages                 |

## Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
