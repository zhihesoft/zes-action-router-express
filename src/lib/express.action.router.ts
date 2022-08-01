import { Request, Response, Router } from "express";
import { getLogger } from "log4js";
import { ActionRouter, ActionRouting } from "zes-action-router";
import { expressjwt } from "express-jwt";

export class ExpressActionRouter {
    constructor(secret: string, messages: ActionRouting[]) {
        this.engine = new ActionRouter(messages);
        const ipaths = this.engine.getInsecurityPaths();
        this.router.use(expressjwt({ secret, algorithms: ["HS256"] }).unless({ path: ipaths, useOriginalUrl: false }));
        const paths = this.engine.getPaths();
        for (const path of paths) {
            logger.debug(`register path ${path}`);
            const meta = this.engine.getOption(path);
            const verb = meta?.verb || "ANY";
            let fun = this.router.use;
            if (verb == "GET") {
                fun = this.router.get;
            } else if (verb == "POST") {
                fun = this.router.post;
            }
            fun.bind(this.router)(path, this.process(path));
        }
    }

    public readonly router = Router();
    public readonly engine: ActionRouter;

    private process(path: string): (req: Request, resp: Response) => void {
        return async (req, resp) => {
            const args = Object.assign({}, req.query, req.body);
            logger.debug(`req: ${path} ${args}`);
            args.__req = req;
            try {
                const ret = await this.engine.process(path, args);
                if (typeof ret === "string") {
                    resp.send(ret)
                } else {
                    resp.json(ret);
                }
            } catch (err) {
                logger.error(`${path} ${err}`);
                const codeError = <{ code: number, message: string }>err;
                if (codeError.code) {
                    resp.status(500).send({ code: codeError.code, message: codeError.message });
                } else {
                    resp.status(500).send(err);
                }
            }
        }
    }
}

const logger = getLogger(ExpressActionRouter.name);
