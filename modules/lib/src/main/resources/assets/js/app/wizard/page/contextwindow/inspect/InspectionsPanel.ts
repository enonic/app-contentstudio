import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentInspectionPanel} from './ContentInspectionPanel';
import {FragmentInspectionPanel} from './region/FragmentInspectionPanel';
import {TextInspectionPanel} from './region/TextInspectionPanel';
import {LayoutInspectionPanel} from './region/LayoutInspectionPanel';
import {PartInspectionPanel} from './region/PartInspectionPanel';
import {ImageInspectionPanel} from './region/ImageInspectionPanel';
import {RegionInspectionPanel} from './region/RegionInspectionPanel';
import {PageInspectionPanel} from './page/PageInspectionPanel';
import {NoSelectionInspectionPanel} from './NoSelectionInspectionPanel';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {DeckPanel} from '@enonic/lib-admin-ui/ui/panel/DeckPanel';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {DescriptorBasedComponentInspectionPanel} from './region/DescriptorBasedComponentInspectionPanel';
import {Descriptor} from '../../../../page/Descriptor';

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

    private readonly deck: DeckPanel;
    private readonly buttonContainer: DivEl;

    private readonly noSelectionPanel: NoSelectionInspectionPanel;
    private readonly pageInspectionPanel: PageInspectionPanel;

    constructor(config: InspectionsPanelConfig) {
        super('inspections-panel');

        this.deck = new DeckPanel();

        this.noSelectionPanel = new NoSelectionInspectionPanel();
        this.pageInspectionPanel = config.pageInspectionPanel;

        const imageInspectionPanel = config.imageInspectionPanel;
        const partInspectionPanel = config.partInspectionPanel;
        const layoutInspectionPanel = config.layoutInspectionPanel;
        const contentInspectionPanel = config.contentInspectionPanel;
        const regionInspectionPanel = config.regionInspectionPanel;
        const fragmentInspectionPanel = config.fragmentInspectionPanel;
        const textInspectionPanel = config.textInspectionPanel;

        this.deck.addPanel(imageInspectionPanel);
        this.deck.addPanel(partInspectionPanel);
        this.deck.addPanel(layoutInspectionPanel);
        this.deck.addPanel(contentInspectionPanel);
        this.deck.addPanel(regionInspectionPanel);
        this.deck.addPanel(this.pageInspectionPanel);
        this.deck.addPanel(fragmentInspectionPanel);
        this.deck.addPanel(textInspectionPanel);
        this.deck.addPanel(this.noSelectionPanel);

        this.deck.showPanel(this.pageInspectionPanel);

        this.buttonContainer = new DivEl('button-bar');
        this.buttonContainer.appendChild(new ActionButton(config.saveAction));

        this.appendChildren(<Element>this.deck, this.buttonContainer);

        partInspectionPanel.onDescriptorLoaded(this.updateButtonsVisibility.bind(this));
        layoutInspectionPanel.onDescriptorLoaded(this.updateButtonsVisibility.bind(this));
    }

    public showInspectionPanel(panel: Panel): void {
        this.deck.showPanel(panel);
    }

    public setButtonContainerVisible(isVisible: boolean = true): void {
        this.buttonContainer.setVisible(isVisible);
    }

    public updateButtonsVisibility(descriptor?: Descriptor): void {
        let thisDescriptor: Descriptor = descriptor;
        if (!thisDescriptor) {
            const panel: Panel = this.deck.getPanelShown();
            if (panel instanceof DescriptorBasedComponentInspectionPanel || panel instanceof PageInspectionPanel) {
                thisDescriptor = panel.getDescriptor();
            }
        }
        const showButtons = thisDescriptor ? thisDescriptor.getConfig()?.getFormItems().length > 0 : false;
        this.setButtonContainerVisible(showButtons);
    }

    public clearInspection(): void {
        this.showInspectionPanel(this.pageInspectionPanel);
    }

    public getPanelShown(): Panel {
        return this.deck.getPanelShown();
    }

}
