import { assert } from "chai";
import log4js from "log4js";
import "reflect-metadata";
import { injectable } from "tsyringe";
import { ActionHook, ActionHookContext, ActionHookType, ActionProcessor, ActionRouter, ActionRouting } from "zes-action-router";
import { HttpConnector } from "zes-connector";
import { ExpressApp } from "../lib/express.app.mjs";
import { StartupInfo } from "../lib/startup.info.mjs";

log4js.configure("./log4js-test.json");

const startupInfo: StartupInfo = {
    name: "test",
    host: "localhost",
    port: 3000,
}

@injectable()
class TestProcess implements ActionProcessor {
    async process(message: string): Promise<{ message: string }> {
        return { message };
    }
}

@injectable()
class TestProcess2 implements ActionProcessor {
    async process(test: string, hookValue: string): Promise<{ message: string, hookValue: string }> {
        return { message: test, hookValue };
    }
}

class TestBeforeHook implements ActionHook {
    hook(context: ActionHookContext, args: unknown): unknown {
        return Object.assign(args as object, { hookValue: "hook" });
    }
}

const testRouter: ActionRouting[] = [
    { path: "one", token: TestProcess, option: { security: false } },
    { path: "two", token: TestProcess },
    { path: "three", token: TestProcess },
    {
        path: "fold", token: [
            { path: "one", token: TestProcess },
            { path: "two", token: TestProcess2, option: { security: false } },
            { path: "three", token: TestProcess },
        ]
    },
    {
        path: "fold/fold", token: [
            { path: "one", token: TestProcess },
            { path: "two", token: TestProcess2, option: { security: false } },
            { path: "three", token: TestProcess },
        ]
    },
];

let app: ExpressApp;
const http = new HttpConnector("http://localhost:3000");

describe(`express.action.app`, () => {
    before(async () => {
        http.open();
        app = new ExpressApp(startupInfo);
        const actions = new ActionRouter(testRouter);
        actions.hook(ActionHookType.before, new TestBeforeHook());
        app.addRouter("/test", actions, "111111");
        await app.open();
    });
    after(() => {
        app.close();
    });

    it(`/test/one should return hello`, async () => {
        const ret = await http.get<{ message: string }>(`/test/one`, { message: "hello" });
        assert.equal(ret.message, "hello");
    });
    it(`/test/fold/two should return test`, async () => {
        const ret = await http.post<{ message: string }>(`/test/fold/two`, { test: "test" });
        assert.equal(ret.message, "test");
    });
    it(`/test/fold/two should have hook value`, async () => {
        const ret = await http.post<{ hookValue: string }>(`/test/fold/two`, { test: "test" });
        assert.equal(ret.hookValue, "hook");
    });
}); 