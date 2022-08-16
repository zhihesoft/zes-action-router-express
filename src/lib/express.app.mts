import cookieParse from "cookie-parser";
import express, { Express, NextFunction, Request, Response, Router } from "express";
import { Server } from "http";
import logj from "log4js";
import { ActionRouter } from "zes-action-router";
import { ActionApp } from "./action.app.mjs";
import { StartupInfo } from "./startup.info.mjs";
import { expressjwt } from "express-jwt";

export class ExpressApp implements ActionApp {
    constructor(
        public startupInfo: StartupInfo
    ) { }

    private _app: Express | undefined;
    private _server: Server | undefined;
    private _root = Router();

    get name() { return this.startupInfo.name ?? "anonymous"; }
    get app(): Express {
        if (!this._app) {
            throw new Error(`app not initialized`);
        }
        return this._app;
    }
    get root() { return this._root; }
    get server(): Server {
        if (!this._server) {
            throw new Error(`server is not initialized.`);
        }
        return this._server;
    }

    async open(): Promise<boolean> {
        this._app = express();
        this.app.use(logj.connectLogger(logj.getLogger(`access`), { level: 'info' }));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParse());
        this.app.use(express.static(this.startupInfo.staticPath ?? "./public"));
        await this.opening();
        this.app.use("/", this._root);
        this.app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
            if (err) {
                logger.error(`${err}`);
                const statusCode: number = (err as { status: number }).status ?? 500;
                res.status(statusCode).send(`internal server error`);
            } else {
                next();
            }
        });
        this._server = this.app.listen(this.startupInfo.port ?? 3000, this.startupInfo.host);
        logger.debug(`express ${this.name} started on ${this.startupInfo.host}:${this.startupInfo.port ?? 3000}`);
        return true;
    }

    close(): void {
        this._server?.close();
        this._server = undefined;
    }

    addRouter(basePath: string, actions: ActionRouter): void;
    addRouter(basePath: string, actions: ActionRouter, secret: string): void;
    addRouter(basePath: string, actions: ActionRouter, secret?: string): void {

        const paths = actions.getPaths();
        const router = Router();
        if (secret) {
            const ipaths = actions.getInsecurityPaths();
            router.use(
                expressjwt({ secret, algorithms: ["HS256"] })
                    .unless({ path: ipaths, useOriginalUrl: false })
            );
        }

        for (const path of paths) {
            logger.debug(`register path ${path}`);
            const meta = actions.getOption(path);
            const verb = meta?.verb ?? "ANY";
            let fun = router.use;
            if (verb == "GET") {
                fun = router.get;
            } else if (verb == "POST") {
                fun = router.post;
            }
            fun.bind(router)(path, this.process(path, actions));
        }
        this.root.use(basePath, router);
    }

    protected async opening(): Promise<boolean> {
        return true;
    }

    private process(path: string, actions: ActionRouter): (req: Request, resp: Response) => void {
        return async (req, resp) => {
            const args = Object.assign({}, req.query, req.body);
            logger.debug(`req: ${path} ${args}`);
            args.__req = req;
            try {
                const ret = await actions.process(path, args);
                if (typeof ret === "string") {
                    resp.send(ret)
                } else {
                    resp.json(ret);
                }
            } catch (err) {
                logger.error(`${path} ${err}`);
                const codeError = err as { code: number, message: string };
                if (codeError.code) {
                    resp.status(500).send({ code: codeError.code, message: codeError.message });
                } else {
                    resp.status(500).send(err);
                }
            }
        }
    }

}

const logger = logj.getLogger(ExpressApp.name);
