import {DropdownButtonRow} from 'lib-admin-ui/ui/dialog/DropdownButtonRow';
import {MenuButton} from 'lib-admin-ui/ui/button/MenuButton';
import {Action} from 'lib-admin-ui/ui/Action';

export class IssueDetailsDialogButtonRow extends DropdownButtonRow {

    makeActionMenu(mainAction: Action, menuActions: Action[], useDefault: boolean = true): MenuButton {
        super.makeActionMenu(mainAction, menuActions, useDefault);

        return <MenuButton>this.actionMenu.addClass('issue-dialog-menu');
    }

}
