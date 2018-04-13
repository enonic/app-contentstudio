import './../../api.ts';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {LayoutComponentView} from './LayoutComponentView';
import LayoutComponent = api.content.page.region.LayoutComponent;
import SiteModel = api.content.site.SiteModel;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorComboBox = api.content.page.region.LayoutDescriptorComboBox;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

export class LayoutPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: api.content.page.region.LayoutDescriptorComboBox;

    private layoutComponentView: LayoutComponentView;

    constructor(layoutView: LayoutComponentView) {
        super();
        this.addClassEx('layout-placeholder');
        this.layoutComponentView = layoutView;

        this.comboBox = new LayoutDescriptorComboBox();
        this.comboBox.loadDescriptors(layoutView.getLiveEditModel().getSiteModel().getApplicationKeys());

        this.appendChild(this.comboBox);

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<LayoutDescriptor>) => {
            this.layoutComponentView.showLoadingSpinner();
            let descriptor = event.getSelectedOption().getOption().displayValue;

            let layoutComponent: LayoutComponent = this.layoutComponentView.getComponent();
            layoutComponent.setDescriptor(descriptor.getKey(), descriptor);
        });

        let siteModel = layoutView.getLiveEditModel().getSiteModel();

            let listener = () => this.reloadDescriptors(siteModel);

            siteModel.onApplicationAdded(listener);
            siteModel.onApplicationRemoved(listener);
            siteModel.onSiteModelUpdated(listener);

            this.onRemoved(() => {
                siteModel.unApplicationAdded(listener);
                siteModel.unApplicationRemoved(listener);
                siteModel.unSiteModelUpdated(listener);
            });
        }

        private reloadDescriptors(siteModel: SiteModel) {
            this.comboBox.loadDescriptors(siteModel.getApplicationKeys());
        }

    select() {
        this.comboBox.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboBox.hide();
    }
}
