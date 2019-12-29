import {NavigatedAppPanel} from 'lib-admin-ui/app/NavigatedAppPanel';
import {SettingsBrowsePanel} from './browse/SettingsBrowsePanel';
import {SettingsAppBar} from './SettingsAppBar';
import {ShowBrowsePanelEvent} from 'lib-admin-ui/app/ShowBrowsePanelEvent';
import {SettingsItem} from './data/SettingsItem';
import {NewProjectEvent} from './event/NewProjectEvent';
import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {AppBarTabMenuItem, AppBarTabMenuItemBuilder} from 'lib-admin-ui/app/bar/AppBarTabMenuItem';
import {ProjectWizardPanel} from './wizard/ProjectWizardPanel';
import {ContentUnnamed} from 'lib-admin-ui//content/ContentUnnamed';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectItem} from './data/ProjectItem';
import {TabMenuItem} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {EditSettingsItemEvent} from './event/EditSettingsItemEvent';
import {SettingsItemWizardPanel} from './wizard/SettingsItemWizardPanel';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class SettingsAppPanel
    extends NavigatedAppPanel<SettingsItem> {

    constructor(appBar: SettingsAppBar) {
        super(appBar);

        this.route();
    }

    private route() {
        new ShowBrowsePanelEvent().fire();
    }

    protected createBrowsePanel(): SettingsBrowsePanel {
        return new SettingsBrowsePanel();
    }

    protected handleGlobalEvents() {
        super.handleGlobalEvents();

        NewProjectEvent.on(() => {
            this.handleNewProject();
        });

        EditSettingsItemEvent.on((event: EditSettingsItemEvent) => {
            this.handleItemEdit(event.getItems());
        });
    }

    protected handleBrowse() {
        super.handleBrowse();

        this.getAppBarTabMenu().deselectNavigationItem();
    }

    private handleNewProject() {
        const tabId: AppBarTabId = AppBarTabId.forNew('project');
        const tabMenuItem: AppBarTabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

        if (tabMenuItem != null) {
            this.selectPanel(tabMenuItem);
        } else {
            const wizard: ProjectWizardPanel = new ProjectWizardPanel({tabId});
            const tabMenuItem: AppBarTabMenuItem = new AppBarTabMenuItemBuilder()
                .setLabel(ContentUnnamed.prettifyUnnamed(i18n('settings.items.type.project')))
                .setTabId(wizard.getTabId())
                .setCloseAction(wizard.getCloseAction())
                .build();

            this.addWizardPanel(tabMenuItem, wizard);
        }
    }

    private handleItemEdit(items: SettingsItem[]) {
        items.forEach((item: SettingsItem) => {
            const tabId: AppBarTabId = AppBarTabId.forEdit(item.getId());
            const tabMenuItem: TabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

            if (tabMenuItem != null) {
                this.selectPanel(tabMenuItem);
            } else {
                const wizard: SettingsItemWizardPanel<SettingsItem> = this.getWizardPanelFor(item, tabId);
                const tabMenuItem: AppBarTabMenuItem = new AppBarTabMenuItemBuilder()
                    .setLabel(item.getDisplayName())
                    .setTabId(wizard.getTabId())
                    .setCloseAction(wizard.getCloseAction())
                    .build();

                this.addWizardPanel(tabMenuItem, wizard);
            }
        });
    }

    getWizardPanelFor(item: SettingsItem, tabId: AppBarTabId): SettingsItemWizardPanel<SettingsItem> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectItem)) {
            return new ProjectWizardPanel({tabId, persistedItem: <ProjectItem>item});
        }

        return null;
    }
}
