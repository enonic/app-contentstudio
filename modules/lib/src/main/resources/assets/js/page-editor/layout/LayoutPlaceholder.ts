import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {LayoutComponentView} from './LayoutComponentView';
import {LayoutDescriptorComboBox} from './LayoutDescriptorComboBox';
import {LayoutComponent} from '../../app/page/region/LayoutComponent';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export class LayoutPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: LayoutDescriptorComboBox;

    private layoutComponentView: LayoutComponentView;

    constructor(layoutView: LayoutComponentView) {
        super();
        this.addClassEx('layout-placeholder');
        this.layoutComponentView = layoutView;

        this.comboBox = new LayoutDescriptorComboBox();
        this.comboBox.setContentId(layoutView.getLiveEditModel().getContent().getContentId());

        this.appendChild(this.comboBox);

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<LayoutDescriptor>) => {
            this.layoutComponentView.showLoadingSpinner();
            const descriptor = event.getSelectedOption().getOption().getDisplayValue();

            const layoutComponent: LayoutComponent = this.layoutComponentView.getComponent();
            layoutComponent.setDescriptor(descriptor);
        });

        let siteModel = layoutView.getLiveEditModel().getSiteModel();

        let listener = () => this.reloadDescriptors(layoutView.getLiveEditModel().getContent().getContentId());

        siteModel.onApplicationAdded(listener);
        siteModel.onApplicationRemoved(listener);
        siteModel.onSiteModelUpdated(listener);

        this.onRemoved(() => {
            siteModel.unApplicationAdded(listener);
            siteModel.unApplicationRemoved(listener);
            siteModel.unSiteModelUpdated(listener);
        });
    }

    private reloadDescriptors(contentId: ContentId) {
        this.comboBox.setContentId(contentId);
        this.comboBox.getLoader().load();
    }

    select() {
        this.comboBox.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboBox.hide();
    }
}
