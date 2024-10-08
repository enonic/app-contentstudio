import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {Descriptor} from '../app/page/Descriptor';
import {ComponentType} from '../app/page/region/ComponentType';
import {ContentId} from '../app/content/ContentId';
import {SetComponentDescriptorEvent} from './event/outgoing/manipulation/SetComponentDescriptorEvent';
import {ComponentDescriptorsDropdown} from '../app/wizard/page/contextwindow/inspect/region/ComponentDescriptorsDropdown';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {DescriptorBasedComponentView} from './DescriptorBasedComponentView';

export abstract class DescriptorBasedComponentViewPlaceholder
    extends ItemViewPlaceholder {

    private comboBox: ComponentDescriptorsDropdown;

    private componentView: DescriptorBasedComponentView;

    protected constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    setComponentView(componentView: DescriptorBasedComponentView): void {
        this.componentView = componentView;
        this.comboBox.setContentId(new ContentId(this.componentView.getLiveEditParams().contentId));
        this.reloadDescriptors(new ContentId(this.componentView.getLiveEditParams().contentId));
    }

    protected initElements(): void {
        this.comboBox = new ComponentDescriptorsDropdown();
        this.comboBox.setComponentType(this.getType());
        this.comboBox.hide();
        this.appendChild(this.comboBox);
    }

    protected initListeners(): void {
        this.comboBox.onSelectionChanged((selectionChange: SelectionChange<Descriptor>) => {
           if (selectionChange.selected?.length > 0) {
               this.componentView.showLoadingSpinner();
               const descriptor: Descriptor = selectionChange.selected[0];

               new SetComponentDescriptorEvent(this.componentView.getPath(), descriptor.getKey().toString()).fire();
           }
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
        this.comboBox.load();
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
