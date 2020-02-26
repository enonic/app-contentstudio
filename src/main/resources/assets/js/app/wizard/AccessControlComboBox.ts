import {Option} from 'lib-admin-ui/ui/selector/Option';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {AccessControlEntryViewer} from '../view/AccessControlEntryViewer';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {AccessControlListView} from '../view/AccessControlListView';
import {AccessControlEntryLoader} from './AccessControlEntryLoader';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {assertNotNull} from 'lib-admin-ui/util/Assert';
import {ArrayHelper} from 'lib-admin-ui/util/ArrayHelper';
import {SelectedOptionView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionView';

export class AccessControlComboBox
    extends RichComboBox<AccessControlEntry> {

    private aceSelectedOptionsView: ACESelectedOptionsView;

    constructor() {
        let builder = new RichComboBoxBuilder<AccessControlEntry>().setMaximumOccurrences(0).setComboBoxName(
            'principalSelector').setIdentifierMethod('getPrincipalKey').setLoader(
            new AccessControlEntryLoader()).setHideComboBoxWhenMaxReached(false).setSelectedOptionsView(
            new ACESelectedOptionsView()).setOptionDisplayValueViewer(new AccessControlEntryViewer()).setDelayedInputValueChangedHandling(
            500);

        super(builder);

        this.aceSelectedOptionsView = <ACESelectedOptionsView>builder.getSelectedOptionsView();
    }

    onOptionValueChanged(listener: (item: AccessControlEntry) => void) {
        this.aceSelectedOptionsView.onItemValueChanged(listener);
    }

    unItemValueChanged(listener: (item: AccessControlEntry) => void) {
        this.aceSelectedOptionsView.unItemValueChanged(listener);
    }
}

class ACESelectedOptionView
    extends AccessControlEntryView
    implements SelectedOptionView<AccessControlEntry> {

    private option: Option<AccessControlEntry>;

    constructor(option: Option<AccessControlEntry>) {
        let ace = option.displayValue;
        if (ace.getAllowedPermissions().length === 0 && ace.getDeniedPermissions().length === 0) {
            // allow read by default
            ace.allow(Permission.READ);
        }
        super(ace);
        this.option = option;
    }

    setOption(option: Option<AccessControlEntry>) {
        this.option = option;
        this.setAccessControlEntry(option.displayValue);
    }

    getOption(): Option<AccessControlEntry> {
        return this.option;
    }

}

class ACESelectedOptionsView
    extends AccessControlListView
    implements SelectedOptionsView<AccessControlEntry> {

    private maximumOccurrences: number;
    private list: SelectedOption<AccessControlEntry>[] = [];

    private selectedOptionRemovedListeners: { (removed: SelectedOptionEvent<AccessControlEntry>): void; }[] = [];
    private selectedOptionAddedListeners: { (added: SelectedOptionEvent<AccessControlEntry>): void; }[] = [];

    setReadonly(readonly: boolean) {
        this.getSelectedOptions().forEach((option: SelectedOption<AccessControlEntry>) => {
            option.getOptionView().setReadonly(readonly);
        });
    }

    setMaximumOccurrences(value: number) {
        this.maximumOccurrences = value;
    }

    getMaximumOccurrences(): number {
        return this.maximumOccurrences;
    }

    createSelectedOption(_option: Option<AccessControlEntry>): SelectedOption<AccessControlEntry> {
        throw new Error('Not supported, use createItemView instead');
    }

    createItemView(entry: AccessControlEntry): ACESelectedOptionView {

        let option = {
            displayValue: entry,
            value: this.getItemId(entry)
        };
        let itemView = new ACESelectedOptionView(option);
        itemView.onValueChanged((item: AccessControlEntry) => {
            // update our selected options list with new values
            const selectedOption = this.getById(item.getPrincipalKey().toString());
            if (selectedOption) {
                selectedOption.getOption().displayValue = item;
            }
            this.notifyItemValueChanged(item);
        });
        const selected = new SelectedOption<AccessControlEntry>(itemView, this.list.length);

        itemView.onRemoveClicked(() => this.removeOption(option, false));

        // keep track of selected options for SelectedOptionsView
        this.list.push(selected);
        return itemView;
    }

    addOption(option: Option<AccessControlEntry>, silent: boolean = false, keyCode: number = -1): boolean {
        this.addItem(option.displayValue);

        if (!silent) {
            let selectedOption = this.getByOption(option);
            this.notifySelectedOptionAdded(new SelectedOptionEvent(selectedOption, keyCode));
        }
        return true;
    }

    updateOption(_option: Option<AccessControlEntry>, _newOption: Option<AccessControlEntry>) {
        //TODO
    }

    removeOption(optionToRemove: Option<AccessControlEntry>, silent: boolean = false) {
        assertNotNull(optionToRemove, 'optionToRemove cannot be null');

        let selectedOption = this.getByOption(optionToRemove);
        assertNotNull(selectedOption, 'Did not find any selected option to remove from option: ' + optionToRemove.value);

        this.removeItem(optionToRemove.displayValue);

        this.list = this.list.filter((option: SelectedOption<AccessControlEntry>) => {
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

    getSelectedOptions(): SelectedOption<AccessControlEntry>[] {
        return this.list;
    }

    getByIndex(index: number): SelectedOption<AccessControlEntry> {
        return this.list[index];
    }

    getByOption(option: Option<AccessControlEntry>): SelectedOption<AccessControlEntry> {
        return this.getById(option.value);
    }

    getById(id: string): SelectedOption<AccessControlEntry> {
        return this.list.filter((selectedOption: SelectedOption<AccessControlEntry>) => {
            return selectedOption.getOption().value === id;
        })[0];
    }

    isSelected(option: Option<AccessControlEntry>): boolean {
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

        this.list.forEach((selectedOption: SelectedOption<AccessControlEntry>, index: number) => selectedOption.setIndex(index));
    }

    refreshSortable() {
        return;
    }

    private notifySelectedOptionRemoved(removed: SelectedOptionEvent<AccessControlEntry>) {
        this.selectedOptionRemovedListeners.forEach((listener) => {
            listener(removed);
        });
    }

    onOptionDeselected(listener: { (removed: SelectedOptionEvent<AccessControlEntry>): void; }) {
        this.selectedOptionRemovedListeners.push(listener);
    }

    unOptionDeselected(listener: { (removed: SelectedOptionEvent<AccessControlEntry>): void; }) {
        this.selectedOptionRemovedListeners = this.selectedOptionRemovedListeners
            .filter(function (curr: { (removed: SelectedOptionEvent<AccessControlEntry>): void; }) {
                return curr !== listener;
            });
    }

    onOptionSelected(listener: { (added: SelectedOptionEvent<AccessControlEntry>): void; }) {
        this.selectedOptionAddedListeners.push(listener);
    }

    unOptionSelected(listener: { (added: SelectedOptionEvent<AccessControlEntry>): void; }) {
        this.selectedOptionAddedListeners = this.selectedOptionAddedListeners
            .filter(function (curr: { (added: SelectedOptionEvent<AccessControlEntry>): void; }) {
                return curr !== listener;
            });
    }

    private notifySelectedOptionAdded(added: SelectedOptionEvent<AccessControlEntry>) {
        this.selectedOptionAddedListeners.forEach((listener) => {
            listener(added);
        });
    }

    onOptionMoved(_listener: { (moved: SelectedOption<AccessControlEntry>, fromIndex: number): void; }) {
        // must be implemented by children
    }

    unOptionMoved(_listener: { (moved: SelectedOption<AccessControlEntry>, fromIndex: number): void; }) {
        // must be implemented by children
    }

    setEditable(_editable: boolean) {
        throw new Error('Not in use');
    }

}
