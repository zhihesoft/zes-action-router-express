import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response, Router } from "express";
import { Server } from "http";
import { connectLogger, getLogger } from "log4js";
import { ActionApp } from "./action.app";
import { StartupInfo } from "./startup.info";

export class ExpressServer {
    constructor(
        startupInfo: StartupInfo
    ) {
        this.name = startupInfo.name || "anonymous";
        this.express.use(connectLogger(getLogger(`access`), { level: 'info' }));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(cookieParser());
        this.express.use(express.static(startupInfo.staticPath || "./public"));
        this.express.use("/", this.root);
        this.express.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
            if (err) {
                logger.error(`${err}`);
                logger.error(`stack: ${err?.stack}`);
                const statusCode: number = (<{ status: number }><unknown>err).status || 500;
                res.status(statusCode).send(`internal server error !`);
            } else {
                next();
            }
        });
        this.http = this.express.listen(startupInfo.port || 3000, startupInfo.host);
    }

    public readonly name: string;
    public readonly root = Router();

    private readonly express = express();
    private readonly http: Server;
    private apps: ActionApp[] = [];

    public async addApp(app: ActionApp) {
        this.apps.push(app);
        await app.open(this);
    }

    public close() {
        this.apps.forEach(i => i.close());
        this.http.close();
    }
}

const logger = getLogger(ExpressServer.name);
