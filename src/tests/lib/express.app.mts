import { assert } from "chai";
import { describe } from "mocha";
import { ActionHookType, ActionRouter } from "zes-action-router";
import { HttpConnector } from "zes-connector";
import { ExpressApp } from "../../lib/express.app.mjs";
import { StartupInfo } from "../../lib/startup.info.mjs";
import { TestBeforeHook, testRouter } from "./test.router.js";

export function expressTests() {
    describe(`express.app test`, () => {
        const startupInfo: StartupInfo = {
            name: "test",
            host: "localhost",
            port: 3000,
        }
        let token = "";
        let app: ExpressApp;
        const http = new HttpConnector("http://localhost:3000");
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
        it(`/test/two should return 401`, async () => {
            await http.get<{ message: string }>(`/test/two`, { message: "hello" })
                .then(() => {
                    assert.fail(`never succ`);
                })
                .catch(err => {
                    assert.equal(err.response.status, 401);
                });
        });
        it(`get token`, async () => {
            const ret = await http.get<{ token: string }>(`/test/token`, { message: "hello" });
            token = ret.token;
            http.setAuth(token);
        });
        it(`/test/two should return succ`, async () => {
            const ret = await http.get<{ message: string }>(`/test/two`, { message: "hello2" });
            assert.equal(ret.message, "hello2");
        });
    });
}