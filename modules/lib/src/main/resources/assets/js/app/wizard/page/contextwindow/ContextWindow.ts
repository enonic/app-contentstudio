import Q from 'q';
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
import {PageEventsManager} from '../../PageEventsManager';

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

    private isPageLocked: boolean = false;

    private isPageRenderable: boolean = false;

    constructor(config: ContextWindowConfig) {
        super();
        this.liveFormPanel = config.liveFormPanel;
        this.inspectionsPanel = config.inspectionPanel;
        this.insertablesPanel = config.insertablesPanel;

        this.initListeners();
    }

    protected initListeners(): void {
        const eventManager = PageEventsManager.get();
        eventManager.onPageLocked(() => {
            this.isPageLocked = true;
            this.setInsertablesVisible(false);
        });
        eventManager.onPageUnlocked(() => {
            this.isPageLocked = false;
            void this.updateInsertablesPanel();
        });
        eventManager.onRenderableChanged((isRenderable) => {
            this.isPageRenderable = isRenderable;
            void this.updateInsertablesPanel();
        })

        if (this.insertablesPanel) {
            this.liveFormPanel.onHidden((): void => {
                this.setInsertablesVisible(false);
            });

            this.liveFormPanel.onShown((): void => {
                this.updateInsertablesPanel();
            });
        }
    }

    private setInsertablesVisible(visible: boolean): void {
        if (!this.insertablesPanel) {
            return;
        }
        if (this.insertablesPanel.isRendered()) {
            this.setItemVisible(this.insertablesPanel, visible);
            if (visible) {
                this.selectPanel(this.insertablesPanel);
            }
        }

        this.toggleClass('no-insertion', !visible);
    }

    updateInsertablesPanel() {
        let setVisible: boolean;
        // check for renderable because it can have a controller/template but not be renderable (e.g. app is turned off )
        if (!this.isPageLocked && this.isPageRenderable) {
            const page = PageState.getState();
            const hasControllerOrTemplate = !!page && (page.hasController() || !!page.getTemplate() || page.isFragment());
            const hasDefaultTemplate = this.liveFormPanel.getModel()?.getDefaultModels()?.hasDefaultPageTemplate() || false;
            setVisible = hasControllerOrTemplate || hasDefaultTemplate;
        } else {
            setVisible = false;
        }
        return this.setInsertablesVisible(setVisible);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.addClass('context-window');

            if (this.insertablesPanel) {
                this.addItem(i18n('action.insert'), false, this.insertablesPanel);

                this.setInsertablesVisible(this.insertablesPanel.isVisible());
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
            if (this.insertablesPanel && !this.isPageLocked && (showInsertables || selectDefault)) {
                this.selectPanel(this.insertablesPanel);
            }
        }
    }
}
