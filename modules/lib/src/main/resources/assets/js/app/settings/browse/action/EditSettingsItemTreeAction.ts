import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {EditSettingsItemEvent} from '../../event/EditSettingsItemEvent';
import {type SettingsViewItem} from '../../view/SettingsViewItem';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class EditSettingsItemTreeAction
    extends Action {

    constructor(tree: SelectableListBoxWrapper<SettingsViewItem>) {
        super(i18n('action.edit'), 'mod+e');
        this.onExecuted(() => {
            const items: SettingsViewItem[] = tree.getSelectedItems();
            new EditSettingsItemEvent(items).fire();
        });
    }
}
