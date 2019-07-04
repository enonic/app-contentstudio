import {ContentPublishMenuAction, ContentPublishMenuButton, ContentPublishMenuButtonConfig} from './ContentPublishMenuButton';
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;

export interface ContentBrowsePublishMenuButtonConfig
    extends ContentPublishMenuButtonConfig {
    publishTreeAction: Action;
    showCreateIssueButtonByDefault?: boolean;
}

export class ContentBrowsePublishMenuButton
    extends ContentPublishMenuButton {

    private publishTreeAction: ContentPublishMenuAction;

    private publishTreeButton: ActionButton;

    constructor(config: ContentBrowsePublishMenuButtonConfig) {
        super(config);

        if (config.showCreateIssueButtonByDefault) {
            this.setActiveClass('no-item');
        }
    }

    protected initMenuActions(config: ContentBrowsePublishMenuButtonConfig) {
        super.initMenuActions(config);

        this.publishTreeAction = new ContentPublishMenuAction(config.publishTreeAction, 'publish-tree');
    }

    protected getActions(): Action[] {
        return [
            this.publishAction.getAction(),
            this.publishTreeAction.getAction(),
            this.markAsReadyAction.getAction(),
            this.unpublishAction.getAction(),
            this.requestPublishAction.getAction(),
            this.createIssueAction.getAction()
        ];
    }

    protected initButtons() {
        super.initButtons();

        this.publishTreeButton = new ActionButton(this.publishTreeAction.getAction());
    }

    protected getButtons(): ActionButton[] {
        return [this.publishTreeButton, this.markAsReadyButton, this.unpublishButton, this.requestPublishButton, this.createIssueButton];
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.publishTreeButton.addClass('publish-tree-action-button');

            return rendered;
        });
    }

    protected updateActiveClass() {
        if (!this.item) {
            if (this.publishAction.isEnabled()) {
                this.setActiveClass(this.publishAction.getActionClass()); // when multiple items selected
            } else {
                this.setActiveClass('no-item');
            }
        } else if (this.publishAction.isEnabled()) {
            this.setActiveClass(this.publishAction.getActionClass());
        } else if (this.publishTreeAction.isEnabled()) {
            this.setActiveClass(this.publishTreeAction.getActionClass());
        } else if (this.markAsReadyAction.isEnabled()) {
            this.setActiveClass(this.markAsReadyAction.getActionClass());
        } else if (this.unpublishAction.isEnabled()) {
            this.setActiveClass(this.unpublishAction.getActionClass());
        } else if (this.requestPublishAction.isEnabled()) {
            this.setActiveClass(this.requestPublishAction.getActionClass());
        } else {
            this.setActiveClass(this.createIssueAction.getActionClass());
        }
    }
}
