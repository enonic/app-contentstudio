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
        this.comboBox.setContentId(new ContentId(this.componentView.getLiveEditParams().contentId));
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

        const contentId = new ContentId(this.componentView.getLiveEditParams().contentId);
        const listener = () => this.reloadDescriptors(contentId);

        // handle application events and trigger listener

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
