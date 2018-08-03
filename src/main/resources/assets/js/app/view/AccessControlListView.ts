import AccessControlEntry = api.security.acl.AccessControlEntry;
import {AccessControlEntryView} from './AccessControlEntryView';

export class AccessControlListView
    extends api.ui.selector.list.ListBox<AccessControlEntry> {

    private itemValueChangedListeners: { (item: AccessControlEntry): void }[] = [];

    constructor(className?: string) {
        super('selected-options access-control-list' + (className ? ' ' + className : ''));
    }

    addItem(item: AccessControlEntry, readOnly: boolean = false) {
        readOnly ? super.addItemReadOnly(item) : super.addItem(item);
    }

    createItemView(entry: AccessControlEntry, readOnly: boolean = false): AccessControlEntryView {
        let itemView = new AccessControlEntryView(entry, readOnly);
        itemView.onRemoveClicked(() => {
            this.removeItem(entry);
        });
        itemView.onValueChanged((item: AccessControlEntry) => {
            this.notifyItemValueChanged(item);
        });
        return itemView;
    }

    getItemId(item: AccessControlEntry): string {
        return item.getPrincipalKey().toString();
    }

    onItemValueChanged(listener: (item: AccessControlEntry) => void) {
        this.itemValueChangedListeners.push(listener);
    }

    unItemValueChanged(listener: (item: AccessControlEntry) => void) {
        this.itemValueChangedListeners = this.itemValueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyItemValueChanged(item: AccessControlEntry) {
        this.itemValueChangedListeners.forEach((listener) => {
            listener(item);
        });
    }

}
