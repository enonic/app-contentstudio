import '../../api.ts';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {CycleButton} from './CycleButton';
import TogglerButton = api.ui.button.TogglerButton;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import AppIcon = api.app.bar.AppIcon;
import Application = api.app.Application;
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private contextWindowToggler: TogglerButton;
    private componentsViewToggler: TogglerButton;
    private cycleViewModeButton: CycleButton;
    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;
    private mobileItemStatisticsButton: TogglerButton;

    constructor(application: Application, actions: ContentWizardActions, item?: ContentSummaryAndCompareStatus) {
        super('content-wizard-toolbar');

        this.addHomeButton(application);
        this.addActionButtons(actions);
        this.addPublishMenuButton(actions);
        this.addTogglerButtons(actions);
        this.addMobileItemStatisticsButton();

        if (item) {
            this.setItem(item);
        }
    }

    private addHomeButton(application: Application) {
        let homeAction = new Action(application.getName());
        homeAction.onExecuted((action) => {
            let tabId;
            if (navigator.userAgent.search('Chrome') > -1) {
                // add tab id for browsers that can focus tabs by id
                tabId = application.getId();
            }
            window.open('#/browse', tabId);     // add browse to prevent tab reload because of url mismatch
            return wemQ(null);
        });

        super.addElement(new AppIcon(application, homeAction));
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

    getMobileItemStatisticsToggler(): TogglerButton {
        return this.mobileItemStatisticsButton;
    }

    private addMobileItemStatisticsButton() {
        this.mobileItemStatisticsButton = new api.ui.button.TogglerButton();
        this.mobileItemStatisticsButton.setEnabled(true).addClass('details-toggle');
        super.addElement(this.mobileItemStatisticsButton);
    }
}
