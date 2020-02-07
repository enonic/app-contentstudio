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
import {SettingsServerEvent} from './settings/event/SettingsServerEvent';

export class ContentAppContainer
    extends MainAppContainer {

    constructor(application: Application) {
        super(application, AppMode.MAIN);

        new ContentEventsListener().start();
        this.initListeners();
    }

    protected createAppBar(application: Application): ContentAppBar {
        return new ContentAppBar(application);
    }

    protected createAppPanel(): ContentAppPanel {
        return new ContentAppPanel(this.application.getPath());
    }

    private initListeners() {
        this.initSearchPanelListener(<ContentAppPanel>this.appPanel);

        SettingsServerEvent.on((event: SettingsServerEvent) => {
            this.handleSettingsServerEvent(event);
        });
    }

    private handleSettingsServerEvent(event: SettingsServerEvent) {
        if (event.isUpdateEvent() || event.isCreateEvent()) {
            this.handleProjectUpdatedEvent();
        } else if (event.isDeleteEvent()) {
            this.handleProjectDeletedEvent(event);
        }
    }

    private handleProjectUpdatedEvent() {
        (<ContentAppBar>this.appBar).updateSelectorValues();
    }

    private handleProjectDeletedEvent(event: SettingsServerEvent) {
        const currentProject: string = ProjectContext.get().getProject();
        const isCurrentProjectDeleted: boolean = event.getItemsIds().some((id: string) => id === currentProject);

        if (isCurrentProjectDeleted) {
            ProjectContext.get().setProject(ProjectContext.DEFAULT_PROJECT);
        }

        (<ContentAppBar>this.appBar).updateSelectorValues();
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
