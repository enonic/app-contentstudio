import {MainAppContainer} from './MainAppContainer';
import {ContentAppBar} from './bar/ContentAppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {ContentAppPanel} from './ContentAppPanel';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from './browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './browse/ToggleSearchPanelWithDependenciesEvent';
import {ContentEventsListener} from './ContentEventsListener';
import {AppMode} from './AppMode';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';

export class ContentAppContainer
    extends MainAppContainer {

    constructor(application: Application) {
        super(application, AppMode.MAIN);

        this.initSearchPanelListener(<ContentAppPanel>this.appPanel);
        new ContentEventsListener().start();
    }

    protected createAppBar(application: Application): ContentAppBar {
        return new ContentAppBar(application);
    }

    protected createAppPanel(): ContentAppPanel {
        return new ContentAppPanel(this.application.getPath());
    }

    private initSearchPanelListener(panel: ContentAppPanel) {
        ToggleSearchPanelWithDependenciesGlobalEvent.on((event) => {
            if (!panel.getBrowsePanel().getTreeGrid().isEmpty()) {
                new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
            } else {

                const handler = () => {
                    new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
                    panel.getBrowsePanel().getTreeGrid().unLoaded(handler);
                };

                panel.getBrowsePanel().getTreeGrid().onLoaded(handler);
            }
        });
    }

    generateAppUrl(): string {
        return `${AppMode.MAIN}#/${ProjectContext.get().getProject()}/${UrlAction.BROWSE}`;
    }

}
