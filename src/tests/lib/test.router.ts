import { injectable } from "tsyringe";
import { ActionHook, ActionHookContext, ActionProcessor, ActionRouting } from "zes-action-router";

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

// @injectable()
// class TestProcessToken implements ActionProcessor {
//     process(): Promise<unknown> {
//         return "";
//     }

// }

export class TestBeforeHook implements ActionHook {
    hook(context: ActionHookContext, args: unknown): unknown {
        return Object.assign(args as object, { hookValue: "hook" });
    }
}

export const testRouter: ActionRouting[] = [
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

