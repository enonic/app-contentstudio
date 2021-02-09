import {Element} from 'lib-admin-ui/dom/Element';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentInspectionPanel} from './ContentInspectionPanel';
import {FragmentInspectionPanel} from './region/FragmentInspectionPanel';
import {TextInspectionPanel} from './region/TextInspectionPanel';
import {LayoutInspectionPanel} from './region/LayoutInspectionPanel';
import {PartInspectionPanel} from './region/PartInspectionPanel';
import {ImageInspectionPanel} from './region/ImageInspectionPanel';
import {RegionInspectionPanel} from './region/RegionInspectionPanel';
import {PageInspectionPanel} from './page/PageInspectionPanel';
import {NoSelectionInspectionPanel} from './NoSelectionInspectionPanel';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {DeckPanel} from 'lib-admin-ui/ui/panel/DeckPanel';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';

export interface InspectionsPanelConfig {
    contentInspectionPanel: ContentInspectionPanel;
    pageInspectionPanel: PageInspectionPanel;
    regionInspectionPanel: RegionInspectionPanel;
    imageInspectionPanel: ImageInspectionPanel;
    partInspectionPanel: PartInspectionPanel;
    layoutInspectionPanel: LayoutInspectionPanel;
    fragmentInspectionPanel: FragmentInspectionPanel;
    textInspectionPanel: TextInspectionPanel;
    saveAction: Action;
}

export class InspectionsPanel
    extends Panel {

    private deck: DeckPanel;
    private buttons: DivEl;

    private noSelectionPanel: NoSelectionInspectionPanel;
    private imageInspectionPanel: ImageInspectionPanel;
    private partInspectionPanel: PartInspectionPanel;
    private layoutInspectionPanel: LayoutInspectionPanel;
    private contentInspectionPanel: ContentInspectionPanel;
    private pageInspectionPanel: PageInspectionPanel;
    private regionInspectionPanel: RegionInspectionPanel;
    private fragmentInspectionPanel: FragmentInspectionPanel;
    private textInspectionPanel: TextInspectionPanel;

    constructor(config: InspectionsPanelConfig) {
        super('inspections-panel');

        this.deck = new DeckPanel();

        this.noSelectionPanel = new NoSelectionInspectionPanel();
        this.imageInspectionPanel = config.imageInspectionPanel;
        this.partInspectionPanel = config.partInspectionPanel;
        this.layoutInspectionPanel = config.layoutInspectionPanel;
        this.contentInspectionPanel = config.contentInspectionPanel;
        this.pageInspectionPanel = config.pageInspectionPanel;
        this.regionInspectionPanel = config.regionInspectionPanel;
        this.fragmentInspectionPanel = config.fragmentInspectionPanel;
        this.textInspectionPanel = config.textInspectionPanel;

        this.deck.addPanel(this.imageInspectionPanel);
        this.deck.addPanel(this.partInspectionPanel);
        this.deck.addPanel(this.layoutInspectionPanel);
        this.deck.addPanel(this.contentInspectionPanel);
        this.deck.addPanel(this.regionInspectionPanel);
        this.deck.addPanel(this.pageInspectionPanel);
        this.deck.addPanel(this.fragmentInspectionPanel);
        this.deck.addPanel(this.textInspectionPanel);
        this.deck.addPanel(this.noSelectionPanel);

        this.deck.showPanel(this.pageInspectionPanel);

        this.buttons = new DivEl('button-bar');
        let saveButton = new ActionButton(config.saveAction);
        this.buttons.appendChild(saveButton);

        this.appendChildren(<Element>this.deck, this.buttons);
    }

    public showInspectionPanel(panel: Panel) {
        this.deck.showPanel(panel);
        let showButtons = !(ObjectHelper.iFrameSafeInstanceOf(panel, RegionInspectionPanel) ||
                            ObjectHelper.iFrameSafeInstanceOf(panel, NoSelectionInspectionPanel));
        this.buttons.setVisible(showButtons);
    }

    public clearInspection() {
        this.showInspectionPanel(this.pageInspectionPanel);
    }

    public isInspecting(): boolean {
        return this.deck.getPanelShown() !== this.noSelectionPanel;
    }

    public getPanelShown(): Panel {
        return this.deck.getPanelShown();
    }

}
