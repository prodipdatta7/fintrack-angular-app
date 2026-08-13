export const environment = {
    production: true,
    /**
     * Same-origin `/api` — Firebase Hosting (or nginx) rewrites `/api/**` to Cloud Run.
     * Avoids CORS and keeps auth cookies as SameSite=Lax.
     */
    apiUrl: '/api',
};
