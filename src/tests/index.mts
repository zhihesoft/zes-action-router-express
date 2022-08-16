import "reflect-metadata";
import log4js from "log4js";
import { expressTests } from "./lib/express.app.mjs";

log4js.configure("./log4js-test.json");

describe(`zes.action.router.express test suit`, () => {
    expressTests();
}); 