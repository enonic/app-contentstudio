import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {type MenuButton, type MenuButtonConfig} from '@enonic/lib-admin-ui/ui/button/MenuButton';

export class IssueDetailsDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(menuButtonConfig: MenuButtonConfig, useDefault: boolean = true): MenuButton {
        super.makeActionMenu(menuButtonConfig, useDefault);

        return this.actionMenu.addClass('issue-dialog-menu') as MenuButton;
    }

}
