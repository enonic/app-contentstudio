import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentWizardPublishMenuButton} from '../browse/ContentWizardPublishMenuButton';
import ActionButton = api.ui.button.ActionButton;

export class ContentWizardToolbarPublishControls
    extends api.dom.DivEl {

    private publishButton: ContentWizardPublishMenuButton;
    private publishButtonForMobile: ActionButton;

    constructor(actions: ContentWizardActions) {
        super('toolbar-publish-controls');

        this.publishButton = new ContentWizardPublishMenuButton({
            publishAction: actions.getPublishAction(),
            unpublishAction: actions.getUnpublishAction(),
            markAsReadyAction: actions.getMarkAsReadyAction(),
            createIssueAction: actions.getCreateIssueAction(),
            requestPublishAction: actions.getRequestPublishAction(),
            openRequestAction: actions.getOpenRequestAction()
        });

        actions.getPublishAction().setIconClass('publish-action');
        this.publishButton.addClass('content-wizard-toolbar-publish-button');

        this.publishButtonForMobile = new ActionButton(actions.getPublishMobileAction());
        this.publishButtonForMobile.addClass('mobile-edit-publish-button');
        this.publishButtonForMobile.setVisible(false);

        this.appendChild(this.publishButton);

        actions.onBeforeActionsStashed(() => {
            this.publishButton.setRefreshDisabled(true);
        });

        actions.onActionsUnstashed(() => {
            this.publishButton.setRefreshDisabled(false);
        });
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentWizardToolbarPublishControls {
        this.publishButton.setItem(content);
        return this;
    }

    getPublishButtonForMobile(): ActionButton {
        return this.publishButtonForMobile;
    }

    getPublishButton(): ContentWizardPublishMenuButton {
        return this.publishButton;
    }
}
