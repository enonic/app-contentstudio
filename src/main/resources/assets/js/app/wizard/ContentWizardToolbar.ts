import '../../api.ts';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import CycleButton = api.ui.button.CycleButton;
import TogglerButton = api.ui.button.TogglerButton;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import i18n = api.util.i18n;

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private contextWindowToggler: TogglerButton;
    private componentsViewToggler: TogglerButton;
    private cycleViewModeButton: CycleButton;
    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;

    constructor(actions: ContentWizardActions, item?: ContentSummaryAndCompareStatus) {
        super('content-wizard-toolbar');

        this.addActionButtons(actions);
        this.addPublishMenuButton(actions);
        this.addTogglerButtons(actions);

        if (item) {
            this.setItem(item);
        }
    }

    private addActionButtons(actions: ContentWizardActions) {
        super.addActions([
            actions.getSaveAction(),
            actions.getDeleteAction(),
            actions.getDuplicateAction(),
            actions.getPreviewAction(),
            actions.getUndoPendingDeleteAction(),
            actions.getUnpublishAction()
        ]);
        super.addGreedySpacer();
    }

    private addPublishMenuButton(actions: ContentWizardActions) {
        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(actions);
        super.addElement(this.contentWizardToolbarPublishControls);
    }

    private addTogglerButtons(actions: ContentWizardActions) {
        this.cycleViewModeButton = new CycleButton([actions.getShowLiveEditAction(), actions.getShowFormAction()]);
        this.componentsViewToggler = new TogglerButton('icon-clipboard', i18n('field.showComponent'));
        this.contextWindowToggler = new TogglerButton('icon-cog', i18n('field.showInspection'));

        super.addElement(this.cycleViewModeButton);
        super.addElement(this.contextWindowToggler);
        super.addElement(this.componentsViewToggler);
    }

    getCycleViewModeButton(): CycleButton {
        return this.cycleViewModeButton;
    }

    getContextWindowToggler(): TogglerButton {
        return this.contextWindowToggler;
    }

    getComponentsViewToggler(): TogglerButton {
        return this.componentsViewToggler;
    }

    getContentWizardToolbarPublishControls() {
        return this.contentWizardToolbarPublishControls;
    }

}
