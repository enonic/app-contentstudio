import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {ComponentDescriptorsComboBox} from './ComponentDescriptorsComboBox';
import {Descriptor} from '../app/page/Descriptor';
import {ComponentType} from '../app/page/region/ComponentType';
import {ContentId} from '../app/content/ContentId';
import {SetComponentDescriptorEvent} from './event/outgoing/manipulation/SetComponentDescriptorEvent';
import {DescriptorBasedComponentView} from './DescriptorBasedComponentView';

export abstract class DescriptorBasedComponentViewPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: ComponentDescriptorsComboBox;

    private componentView: DescriptorBasedComponentView;

    protected constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    setComponentView(componentView: DescriptorBasedComponentView): void {
        this.componentView = componentView;
        this.reloadDescriptors(new ContentId(this.componentView.getLiveEditParams().contentId));
    }

    protected initElements(): void {
        this.comboBox = new ComponentDescriptorsComboBox(this.getType());
        this.appendChild(this.comboBox);
    }

    protected initListeners(): void {
        this.comboBox.onOptionSelected((event: SelectedOptionEvent<Descriptor>) => {
            this.componentView.showLoadingSpinner();
            const descriptor: Descriptor = event.getSelectedOption().getOption().getDisplayValue();

            new SetComponentDescriptorEvent(this.componentView.getPath(), descriptor.getKey().toString()).fire();
        });

        // not letting events to fire on ItemView
        this.comboBox.onTouchEnd((event: TouchEvent) => {
            event.stopPropagation();
        });
    }

    getType(): ComponentType {
        throw new Error('Must be implemented by inheritors');
    }

    private reloadDescriptors(contentId: ContentId): void {
        this.comboBox.setContentId(contentId);
        this.comboBox.getLoader().load();
    }

    select(): void {
        if (!this.componentView.hasDescriptor()) {
            this.comboBox.show();
            this.comboBox.giveFocus();
        }
    }

    deselect(): void {
        this.comboBox.hide();
    }
}
