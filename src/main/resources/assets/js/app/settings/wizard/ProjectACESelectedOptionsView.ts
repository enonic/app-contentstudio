import {Option} from 'lib-admin-ui/ui/selector/Option';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {ArrayHelper} from 'lib-admin-ui/util/ArrayHelper';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {SelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionView';
import {Principal} from 'lib-admin-ui/security/Principal';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {PrincipalViewer} from 'lib-admin-ui/ui/security/PrincipalViewer';
import {ProjectAccess} from '../access/ProjectAccess';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {NavigatorEvent} from 'lib-admin-ui/ui/NavigatorEvent';

class ProjectAccessControlListView
    extends ListBox<ProjectAccessControlEntry> {

    private itemValueChangedListeners: { (item: ProjectAccessControlEntry): void }[] = [];
    private itemsEditable: boolean = true;

    constructor(className?: string) {
        super('selected-options access-control-list' + (className ? ' ' + className : ''));
    }

    createItemView(entry: ProjectAccessControlEntry, readOnly: boolean): ProjectAccessControlEntryView {
        let itemView = new ProjectAccessControlEntryView(entry, readOnly);
        itemView.onRemoveClicked(() => {
            this.removeItem(entry);
        });
        itemView.onValueChanged((item: ProjectAccessControlEntry) => {
            this.notifyItemValueChanged(item);
        });

        return itemView;
    }

    getItemId(item: ProjectAccessControlEntry): string {
        return item.getPrincipal().getKey().toString();
    }

    onItemValueChanged(listener: (item: ProjectAccessControlEntry) => void) {
        this.itemValueChangedListeners.push(listener);
    }

    unItemValueChanged(listener: (item: ProjectAccessControlEntry) => void) {
        this.itemValueChangedListeners = this.itemValueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyItemValueChanged(item: ProjectAccessControlEntry) {
        this.itemValueChangedListeners.forEach((listener) => {
            listener(item);
        });
    }

    setItemsEditable(editable: boolean): ProjectAccessControlListView {
        if (this.itemsEditable !== editable) {
            this.itemsEditable = editable;
            this.refreshList();
        }
        return this;
    }

    isItemsEditable(): boolean {
        return this.itemsEditable;
    }

}

export class ProjectACESelectedOptionsView
    extends ProjectAccessControlListView
    implements SelectedOptionsView<ProjectAccessControlEntry> {

    private maximumOccurrences: number;
    private list: SelectedOption<ProjectAccessControlEntry>[] = [];

    private selectedOptionRemovedListeners: { (removed: SelectedOptionEvent<ProjectAccessControlEntry>): void; }[] = [];
    private selectedOptionAddedListeners: { (added: SelectedOptionEvent<ProjectAccessControlEntry>): void; }[] = [];

    constructor(className?: string) {
        super(className);
    }

    setReadonly(readonly: boolean) {
        this.getSelectedOptions().forEach((option: SelectedOption<ProjectAccessControlEntry>) => {
            option.getOptionView().setReadonly(readonly);
        });
    }

    setMaximumOccurrences(value: number) {
        this.maximumOccurrences = value;
    }

    getMaximumOccurrences(): number {
        return this.maximumOccurrences;
    }

    createSelectedOption(_option: Option<ProjectAccessControlEntry>): SelectedOption<ProjectAccessControlEntry> {
        throw new Error('Not supported, use createItemView instead');
    }

    createItemView(entry: ProjectAccessControlEntry, readOnly: boolean): ProjectACESelectedOptionView {

        let option = {
            displayValue: entry,
            value: this.getItemId(entry),
            readOnly: readOnly
        };
        let itemView = new ProjectACESelectedOptionView(option, readOnly);
        itemView.onValueChanged((item: ProjectAccessControlEntry) => {
            // update our selected options list with new values
            const selectedOption = this.getById(item.getPrincipal().getKey().toString());
            if (selectedOption) {
                selectedOption.getOption().displayValue = item;
            }
            this.notifyItemValueChanged(item);
        });
        const selected = new SelectedOption<ProjectAccessControlEntry>(itemView, this.list.length);

        itemView.onRemoveClicked(() => this.removeOption(option, false));

        // keep track of selected options for SelectedOptionsView
        this.list.push(selected);
        return itemView;
    }

    addOption(option: Option<ProjectAccessControlEntry>, silent: boolean = false, keyCode: number = -1): boolean {
        if (option.readOnly) {
            this.addItemReadOnly(option.displayValue);
        } else {
            this.addItem(option.displayValue);
        }
        if (!silent) {
            let selectedOption = this.getByOption(option);
            this.notifySelectedOptionAdded(new SelectedOptionEvent(selectedOption, keyCode));
        }
        return true;
    }

    updateOption(_option: Option<ProjectAccessControlEntry>, _newOption: Option<ProjectAccessControlEntry>) {
        //TODO
    }

    removeOption(optionToRemove: Option<ProjectAccessControlEntry>, silent: boolean = false) {
        let selectedOption = this.getByOption(optionToRemove);
        this.removeItem(optionToRemove.displayValue);

        this.list = this.list.filter((option: SelectedOption<ProjectAccessControlEntry>) => {
            return option.getOption().value !== selectedOption.getOption().value;
        });

        // update item indexes to the right of removed item
        if (selectedOption.getIndex() < this.list.length) {
            for (let i: number = selectedOption.getIndex(); i < this.list.length; i++) {
                this.list[i].setIndex(i);
            }
        }

        if (!silent) {
            this.notifySelectedOptionRemoved(new SelectedOptionEvent(selectedOption));
        }
    }

    count(): number {
        return this.list.length;
    }

    getSelectedOptions(): SelectedOption<ProjectAccessControlEntry>[] {
        return this.list;
    }

    getByIndex(index: number): SelectedOption<ProjectAccessControlEntry> {
        return this.list[index];
    }

    getByOption(option: Option<ProjectAccessControlEntry>): SelectedOption<ProjectAccessControlEntry> {
        return this.getById(option.value);
    }

    getById(id: string): SelectedOption<ProjectAccessControlEntry> {
        return this.list.filter((selectedOption: SelectedOption<ProjectAccessControlEntry>) => {
            return selectedOption.getOption().value === id;
        })[0];
    }

    isSelected(option: Option<ProjectAccessControlEntry>): boolean {
        return this.getByOption(option) != null;
    }

    maximumOccurrencesReached(): boolean {
        if (this.maximumOccurrences === 0) {
            return false;
        }
        return this.count() >= this.maximumOccurrences;
    }

    moveOccurrence(formIndex: number, toIndex: number) {
        ArrayHelper.moveElement(formIndex, toIndex, this.list);
        ArrayHelper.moveElement(formIndex, toIndex, this.getChildren());

        this.list.forEach((selectedOption: SelectedOption<ProjectAccessControlEntry>,
                           index: number) => selectedOption.setIndex(index));
    }

    refreshSortable() {
        return;
    }

    onOptionDeselected(listener: { (removed: SelectedOptionEvent<ProjectAccessControlEntry>): void; }) {
        this.selectedOptionRemovedListeners.push(listener);
    }

    unOptionDeselected(listener: { (removed: SelectedOptionEvent<ProjectAccessControlEntry>): void; }) {
        this.selectedOptionRemovedListeners = this.selectedOptionRemovedListeners
            .filter(function (curr: { (removed: SelectedOptionEvent<ProjectAccessControlEntry>): void; }) {
                return curr !== listener;
            });
    }

    onOptionSelected(listener: { (added: SelectedOptionEvent<ProjectAccessControlEntry>): void; }) {
        this.selectedOptionAddedListeners.push(listener);
    }

    unOptionSelected(listener: { (added: SelectedOptionEvent<ProjectAccessControlEntry>): void; }) {
        this.selectedOptionAddedListeners = this.selectedOptionAddedListeners
            .filter(function (curr: { (added: SelectedOptionEvent<ProjectAccessControlEntry>): void; }) {
                return curr !== listener;
            });
    }

    onOptionMoved(_listener: { (moved: SelectedOption<ProjectAccessControlEntry>, fromIndex: number): void; }) {
        // must be implemented by children
    }

    unOptionMoved(_listener: { (moved: SelectedOption<ProjectAccessControlEntry>, fromIndex: number): void; }) {
        // must be implemented by children
    }

    private notifySelectedOptionRemoved(removed: SelectedOptionEvent<ProjectAccessControlEntry>) {
        this.selectedOptionRemovedListeners.forEach((listener) => {
            listener(removed);
        });
    }

    private notifySelectedOptionAdded(added: SelectedOptionEvent<ProjectAccessControlEntry>) {
        this.selectedOptionAddedListeners.forEach((listener) => {
            listener(added);
        });
    }

    setEditable(_editable: boolean) {
        throw new Error('Not in use');
    }

}

interface ProjectAccessSelectorOption {
    value: ProjectAccess;
    name: string;
}

class ProjectAccessSelector
    extends TabMenu {

    private static OPTIONS: ProjectAccessSelectorOption[] = [
        {value: ProjectAccess.CONTRIBUTOR, name: 'Contributor'},
        {value: ProjectAccess.EXPERT, name: 'Expert'},
        {value: ProjectAccess.OWNER, name: 'Owner'}
    ];

    private value: ProjectAccess;
    private valueChangedListeners: { (event: ValueChangedEvent): void }[] = [];

    constructor() {
        super('access-selector');

        ProjectAccessSelector.OPTIONS.forEach((option: ProjectAccessSelectorOption) => {
            let menuItem = (<TabMenuItemBuilder>new TabMenuItemBuilder().setLabel(option.name)).build();
            this.addNavigationItem(menuItem);
        });

        this.onNavigationItemSelected((event: NavigatorEvent) => {
            let item: TabMenuItem = <TabMenuItem> event.getItem();
            this.setValue(ProjectAccessSelector.OPTIONS[item.getIndex()].value);
        });

    }

    getValue(): ProjectAccess {
        return this.value;
    }

    setValue(value: ProjectAccess, silent?: boolean): ProjectAccessSelector {
        let option = this.findOptionByValue(value);
        if (option) {
            this.selectNavigationItem(ProjectAccessSelector.OPTIONS.indexOf(option));
            if (!silent) {
                this.notifyValueChanged(new ValueChangedEvent(ProjectAccess[this.value], ProjectAccess[value]));
            }
            this.value = value;
        }
        return this;
    }

    private findOptionByValue(value: ProjectAccess): ProjectAccessSelectorOption {
        for (let i = 0; i < ProjectAccessSelector.OPTIONS.length; i++) {
            let option = ProjectAccessSelector.OPTIONS[i];
            if (option.value === value) {
                return option;
            }
        }
        return undefined;
    }

    onValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyValueChanged(event: ValueChangedEvent) {
        this.valueChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

}

class ProjectAccessControlEntryView
    extends PrincipalViewer {

    private ace: ProjectAccessControlEntry;

    private accessSelector: ProjectAccessSelector;

    private valueChangedListeners: { (item: ProjectAccessControlEntry): void }[] = [];

    public static debug: boolean = false;

    constructor(ace: ProjectAccessControlEntry, readonly: boolean = false) {
        super('selected-option project-access-control-entry');

        this.ace = ace;
        this.setEditable(!readonly);

        if (!this.ace.getAccess()) {
            this.ace.setAccess(ProjectAccess[ProjectAccess.CONTRIBUTOR]);
        }

        this.setProjectAccessControlEntry(this.ace);
    }

    getValueChangedListeners(): { (item: ProjectAccessControlEntry): void }[] {
        return this.valueChangedListeners;
    }

    setEditable(editable: boolean) {
        super.setEditable(editable);

        this.toggleClass('readonly', !editable);
        if (this.accessSelector) {
            this.accessSelector.setEnabled(editable);
        }
    }

    onValueChanged(listener: (item: ProjectAccessControlEntry) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (item: ProjectAccessControlEntry) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyValueChanged(item: ProjectAccessControlEntry) {
        this.valueChangedListeners.forEach((listener) => {
            listener(item);
        });
    }

    public setProjectAccessControlEntry(ace: ProjectAccessControlEntry) {
        this.ace = ace;

        let principal: Principal = <Principal>Principal.create().setKey(ace.getPrincipal().getKey()).setModifiedTime(
            ace.getPrincipal().getModifiedTime()).setDisplayName(
            ace.getPrincipal().getDisplayName()).build();
        this.setObject(principal);

        this.doLayout(principal);
    }

    public getProjectAccessControlEntry(): ProjectAccessControlEntry {
        return new ProjectAccessControlEntry(this.ace.getPrincipal(), this.ace.getAccess());
    }

    doLayout(object: Principal) {
        super.doLayout(object);

        // permissions will be set on access selector value change

        if (!this.accessSelector) {
            this.accessSelector = new ProjectAccessSelector();
            this.accessSelector.setEnabled(this.isEditable());
            this.accessSelector.onValueChanged((event: ValueChangedEvent) => {
                this.ace.setAccess(event.getNewValue());
                this.notifyValueChanged(this.getProjectAccessControlEntry());
            });
            this.appendChild(this.accessSelector);
        }
        this.accessSelector.setValue(this.ace.getAccess(), true);

        this.appendRemoveButton();
    }
}

class ProjectACESelectedOptionView
    extends ProjectAccessControlEntryView
    implements SelectedOptionView<ProjectAccessControlEntry> {

    private option: Option<ProjectAccessControlEntry>;

    constructor(option: Option<ProjectAccessControlEntry>, readonly: boolean = false) {
        super(option.displayValue, readonly);
        this.option = option;
    }

    setOption(option: Option<ProjectAccessControlEntry>) {
        this.option = option;
        this.setProjectAccessControlEntry(option.displayValue);
    }

    getOption(): Option<ProjectAccessControlEntry> {
        return this.option;
    }

}
