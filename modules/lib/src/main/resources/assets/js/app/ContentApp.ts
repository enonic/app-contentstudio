import {i18n} from 'lib-admin-ui/util/Messages';
import {App} from './App';
import {AppContainer} from './AppContainer';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';
import {ContentAppContainer} from './ContentAppContainer';

export class ContentApp extends App {

    constructor() {
        super('main');
    }

    protected createAppContainer(): AppContainer {
        return new ContentAppContainer();
    }

    generateAppUrl(): string {
        return `${this.appId.getName().toString()}#/${ProjectContext.get().getProject().getName()}/${UrlAction.BROWSE}`;
    }

    getIconName(): string {
        return i18n('app.content');
    }

}
