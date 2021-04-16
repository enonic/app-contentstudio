import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {PartComponentView} from './PartComponentView';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {H2El} from 'lib-admin-ui/dom/H2El';
import {H3El} from 'lib-admin-ui/dom/H3El';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ComponentDescriptorsComboBox} from '../ComponentDescriptorsComboBox';
import {Descriptor} from '../../app/page/Descriptor';
import {PartComponentType} from '../../app/page/region/PartComponentType';

export class PartPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: ComponentDescriptorsComboBox;

    private displayName: H2El;

    private partComponentView: PartComponentView;

    constructor(partView: PartComponentView) {
        super();
        this.addClassEx('part-placeholder').addClass(StyleHelper.getCommonIconCls('part'));

        this.partComponentView = partView;

        this.comboBox = new ComponentDescriptorsComboBox(PartComponentType.get());
        this.comboBox.setContentId(partView.getLiveEditModel().getContent().getContentId());

        this.appendChild(this.comboBox);

        const partComponent = this.partComponentView.getComponent();

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<Descriptor>) => {
            this.partComponentView.showLoadingSpinner();
            const descriptor: Descriptor = event.getSelectedOption().getOption().getDisplayValue();
            partComponent.setDescriptor(descriptor);
        });

        let siteModel = partView.getLiveEditModel().getSiteModel();

        let listener = () => this.reloadDescriptors(partView.getLiveEditModel().getContent().getContentId());

        siteModel.onApplicationAdded(listener);
        siteModel.onApplicationRemoved(listener);
        siteModel.onSiteModelUpdated(listener);

        this.onRemoved(() => {
            siteModel.unApplicationAdded(listener);
            siteModel.unApplicationRemoved(listener);
            siteModel.unSiteModelUpdated(listener);
        });

        this.displayName = new H3El('display-name');
        this.appendChild(this.displayName);
        if (partComponent && partComponent.getName()) {
            this.setDisplayName(partComponent.getName().toString());
        }
    }

    private reloadDescriptors(contentId: ContentId) {
        this.comboBox.setContentId(contentId);
        this.comboBox.getLoader().load();
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
