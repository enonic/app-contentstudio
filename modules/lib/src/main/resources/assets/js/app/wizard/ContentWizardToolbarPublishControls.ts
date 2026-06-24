import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {MenuButtonDropdownPos} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {ContentWizardPublishMenuButton} from '../browse/ContentWizardPublishMenuButton';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {type BasePublishAction} from './action/BasePublishAction';
import {type ContentWizardActions} from './action/ContentWizardActions';

export class ContentWizardToolbarPublishControls
    extends DivEl {

    private publishButton: ContentWizardPublishMenuButton;

    private actions: ContentWizardActions;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.actions = actions;

        this.createPublishButton(actions);

        this.initListeners();

        this.appendChild(this.publishButton);

        this.makeTabbable();
    }

    private createPublishButton(actions: ContentWizardActions) {
        this.publishButton = new ContentWizardPublishMenuButton({
            defaultAction: actions.getOpenRequestAction(),
            menuActions: [
                actions.getMarkAsReadyAction(),
                actions.getPublishAction(),
                actions.getPublishTreeAction(),
                actions.getUnpublishAction(),
                actions.getRequestPublishAction(),
                actions.getOpenRequestAction(),
                actions.getCreateIssueAction()
            ],
            dropdownPosition: MenuButtonDropdownPos.RIGHT
        });

        actions.getOpenRequestAction().onExecuted(() => {
            if (this.publishButton.getPublishRequest()) {
                IssueDialogsManager.get().openDetailsDialog(this.publishButton.getPublishRequest());
            }
        });

        const actionsWithSaveBeforeExecution: BasePublishAction[] = [
            actions.getPublishAction() as BasePublishAction,
            actions.getRequestPublishAction() as BasePublishAction
        ];
        actionsWithSaveBeforeExecution.forEach(action => {
            action.onBeforeExecute(() => {
                if (action.mustSaveBeforeExecution()) {
                    this.publishButton.collapseMenu();
                }
            });
        });

        this.publishButton.addClass('content-wizard-toolbar-publish-button');
    }

    protected initListeners() {
        this.actions.onBeforeActionsStashed(() => {
            this.publishButton.setRefreshDisabled(true);
        });

        this.actions.onActionsUnstashed(() => {
            this.publishButton.setRefreshDisabled(false);
        });
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentWizardToolbarPublishControls {
        this.publishButton.setItem(content);
        return this;
    }

    getPublishButton(): ContentWizardPublishMenuButton {
        return this.publishButton;
    }
}
