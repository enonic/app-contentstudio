import {AppContainer} from './AppContainer';
import {DescriptorKey} from './page/DescriptorKey';

export abstract class App {

    protected appId: DescriptorKey;

    protected appContainer: AppContainer;

    protected constructor(name: string) {
        this.appId = DescriptorKey.fromString(`${CONFIG.appId}:${name}`);
    }

    getAppId(): DescriptorKey {
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

    protected abstract createAppContainer(): AppContainer;

    abstract generateAppUrl(): string;

    abstract getIconName(): string;
}
