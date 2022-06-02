import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {ComponentDescriptorsComboBox} from './ComponentDescriptorsComboBox';
import {Descriptor} from '../app/page/Descriptor';
import {ComponentView} from './ComponentView';
import {DescriptorBasedComponent} from '../app/page/region/DescriptorBasedComponent';
import {ComponentType} from '../app/page/region/ComponentType';
import {ContentId} from '../app/content/ContentId';

export abstract class ComponentViewPlaceholder<T extends DescriptorBasedComponent>
    extends ItemViewPlaceholder {

    private comboBox: ComponentDescriptorsComboBox;

    private readonly componentView: ComponentView<T>;

    protected constructor(componentView: ComponentView<T>) {
        super();

        this.componentView = componentView;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.comboBox = new ComponentDescriptorsComboBox(this.getType());
        this.comboBox.setContentId(this.componentView.getLiveEditModel().getContent().getContentId());
        this.appendChild(this.comboBox);
    }

    protected initListeners(): void {
        const component: T = this.componentView.getComponent();

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<Descriptor>) => {
            this.componentView.showLoadingSpinner();
            const descriptor: Descriptor = event.getSelectedOption().getOption().getDisplayValue();
            component.setDescriptor(descriptor);
        });

        // not letting events to fire on ItemView
        this.comboBox.onTouchEnd((event: TouchEvent) => {
            event.stopPropagation();
        });

        const siteModel = this.componentView.getLiveEditModel().getSiteModel();
        const listener = () => this.reloadDescriptors(this.componentView.getLiveEditModel().getContent().getContentId());

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
