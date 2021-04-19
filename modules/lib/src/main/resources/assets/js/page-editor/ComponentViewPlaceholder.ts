import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ComponentDescriptorsComboBox} from './ComponentDescriptorsComboBox';
import {Descriptor} from '../app/page/Descriptor';
import {ComponentView} from './ComponentView';
import {DescriptorBasedComponent} from '../app/page/region/DescriptorBasedComponent';
import {ComponentType} from '../app/page/region/ComponentType';

export abstract class ComponentViewPlaceholder<T extends DescriptorBasedComponent>
    extends ItemViewPlaceholder {

    private readonly comboBox: ComponentDescriptorsComboBox;

    protected constructor(componentView: ComponentView<T>) {
        super();
        this.addClassEx('part-placeholder').addClass(StyleHelper.getCommonIconCls('part'));

        this.comboBox = new ComponentDescriptorsComboBox(this.getType());
        this.comboBox.setContentId(componentView.getLiveEditModel().getContent().getContentId());

        this.appendChild(this.comboBox);

        const component = componentView.getComponent();

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<Descriptor>) => {
            componentView.showLoadingSpinner();
            const descriptor: Descriptor = event.getSelectedOption().getOption().getDisplayValue();
            component.setDescriptor(descriptor);
        });

        const siteModel = componentView.getLiveEditModel().getSiteModel();
        const listener = () => this.reloadDescriptors(componentView.getLiveEditModel().getContent().getContentId());

        siteModel.onApplicationAdded(listener);
        siteModel.onApplicationRemoved(listener);
        siteModel.onSiteModelUpdated(listener);

        this.onRemoved(() => {
            siteModel.unApplicationAdded(listener);
            siteModel.unApplicationRemoved(listener);
            siteModel.unSiteModelUpdated(listener);
        });
    }

    getType(): ComponentType {
        throw new Error('Must be implemented by inheritors');
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
