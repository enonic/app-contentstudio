import './../../api.ts';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {PartComponentView} from './PartComponentView';
import Descriptor = api.content.page.Descriptor;
import SiteModel = api.content.site.SiteModel;
import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorComboBox = api.content.page.region.PartDescriptorComboBox;

import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

export class PartPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: PartDescriptorComboBox;

    private displayName: api.dom.H2El;

    private partComponentView: PartComponentView;

    constructor(partView: PartComponentView) {
        super();
        this.addClassEx('part-placeholder').addClass(api.StyleHelper.getCommonIconCls('part'));

        this.partComponentView = partView;

        this.comboBox = new PartDescriptorComboBox();
        this.comboBox.loadDescriptors(partView.getLiveEditModel().getSiteModel().getApplicationKeys());

        this.appendChild(this.comboBox);

        const partComponent = this.partComponentView.getComponent();

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<PartDescriptor>) => {
            this.partComponentView.showLoadingSpinner();
            let descriptor: Descriptor = event.getSelectedOption().getOption().displayValue;
            partComponent.setDescriptor(descriptor.getKey(), descriptor);
        });

        let siteModel = partView.getLiveEditModel().getSiteModel();

            let listener = () => this.reloadDescriptors(siteModel);

            siteModel.onApplicationAdded(listener);
            siteModel.onApplicationRemoved(listener);
            siteModel.onSiteModelUpdated(listener);

            this.onRemoved(() => {
                siteModel.unApplicationAdded(listener);
                siteModel.unApplicationRemoved(listener);
                siteModel.unSiteModelUpdated(listener);
            });

        this.displayName = new api.dom.H3El('display-name');
        this.appendChild(this.displayName);
        if (partComponent && partComponent.getName()) {
            this.setDisplayName(partComponent.getName().toString());
        }
    }

        private reloadDescriptors(siteModel: SiteModel) {
            this.comboBox.loadDescriptors(siteModel.getApplicationKeys());
        }

    setDisplayName(name: string) {
        this.displayName.setHtml(name);
    }

    select() {
        this.comboBox.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboBox.hide();
    }
}
