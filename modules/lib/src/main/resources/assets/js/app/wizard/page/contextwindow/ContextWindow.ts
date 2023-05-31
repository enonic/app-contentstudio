import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {LiveFormPanel} from '../LiveFormPanel';
import {InspectionsPanel} from './inspect/InspectionsPanel';
import {BaseInspectionPanel} from './inspect/BaseInspectionPanel';
import {InsertablesPanel} from './insert/InsertablesPanel';
import {InspectEvent} from '../../../event/InspectEvent';
import {NamedPanel} from './inspect/NamedPanel';
import {PageMode} from '../../../page/PageMode';
import {PageInspectionPanel} from './inspect/page/PageInspectionPanel';
import {TabBarItem} from '@enonic/lib-admin-ui/ui/tab/TabBarItem';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {DockedPanel} from '@enonic/lib-admin-ui/ui/panel/DockedPanel';
import {NavigatedDeckPanel} from '@enonic/lib-admin-ui/ui/panel/NavigatedDeckPanel';

export interface ContextWindowConfig {

    liveFormPanel: LiveFormPanel;

    inspectionPanel: InspectionsPanel;

    insertablesPanel: InsertablesPanel;
}

export type InspectParameters = {
    panel: BaseInspectionPanel;
    showWidget: boolean;
    showPanel: boolean;
    keepPanelSelection?: boolean;
    silent?: boolean;
};

const DefaultInspectParameters = {
    keepPanelSelection: false,
    silent: false
};

export const getInspectParameters = function (params: InspectParameters): InspectParameters {
    return <InspectParameters>Object.assign({}, DefaultInspectParameters, params);
};

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

        this.initListeners();
    }

    protected initListeners(): void {
        this.liveFormPanel.onHidden((): void => {
            this.setItemVisible(this.insertablesPanel, false);
        });

        this.liveFormPanel.onShown((): void => {
            this.setItemVisible(this.insertablesPanel, true);
        });
    }

    getDeck(): NavigatedDeckPanel {
        return super.getDeck() as NavigatedDeckPanel;
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

    private isPanelSelectable(panel: Panel): boolean {
        return !ObjectHelper.iFrameSafeInstanceOf(panel, PageInspectionPanel) || this.liveFormPanel.getPageMode() !== PageMode.FRAGMENT;
    }

    public showInspectionPanel(params: InspectParameters) {
        const canSelectPanel = this.isPanelSelectable(params.panel);
        this.toggleClass('no-inspection', !canSelectPanel);
        if (canSelectPanel) {
            if (!params.silent) {
                new InspectEvent(params.showWidget, params.showPanel).fire();
            }

            this.inspectionsPanel.showInspectionPanel(params.panel);
            if (this.inspectTab) {
                this.inspectTab.setLabel(params.panel.getName());
            }
            if (!params.keepPanelSelection) {
                this.selectPanel(this.inspectionsPanel);
            }
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
}
