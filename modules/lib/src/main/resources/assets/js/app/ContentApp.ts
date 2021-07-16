import {i18n} from 'lib-admin-ui/util/Messages';
import {App} from './App';
import {AppContainer} from './AppContainer';
import {AppId} from './AppId';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';
import {ContentAppContainer} from './ContentAppContainer';
import {ContentAppId} from './ContentAppId';

export class ContentApp extends App {

    constructor() {
        super();
    }

    protected createAppContainer(): AppContainer {
        return new ContentAppContainer();
    }

    protected createAppId(): AppId {
        return new ContentAppId();
    }

    generateAppUrl(): string {
        return `${this.appId.getId()}#/${ProjectContext.get().getProject().getName()}/${UrlAction.BROWSE}`;
    }

    getIconClass(): string {
        return 'icon-version-modified';
    }

    getIconName(): string {
        return i18n('app.content');
    }

}
