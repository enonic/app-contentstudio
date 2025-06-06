import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LiveFormPanel} from '../LiveFormPanel';
import {InspectionsPanel} from './inspect/InspectionsPanel';
import {BaseInspectionPanel} from './inspect/BaseInspectionPanel';
import {InsertablesPanel} from './insert/InsertablesPanel';
import {InspectEvent} from '../../../event/InspectEvent';
import {PageInspectionPanel} from './inspect/page/PageInspectionPanel';
import {TabBarItem} from '@enonic/lib-admin-ui/ui/tab/TabBarItem';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {DockedPanel} from '@enonic/lib-admin-ui/ui/panel/DockedPanel';
import {PageState} from '../PageState';
import {PageNavigationEventSource} from '../../PageNavigationEventData';

export interface ContextWindowConfig {

    liveFormPanel: LiveFormPanel;

    inspectionPanel: InspectionsPanel;

    insertablesPanel: InsertablesPanel;
}

export interface InspectParameters {
    panel: BaseInspectionPanel;
    showWidget: boolean;
    showPanel: boolean;
    keepPanelSelection?: boolean;
    silent?: boolean;
    source?: PageNavigationEventSource;
}

const DefaultInspectParameters = {
    keepPanelSelection: false,
    silent: false
};

export const getInspectParameters = function (params: InspectParameters): InspectParameters {
    return Object.assign({}, DefaultInspectParameters, params) as InspectParameters;
};

export class ContextWindow
    extends DockedPanel {

    private insertablesPanel?: InsertablesPanel;

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
        if (this.insertablesPanel) {
            this.liveFormPanel.onHidden((): void => {
                this.setItemVisible(this.insertablesPanel, false);
            });

            this.liveFormPanel.onShown((): void => {
                this.setItemVisible(this.insertablesPanel, true);
            });
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.addClass('context-window');

            if (this.insertablesPanel) {
                this.addItem(i18n('action.insert'), false, this.insertablesPanel);
            }

            this.addItem(i18n('action.inspect'), false, this.inspectionsPanel);
            const tabItems = this.getItems();
            this.inspectTab = tabItems[tabItems.length - 1];
            this.inspectTab.addClass('inspect-tab');

            return rendered;
        });
    }

    private isPanelSelectable(panel: Panel): boolean {
        return !(panel instanceof PageInspectionPanel) || !PageState.getState()?.isFragment();
    }

    public showInspectionPanel(params: InspectParameters) {
        const canSelectPanel = this.isPanelSelectable(params.panel);
        this.toggleClass('no-inspection', !canSelectPanel);
        if (canSelectPanel) {
            if (!params.silent) {
                InspectEvent.create()
                    .setShowWidget(params.showWidget)
                    .setShowPanel(params.showPanel)
                    .setSource(params.source)
                    .build().fire();
            }

            this.inspectionsPanel.showInspectionPanel(params.panel);

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
            const selectDefault = !isPageInspectionPanelSelectable && this.inspectTab.isActive();
            if (this.insertablesPanel && (showInsertables || selectDefault)) {
                this.selectPanel(this.insertablesPanel);
            }
        }
    }
}
