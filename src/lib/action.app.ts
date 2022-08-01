import { ExpressServer } from "./express.server";

export interface ActionApp {
    open(app: ExpressServer): Promise<void>;
    close(): void;
}