import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentWizardPublishMenuButton} from '../browse/ContentWizardPublishMenuButton';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {BasePublishAction} from './action/BasePublishAction';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';

export class ContentWizardToolbarPublishControls
    extends DivEl {

    private publishButton: ContentWizardPublishMenuButton;

    private mobilePublishControls: DivEl;

    private actions: ContentWizardActions;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.actions = actions;

        this.createPublishButton(actions);

        this.initMobilePublishControls();

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
                actions.getUnpublishAction(),
                actions.getRequestPublishAction(),
                actions.getOpenRequestAction(),
                actions.getCreateIssueAction()
            ]
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

    protected initMobilePublishControls() {
        this.mobilePublishControls = new DivEl('mobile-edit-publish-controls');
        const publishButtonForMobile = this.createPublishButtonForMobile();
        const markAsReadyButtonForMobile = this.createMarkAsReadyButtonForMobile();
        this.mobilePublishControls.appendChildren(publishButtonForMobile, markAsReadyButtonForMobile);

        this.handleMarkAsReadyStatus();
    }

    protected createPublishButtonForMobile(): ActionButton {
        const publishButtonForMobile = new ActionButton(this.actions.getPublishAction());
        publishButtonForMobile.addClass('mobile-edit-publish-button');

        return publishButtonForMobile;
    }

    protected createMarkAsReadyButtonForMobile(): ActionButton {
        const markAsReadyButtonForMobile = new ActionButton(this.actions.getMarkAsReadyAction());
        markAsReadyButtonForMobile.addClass('mobile-edit-mark-as-ready-button');

        return markAsReadyButtonForMobile;
    }

    protected initListeners() {
        const publishAction = this.actions.getPublishAction();
        const markAsReadyAction = this.actions.getMarkAsReadyAction();

        publishAction.onPropertyChanged(() => {
            this.handleControlsChanged();
        });

        markAsReadyAction.onPropertyChanged(() => {
            this.handleControlsChanged();
            this.handleMarkAsReadyStatus();
        });

        this.actions.onBeforeActionsStashed(() => {
            this.publishButton.setRefreshDisabled(true);
        });

        this.actions.onActionsUnstashed(() => {
            this.publishButton.setRefreshDisabled(false);
        });
    }

    private handleControlsChanged() {
        const publishAction = this.actions.getPublishAction();
        const markAsReadyAction = this.actions.getMarkAsReadyAction();

        const controlsEnabled = publishAction.isEnabled() || markAsReadyAction.isEnabled();
        this.mobilePublishControls.toggleClass('enabled', controlsEnabled);
    }

    private handleMarkAsReadyStatus() {
        const markAsReadyAction = this.actions.getMarkAsReadyAction();

        const markAsReadyEnabled = markAsReadyAction.isEnabled();
        this.mobilePublishControls.toggleClass('mark-as-ready', markAsReadyEnabled);
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentWizardToolbarPublishControls {
        this.publishButton.setItem(content);
        return this;
    }

    getMobilePublishControls(): DivEl {
        return this.mobilePublishControls;
    }

    getPublishButton(): ContentWizardPublishMenuButton {
        return this.publishButton;
    }
}
