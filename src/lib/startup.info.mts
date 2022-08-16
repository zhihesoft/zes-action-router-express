
/**
 * Express App Startup Info
 */
export interface StartupInfo {
    /**
     * App Name
     */
    name?: string;
    /**
     * App Host, sample: localhost
     */
    host: string;
    /**
     * App port, default is 3000
     */
    port?: number;
    /**
     * Static path, default is ./public
     */
    staticPath?: string;
}