import {ContentBrowsePanel} from './browse/ContentBrowsePanel';
import {AppPanel} from 'lib-admin-ui/app/AppPanel';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {Action} from 'lib-admin-ui/ui/Action';

export class ContentAppPanel
    extends AppPanel {

    constructor() {
        super('content-app-panel');

        this.setDoOffset(false); // will set in css since a toolbar has a static height
    }

    protected createBrowsePanel() {
        return new ContentBrowsePanel();
    }

    getBrowsePanel(): ContentBrowsePanel {
        return <ContentBrowsePanel>this.browsePanel;
    }

    protected resolveActions(panel: Panel): Action[] {
        const actions = super.resolveActions(panel);
        return [...actions, ...this.getBrowsePanel().getNonToolbarActions()];
    }
}
