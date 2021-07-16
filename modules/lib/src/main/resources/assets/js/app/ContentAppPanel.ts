import * as Q from 'q';
import {ContentBrowsePanel} from './browse/ContentBrowsePanel';
import {AppPanel} from 'lib-admin-ui/app/AppPanel';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {Action} from 'lib-admin-ui/ui/Action';
import {ProjectContext} from './project/ProjectContext';

export class ContentAppPanel
    extends AppPanel {

    handleBrowse() {
        super.handleBrowse();
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

    protected activateCurrentKeyBindings(): void {
        if (ProjectContext.get().isInitialized()) {
            super.activateCurrentKeyBindings();
        } else {
            const projectSetHandler = () => {
                super.activateCurrentKeyBindings();
                ProjectContext.get().unProjectChanged(projectSetHandler);
            };
            ProjectContext.get().onProjectChanged(projectSetHandler);
        }
    }
}
