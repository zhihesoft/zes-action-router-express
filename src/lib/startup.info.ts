
export interface StartupInfo {
    host: string;               // server host: something like localhost or 127.0.0.1
    name?: string;              // app name
    port?: number;              // server port: default is 3000
    staticPath?: string;        // public path, default is "./public"
}