import { ExpressApp } from "./express.app";

export interface AppServer {
    get path(): string;
    open(app: ExpressApp): Promise<void>;
    close(): void;
}