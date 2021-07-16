import {AppId} from './AppId';
import {AppContainer} from './AppContainer';

export abstract class App {

    protected appId: AppId;

    protected appContainer: AppContainer;

    constructor() {
        this.appId = this.createAppId();
    }

    getAppId(): AppId {
        return this.appId;
    }

    getAppContainer(): AppContainer {
        if (!this.appContainer) {
            this.appContainer = this.createAppContainer();
        }

        return this.appContainer;
    }

    show() {
        this.appContainer?.show();
    }

    hide() {
        this.appContainer?.hide();
    }

    protected abstract createAppId(): AppId;

    protected abstract createAppContainer(): AppContainer;

    abstract generateAppUrl(): string;

    abstract getIconName(): string;

    abstract getIconClass(): string;
}
