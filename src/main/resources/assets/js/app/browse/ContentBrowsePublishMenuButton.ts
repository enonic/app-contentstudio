import {ContentPublishMenuAction, ContentPublishMenuButton, ContentPublishMenuButtonConfig} from './ContentPublishMenuButton';
import {Action} from 'lib-admin-ui/ui/Action';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';

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
            this.markAsReadyAction.getAction(),
            this.publishAction.getAction(),
            this.publishTreeAction.getAction(),
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

    updateActiveClass() {
        const isSingleItemToDelete = this.isItemPendingDelete() && this.publishAction.isEnabled();

        if (isSingleItemToDelete) {
            this.setActiveClass(this.publishAction.getActionClass());
        } else {
            const anyItemsActiveClass = this.getActiveClassForAnyItems();
            if (anyItemsActiveClass != null) {
                this.setActiveClass(anyItemsActiveClass);
            } else {
                const activeClass = this.item != null ? this.createIssueAction.getActionClass() : 'no-item';
                this.setActiveClass(activeClass);
            }
        }
    }

    protected getActiveClassForAnyItems(): string {
        if (this.markAsReadyAction.isEnabled()) {
            return this.markAsReadyAction.getActionClass();
        }
        if (this.publishAction.isEnabled()) {
            return this.publishAction.getActionClass();
        }
        if (this.publishTreeAction.isEnabled()) {
            return this.publishTreeAction.getActionClass();
        }
        if (this.unpublishAction.isEnabled()) {
            return this.unpublishAction.getActionClass();
        }
        if (this.requestPublishAction.isEnabled()) {
            return this.requestPublishAction.getActionClass();
        }
        return null;
    }
}
