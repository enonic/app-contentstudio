import {ComponentDescriptorsLoader} from './ComponentDescriptorsLoader';
import {ComponentType} from '../../../../../page/region/ComponentType';
import {ContentId} from '../../../../../content/ContentId';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Descriptor} from '../../../../../page/Descriptor';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import * as Q from 'q';
import {DescriptorViewer} from '../DescriptorViewer';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {DescriptorListBox} from './DescriptorListBox';
import {DescriptorKey} from '../../../../../page/DescriptorKey';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class ComponentDescriptorsDropdown
    extends FilterableListBoxWrapper<Descriptor> {

    protected loader: ComponentDescriptorsLoader;

    protected selectedViewer: DescriptorViewer;

    protected selectedDescriptor: Descriptor;

    constructor() {
        super(new DescriptorListBox(), {
            maxSelected: 1,
            className: 'common-page-dropdown',
            filter: ComponentDescriptorsDropdown.filterFunction,
        });
    }

    protected initElements(): void {
        super.initElements();

        this.selectedViewer = new DescriptorViewer('selected-option');
        this.loader = this.createLoader();

        this.selectedViewer.hide();
    }

    protected initListeners(): void {
        super.initListeners();

        this.loader.onLoadedData((event: LoadedDataEvent<Descriptor>) => {
            this.listBox.setItems(event.getData());
            return null;
        });

        this.onSelectionChanged((selection: SelectionChange<Descriptor>) => {
            if (selection.selected?.length > 0) {
                this.selectedViewer.setObject(selection.selected[0]);
                this.selectedViewer.show();
                this.optionFilterInput.hide();
            } else {
                this.selectedViewer.hide();
                this.optionFilterInput.show();
            }
        });

        this.optionFilterInput.onClicked(() => {
           if (!this.optionFilterInput.hasFocus()) {
                this.optionFilterInput.giveFocus();
           }
        });
    }

    protected loadListOnShown(): void {
        this.loader.load().then(() => {
            if (this.selectedDescriptor) {
                this.select(this.selectedDescriptor, true);
            }
        }).catch(DefaultErrorHandler.handle);
    }

    protected doShowDropdown(): void {
        super.doShowDropdown();

        this.selectedViewer.hide();
        this.optionFilterInput.show();
    }

    protected doHideDropdown(): void {
        super.doHideDropdown();

        if (this.selectedDescriptor) {
            this.selectedViewer.show();
            this.optionFilterInput.hide();
        }
    }

    protected handleUserToggleAction(item: Descriptor): void {
        const itemId = this.listBox.getIdOfItem(item);

        if (!this.isSelected(itemId)) {
            super.handleUserToggleAction(item); // can't deselect the only selected item
        }
    }

    setComponentType(componentType: ComponentType): this {
        this.loader.setComponentType(componentType);
        return this;
    }

    setContentId(contentId: ContentId): void {
        this.loader.setContentId(contentId);
    }

    load(): void {
        if (this.loader.isLoaded()) {
            this.loader.load();
        }
    }

    reset(): void {
        this.setDescriptor(null);
    }

    hideDropdown(): void {
        super.hideDropdown();
    }

    protected createLoader(): ComponentDescriptorsLoader {
        return new ComponentDescriptorsLoader();
    }

    setDescriptor(descriptor: Descriptor) {
        this.selectedDescriptor = descriptor;
        this.hideDropdown();
        this.deselectAll(true);

        if (descriptor) {
            this.select(descriptor, true); // must be silent, otherwise it will trigger update event
            this.selectedViewer.setObject(descriptor);
            this.selectedViewer.show();
        } else {
            this.selectedViewer.hide();
            this.optionFilterInput.show();
        }
    }

    protected getItemById(id: string): Descriptor {
        return this.selectedDescriptor?.getKey().toString() === id ? this.selectedDescriptor : super.getItemById(id);
    }

    getDescriptorByKey(descriptorKey: DescriptorKey): Descriptor {
        return descriptorKey ? this.getItemById(descriptorKey.toString()) : null;
    }

    getSelectedDescriptor(): Descriptor {
        return this.selectedDescriptor;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.filterContainer.appendChild(this.selectedViewer);

            return rendered;
        });
    }

    private static filterFunction(item: Descriptor, searchString: string): boolean {
        return !StringHelper.isBlank(searchString) &&
               item.getDisplayName().toLowerCase().indexOf(searchString.toLowerCase()) >= 0 ||
               item.getName().toString().toLowerCase().indexOf(searchString.toLowerCase()) >= 0;
    }
}
