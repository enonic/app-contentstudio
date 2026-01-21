import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type ExtensionView} from './ExtensionView';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import type Q from 'q';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {type SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';

export class ExtensionSelectionRow
    extends DivEl {

    private extensionSelectorDropdown: ExtensionSelectorDropdown;

    private selectionWrapper: ExtensionFilterDropdown;

    private selectedViewer: ExtensionViewer;

    constructor() {
        super('extension-selection-row');

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        this.extensionSelectorDropdown = new ExtensionSelectorDropdown();
        this.extensionSelectorDropdown.addClass('extension-selector');
        this.selectedViewer = new ExtensionViewer();
        this.selectionWrapper =
            new ExtensionFilterDropdown(this.extensionSelectorDropdown);
    }

    private initListeners(): void {
        this.selectionWrapper.onSelectionChanged((selectionChange: SelectionChange<ExtensionView>) => {
            selectionChange.selected?.[0]?.setActive();
            this.selectionWrapper.cleanInput();
            this.selectionWrapper.hideDropdown();
            this.selectedViewer.setObject(selectionChange.selected?.[0]);
        });

        this.selectionWrapper.onDropdownVisibilityChanged((visible: boolean) => {
            this.toggleClass('dropdown-visible', visible);

            if (visible) {
                this.selectionWrapper.giveFocus();
            }
        });
    }

    updateState(extensionView: ExtensionView): void {
        const currentlySelectedItem = this.selectionWrapper.getSelectedItems()[0];

        if (currentlySelectedItem?.getExtensionName() !== extensionView.getExtensionName()) {
            this.selectionWrapper.select(extensionView);
        }
    }

    updateExtensionDropdown(extensionViews: ExtensionView[], selectedView?: ExtensionView): void {
        this.extensionSelectorDropdown.clearItems();
        this.extensionSelectorDropdown.setItems(extensionViews);

        if (selectedView) {
            this.selectionWrapper.select(selectedView);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.selectedViewer.addClass('selected-viewer');
            this.selectionWrapper.appendChild(this.selectedViewer);
            this.appendChild(this.selectionWrapper);

            return rendered;
        });
    }
}

export class ExtensionSelectorDropdown
    extends ListBox<ExtensionView> {

    constructor() {
        super();
    }

    protected createItemView(item: ExtensionView, readOnly: boolean): Element {
        const viewer = new ExtensionViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: ExtensionView): string {
        return item.getExtensionName();
    }
}

export class ExtensionViewer
    extends NamesAndIconViewer<ExtensionView> {

    constructor() {
        super('extension-viewer', NamesAndIconViewSize.compact);
    }

    doLayout(object: ExtensionView) {
        super.doLayout(object);

        const view = this.getNamesAndIconView();
        if (object && view) {
            const extensionClass = object.isInternal() ? 'internal-extension' : 'external-extension';
            view.removeClass('external-extension internal-extension');
            view.addClass(extensionClass);
        }
    }

    resolveDisplayName(object: ExtensionView): string {
        return object.getExtensionName();
    }

    resolveSubName(object: ExtensionView): string {
        return object.getExtensionDescription();
    }

    resolveIconUrl(object: ExtensionView): string {
        return object.getExtensionIconUrl();
    }

    resolveIconClass(object: ExtensionView): string {
        return object.getExtensionIconClass();
    }

}

export class ExtensionFilterDropdown
    extends FilterableListBoxWrapper<ExtensionView> {

    constructor(listBox: ListBox<ExtensionView>) {
        super(listBox, {
            className: 'extension-filter-dropdown',
            maxSelected: 1,
            filter: (item: ExtensionView, searchString: string): boolean => {
                return item.getExtensionName().toLowerCase().indexOf(searchString.toLowerCase()) > -1 ||
                       item.getExtensionDescription().toLowerCase().indexOf(searchString.toLowerCase()) > -1;
            }
        });
    }

    createSelectedOption(item: ExtensionView): Option<ExtensionView> {
        return Option.create<ExtensionView>()
            .setValue(item.getExtensionName())
            .setDisplayValue(item)
            .build();
    }

    hideDropdown(): void {
        super.hideDropdown();
    }

    protected handleUserToggleAction(item: ExtensionView): void {
        if (this.isItemSelected(item)) {
            return;
        }

        super.handleUserToggleAction(item);
    }

    select(item: ExtensionView[] | ExtensionView, silent?: boolean) {
        this.deselectAll(true);
        super.select(item, silent);
    }
}
