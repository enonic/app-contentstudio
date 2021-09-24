import {i18n} from 'lib-admin-ui/util/Messages';
import {App} from './App';
import {AppContainer} from './AppContainer';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';
import {ContentAppContainer} from './ContentAppContainer';
import {DescriptorKey} from './page/DescriptorKey';

export class ContentApp extends App {

    constructor() {
        super(DescriptorKey.fromString(`${CONFIG.appId}:main`));
    }

    protected createAppContainer(): AppContainer {
        return new ContentAppContainer();
    }

    getIconClass(): string {
        return 'icon-version-modified';
    }

    getDisplayName(): string {
        return i18n('app.content');
    }

}
