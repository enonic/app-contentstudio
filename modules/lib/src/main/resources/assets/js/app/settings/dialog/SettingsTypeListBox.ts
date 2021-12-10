import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {SettingsType} from './SettingsType';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {SettingsTypeViewer} from './SettingsTypeViewer';
import {AccessibilityHelper} from '../../util/AccessibilityHelper';

export class SettingsTypeListBox
    extends ListBox<SettingsType> {

    private itemClickedListeners: { (item: SettingsType): void }[] = [];

    createItemView(item: SettingsType): NamesAndIconViewer<SettingsType> {
        const itemView: SettingsTypeViewer = new SettingsTypeViewer(item.getName().toLowerCase());

        AccessibilityHelper.tabIndex(itemView);

        itemView.onClicked(() => {
            this.notifyItemClicked(item);
        });

        itemView.setObject(item);

        return itemView;
    }

    getItemId(item: SettingsType): string {
        return item.getName();
    }

    onItemClicked(listener: (item: SettingsType) => void) {
        this.itemClickedListeners.push(listener);
    }

    unItemClicked(listener: (item: SettingsType) => void) {
        this.itemClickedListeners = this.itemClickedListeners.filter((currentListener: (item: SettingsType) => void) => {
            return listener !== currentListener;
        });
    }

    private notifyItemClicked(item: SettingsType) {
        this.itemClickedListeners.forEach((listener: (item: SettingsType) => void) => {
            listener(item);
        });
    }
}
