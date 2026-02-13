import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationViewer} from '@enonic/lib-admin-ui/application/ApplicationViewer';

export class SiteConfiguratorListBox
    extends LazyListBox<Application> {

    constructor() {
        super('site-configurator-list-box');
    }

    protected createItemView(item: Application, readOnly: boolean): ApplicationViewer {
        const viewer = new ApplicationViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: Application): string {
        return item.getApplicationKey().toString();
    }

    protected getScrollContainer(): Element {
        return this;
    }
}
