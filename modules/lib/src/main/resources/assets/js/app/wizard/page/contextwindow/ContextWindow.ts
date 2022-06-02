import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {LiveEditPageProxy} from '../LiveEditPageProxy';
import {LiveFormPanel} from '../LiveFormPanel';
import {InspectionsPanel} from './inspect/InspectionsPanel';
import {BaseInspectionPanel} from './inspect/BaseInspectionPanel';
import {InsertablesPanel} from './insert/InsertablesPanel';
import {PageComponentsView} from '../../PageComponentsView';
import {InspectEvent} from '../../../event/InspectEvent';
import {NamedPanel} from './inspect/NamedPanel';
import {PageMode} from '../../../page/PageMode';
import {PageInspectionPanel} from './inspect/page/PageInspectionPanel';
import {TabBarItem} from '@enonic/lib-admin-ui/ui/tab/TabBarItem';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {DockedPanel} from '@enonic/lib-admin-ui/ui/panel/DockedPanel';

export interface ContextWindowConfig {

    liveEditPage: LiveEditPageProxy;

    liveFormPanel: LiveFormPanel;

    inspectionPanel: InspectionsPanel;

    insertablesPanel: InsertablesPanel;
}

export class ContextWindow
    extends DockedPanel {

    private insertablesPanel: InsertablesPanel;

    private inspectionsPanel: InspectionsPanel;

    private liveFormPanel: LiveFormPanel;

    private inspectTab: TabBarItem;

    constructor(config: ContextWindowConfig) {
        super();
        this.liveFormPanel = config.liveFormPanel;
        this.inspectionsPanel = config.inspectionPanel;
        this.insertablesPanel = config.insertablesPanel;

        this.onRemoved(() => {
            ResponsiveManager.unAvailableSizeChanged(this);
            ResponsiveManager.unAvailableSizeChanged(this.liveFormPanel);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.addClass('context-window');

            this.addItem(i18n('action.insert'), false, this.insertablesPanel);
            this.addItem(this.getShownPanelName(), false, this.inspectionsPanel);
            const tabItems = this.getItems();
            this.inspectTab = tabItems[tabItems.length - 1];
            this.inspectTab.addClass('inspect-tab');

            return rendered;
        });
    }

    getComponentsView(): PageComponentsView {
        return this.insertablesPanel.getComponentsView();
    }

    private isPanelSelectable(panel: Panel): boolean {
        return !ObjectHelper.iFrameSafeInstanceOf(panel, PageInspectionPanel) || this.liveFormPanel.getPageMode() !== PageMode.FRAGMENT;
    }

    public showInspectionPanel(panel: BaseInspectionPanel, showWidget: boolean, showPanel: boolean, keepPanelSelection: boolean = false) {
        const canSelectPanel = this.isPanelSelectable(panel);
        this.toggleClass('no-inspection', !canSelectPanel);
        if (canSelectPanel) {
            new InspectEvent(showWidget, showPanel).fire();
            setTimeout(() => {
                this.inspectionsPanel.showInspectionPanel(panel);
                if (this.inspectTab) {
                    this.inspectTab.setLabel(panel.getName());
                }
                if (!keepPanelSelection) {
                    this.selectPanel(this.inspectionsPanel);
                }
            });
        }
    }

    public clearSelection(showInsertables?: boolean) {
        this.inspectionsPanel.clearInspection();

        const isPageInspectionPanelSelectable = this.isPanelSelectable(this.inspectionsPanel.getPanelShown());
        this.toggleClass('no-inspection', !isPageInspectionPanelSelectable);

        if (this.inspectTab) {
            this.inspectTab.setLabel(this.getShownPanelName());

            const selectDefault = !isPageInspectionPanelSelectable && this.inspectTab.isActive();
            if (showInsertables || selectDefault) {
                this.selectPanel(this.insertablesPanel);
            }
        }
    }

    private getShownPanelName(): string {
        const shownPanel = this.inspectionsPanel ? this.inspectionsPanel.getPanelShown() : null;
        return ObjectHelper.iFrameSafeInstanceOf(shownPanel, NamedPanel) ?
               (<NamedPanel>shownPanel).getName() :
               i18n('live.view.inspect');
    }

    isLiveFormShown(): boolean {
        return this.liveFormPanel.isVisible();
    }
}
