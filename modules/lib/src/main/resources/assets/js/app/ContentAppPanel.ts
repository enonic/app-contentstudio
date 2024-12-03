import {ContentBrowsePanel} from './browse/ContentBrowsePanel';
import {AppPanel} from '@enonic/lib-admin-ui/app/AppPanel';

export class ContentAppPanel
    extends AppPanel {

    constructor() {
        super('content-app-panel');

        this.setDoOffset(false); // will set in css since a toolbar has a static height
    }

    protected createBrowsePanel() {
        return new ContentBrowsePanel();
    }

}
