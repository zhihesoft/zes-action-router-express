import { ActionRouter } from "zes-action-router";

export interface ActionApp {
    /**
     * Open the action app
     */
    open(): Promise<boolean>;

    /**
     * Close the action app
     */
    close(): void;

    /**
     * Add one router to app
     * @param path path of router
     * @param actions actions
     */
    addRouter(path: string, actions: ActionRouter): void;
}