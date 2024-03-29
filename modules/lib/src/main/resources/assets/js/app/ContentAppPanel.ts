import {ContentBrowsePanel} from './browse/ContentBrowsePanel';
import {AppPanel} from '@enonic/lib-admin-ui/app/AppPanel';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

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
        return this.browsePanel as ContentBrowsePanel;
    }

    protected resolveActions(panel: Panel): Action[] {
        const actions = super.resolveActions(panel);
        return [...actions, ...this.getBrowsePanel().getNonToolbarActions(), this.getBrowsePanel().getToggleSearchAction()];
    }
}
