import { defineEnvVars } from '@sveltejs/kit/env';

// Environment variables the app uses. Values come from .env.local (written by `npx convex dev`)
// or from your hosting provider's settings when deployed.
export const variables = defineEnvVars({
	PUBLIC_CONVEX_URL: {
		public: true,
		static: true,
		description: 'URL of the Convex backend, e.g. https://happy-animal-123.convex.cloud'
	}
});
