import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response, Router } from "express";
import { Server } from "http";
import { connectLogger, getLogger } from "log4js";
import { AppServer } from "./app.server";
import { StartupInfo } from "./startup.info";

export class ExpressApp {
    constructor(
        startupInfo: StartupInfo
    ) {
        this.name = startupInfo.name || "anonymous";
        this.app.use(connectLogger(getLogger(`access`), { level: 'info' }));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());
        this.app.use(express.static(startupInfo.staticPath || "./public"));
        this.app.use("/", this.root);
        this.app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
            if (err) {
                logger.error(`${err}`);
                logger.error(`stack: ${err?.stack}`);
                const statusCode: number = (<{ status: number }><unknown>err).status || 500;
                res.status(statusCode).send(`internal server error !`);
            } else {
                next();
            }
        });
        this.http = this.app.listen(startupInfo.port || 3000, startupInfo.host);
    }

    public readonly app = express();
    public readonly name: string;
    private readonly http: Server;
    private readonly root = Router();
    private servers: AppServer[] = [];

    public async addServer(server: AppServer) {
        this.servers.push(server);
        await server.open(this);
    }

    public close() {
        this.servers.forEach(i => i.close());
        this.http.close();
    }
}

const logger = getLogger(ExpressApp.name);
