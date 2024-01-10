import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {Descriptor} from '../app/page/Descriptor';
import {ComponentView} from './ComponentView';
import {DescriptorBasedComponent} from '../app/page/region/DescriptorBasedComponent';
import {ComponentType} from '../app/page/region/ComponentType';
import {ContentId} from '../app/content/ContentId';
import {SetComponentDescriptorEvent} from './event/outgoing/manipulation/SetComponentDescriptorEvent';
import {ComponentDescriptorsDropdown} from '../app/wizard/page/contextwindow/inspect/region/ComponentDescriptorsDropdown';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';

export abstract class ComponentViewPlaceholder<T extends DescriptorBasedComponent>
    extends ItemViewPlaceholder {

    private comboBox: ComponentDescriptorsDropdown;

    private readonly componentView: ComponentView;

    protected constructor(componentView: ComponentView) {
        super();

        this.componentView = componentView;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.comboBox = new ComponentDescriptorsDropdown();
        this.comboBox.setComponentType(this.getType());
        this.comboBox.setContentId(new ContentId(this.componentView.getLiveEditParams().contentId));
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

        const contentId = new ContentId(this.componentView.getLiveEditParams().contentId);
        const listener = () => this.reloadDescriptors(contentId);

        // handle application events and trigger listener

    }

    getType(): ComponentType {
        throw new Error('Must be implemented by inheritors');
    }

    private reloadDescriptors(contentId: ContentId) {
        this.comboBox.setContentId(contentId);
        this.comboBox.load();
    }

    select() {
        this.comboBox.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboBox.hide();
    }
}
