import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DeckPanel} from '@enonic/lib-admin-ui/ui/panel/DeckPanel';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {ActionButton} from '@enonic/lib-admin-ui/ui2/ActionButton';
import * as Q from 'q';
import {BaseInspectionPanel} from './BaseInspectionPanel';

export interface InspectionsPanelConfig {
    inspectionPanels: BaseInspectionPanel[];
    defaultPanelToShow: BaseInspectionPanel;
    saveAction: Action;
}

export class InspectionsPanel
    extends Panel {

    private deck: DeckPanel;
    private buttonContainer: DivEl;
    private readonly config: InspectionsPanelConfig;

    constructor(config: InspectionsPanelConfig) {
        super('inspections-panel');

        this.config = config;

        this.initElements();
    }

    private initElements(): void {
        this.deck = new DeckPanel();
        this.config.inspectionPanels.forEach(panel => this.deck.addPanel(panel));

        if (this.config.defaultPanelToShow) {
            this.deck.showPanel(this.config.defaultPanelToShow);
        }

        this.buttonContainer = new DivEl('button-bar');
    }

    public showInspectionPanel(panel: Panel): void {
        this.deck.showPanel(panel);
    }

    public setButtonContainerVisible(isVisible: boolean = true): void {
        this.buttonContainer.setVisible(isVisible);
    }

    public clearInspection(): void {
        this.showInspectionPanel(this.config.defaultPanelToShow);
    }

    public getPanelShown(): Panel {
        return this.deck.getPanelShown();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.buttonContainer.appendChild(new ActionButton({action: this.config.saveAction}));
            this.appendChildren(this.deck as Element, this.buttonContainer);

            return rendered;
        });
    }

}
