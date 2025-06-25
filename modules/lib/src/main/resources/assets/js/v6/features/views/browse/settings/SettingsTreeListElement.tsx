import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {SettingsViewItem} from '../../../../../app/settings/view/SettingsViewItem';
import {$currentIds} from '../../../store/settingsTreeSelection.store';
import {getSettingsItem} from '../../../store/settings-tree.store';
import {SettingsTreeList, SettingsTreeListProps} from './SettingsTreeList';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class SettingsTreeListElement extends LegacyElement<typeof SettingsTreeList, SettingsTreeListProps> {
    private selectionChangedListeners: ((selectionChange: SelectionChange<SettingsViewItem>) => void)[] = [];

    constructor() {
        super({}, SettingsTreeList);
        this.initListeners();
    }

    private initListeners(): void {
        const unsubscribeCurrentIds = $currentIds.listen((currentIds, previousIds) => {
            this.notifySelectionChanged(this.getSelectionChange(new Set(currentIds), new Set(previousIds)));
        });

        this.onRemoved(() => {
            unsubscribeCurrentIds();
        });
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<SettingsViewItem>) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    protected notifySelectionChanged(selectionChange: SelectionChange<SettingsViewItem>): void {
        this.selectionChangedListeners.forEach((listener) => listener(selectionChange));
    }

    private getSelectionChange(
        newSelection: ReadonlySet<string>,
        oldSelection: ReadonlySet<string>
    ): SelectionChange<SettingsViewItem> {
        const selected: SettingsViewItem[] = [];
        const deselected: SettingsViewItem[] = [];

        newSelection.forEach((id) => {
            if (!oldSelection.has(id)) {
                const item = getSettingsItem(id);
                if (item) {
                    selected.push(item);
                }
            }
        });

        oldSelection.forEach((id) => {
            if (!newSelection.has(id)) {
                const item = getSettingsItem(id);
                if (item) {
                    deselected.push(item);
                }
            }
        });

        return {selected, deselected};
    }

    setContextMenuActions(actions: Action[]): void {
        this.props.setKey('contextMenuActions', actions);
    }
}
