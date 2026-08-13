export const environment = {
    production: false,
    /**
     * Relative `/api` works with `src/proxy.conf.json` during `ng serve`
     * (proxied to http://localhost:5000) so local and cloud use the same path shape.
     */
    apiUrl: '/api',
};
