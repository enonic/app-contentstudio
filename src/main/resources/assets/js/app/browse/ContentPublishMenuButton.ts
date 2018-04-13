import '../../api.ts';
import {ContentTreeGridActions} from './action/ContentTreeGridActions';
import MenuButton = api.ui.button.MenuButton;
import MenuButtonProgressBarManager = api.ui.button.MenuButtonProgressBarManager;

export class ContentPublishMenuButton extends MenuButton {

    constructor(actions: ContentTreeGridActions) {
        super(actions.getPublishAction(), [actions.getPublishTreeAction(), actions.getUnpublishAction(), actions.getCreateIssueAction()]);
        this.addClass('content-publish-menu');
        this.appendChild(MenuButtonProgressBarManager.getProgressBar());
    }
}
