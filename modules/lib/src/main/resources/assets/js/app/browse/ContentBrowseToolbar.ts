import {ActionName, ContentTreeGridActions} from './action/ContentTreeGridActions';
import {Toolbar} from 'lib-admin-ui/ui/toolbar/Toolbar';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {Element} from 'lib-admin-ui/dom/Element';

export class ContentBrowseToolbar
    extends Toolbar {

    private readonly hideMobilePreviewButton: Button;

    private readonly allActions: ContentTreeGridActions;

    constructor(actions: ContentTreeGridActions) {
        super();

        this.allActions = actions;
        this.addClass('content-browse-toolbar');
        actions.getAction(ActionName.UNDO_PENDING_DELETE).setVisible(false);
        this.addActions(actions.getAllActionsNoPublish());

        this.hideMobilePreviewButton = new Button();
        this.hideMobilePreviewButton.addClass('hide-mobile-preview-button icon-arrow-left2');

        this.prependChild(this.hideMobilePreviewButton);
    }

    onFoldClicked(action: () => void) {
        this.hideMobilePreviewButton.onClicked(action);
    }

    setFoldButtonLabel(value: string) {
        this.fold.setLabel(value);
    }

    enableMobileMode(): void {
        this.setLocked(true);
        this.addAction(this.allActions.getPublishActions()[0]).addClass('publish-action');
        this.doFold(true);
    }

    disableMobileMode(): void {
        this.setLocked(false);
        this.removeAction(this.allActions.getPublishActions()[0]);
        this.doExpand();
    }

    protected isItemAllowedToFold(elem: Element): boolean {
        return super.isItemAllowedToFold(elem) && elem.getId() !== this.hideMobilePreviewButton.getId();
    }
}
