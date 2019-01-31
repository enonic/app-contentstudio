import {LiveEditPageProxy} from '../LiveEditPageProxy';
import {LiveFormPanel} from '../LiveFormPanel';
import {InspectionsPanel} from './inspect/InspectionsPanel';
import {BaseInspectionPanel} from './inspect/BaseInspectionPanel';
import {InsertablesPanel} from './insert/InsertablesPanel';
import {PageComponentsView} from '../../PageComponentsView';
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import i18n = api.util.i18n;

export interface ContextWindowConfig {

    liveEditPage: LiveEditPageProxy;

    liveFormPanel: LiveFormPanel;

    inspectionPanel: InspectionsPanel;

    insertablesPanel: InsertablesPanel;
}

export class ContextWindow extends api.ui.panel.DockedPanel {

    private insertablesPanel: InsertablesPanel;

    private inspectionsPanel: InspectionsPanel;

    private liveFormPanel: LiveFormPanel;

    private fixed: boolean = false;

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
            this.addItem(i18n('action.inspect'), false, this.inspectionsPanel);

            this.insertablesPanel.getComponentsView().onBeforeInsertAction(() => {
                this.fixed = true;
            });

            return rendered;
        });
    }

    getComponentsView(): PageComponentsView {
        return this.insertablesPanel.getComponentsView();
    }

    isFixed(): boolean {
        return this.fixed;
    }

    public showInspectionPanel(panel: BaseInspectionPanel) {
        this.inspectionsPanel.showInspectionPanel(panel);
        this.selectPanel(this.inspectionsPanel);
    }

    public clearSelection() {
        this.inspectionsPanel.clearInspection();
        this.selectPanel(this.insertablesPanel);
    }

    isLiveFormShown(): boolean {
        return this.liveFormPanel.isVisible();
    }
}
