import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {LayerViewer} from '../layer/LayerViewer';
import {LayerContext} from '../layer/LayerContext';
import {ListContentLayerRequest} from '../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../content/ContentLayer';
import TogglerButton = api.ui.button.TogglerButton;
import CycleButton = api.ui.button.CycleButton;
import AppIcon = api.app.bar.AppIcon;
import Application = api.app.Application;
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class ContentWizardToolbar
    extends ContentStatusToolbar {

    private componentsViewToggler: TogglerButton;
    private cycleViewModeButton: CycleButton;
    private contentWizardToolbarPublishControls: ContentWizardToolbarPublishControls;
    private mobileItemStatisticsButton: TogglerButton;

    constructor(application: Application, actions: ContentWizardActions, item?: ContentSummaryAndCompareStatus) {
        super('content-wizard-toolbar');

        this.addHomeButton(application);
        this.addActionButtons(actions);
        this.addLayerInfo();
        this.addPublishMenuButton(actions);
        this.addTogglerButtons(actions);
        this.addMobileItemStatisticsButton();

        if (item) {
            this.setItem(item);
        }
    }

    private addHomeButton(application: Application) {
        let homeAction = new Action(application.getName());
        homeAction.onExecuted(() => {
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
            actions.getUndoPendingDeleteAction()
        ]);
        super.addGreedySpacer();
    }

    private addLayerInfo() {
        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            if (layers.length > 1) {
                const layerViewer: LayerViewer = new LayerViewer();
                layerViewer.setObject(LayerContext.get().getCurrentLayer());
                super.addElement(layerViewer);
                this.addClass('has-layers');
            }
        }).catch(api.DefaultErrorHandler.handle);
    }

    private addPublishMenuButton(actions: ContentWizardActions) {
        this.status.hide();
        this.author.hide();

        this.contentWizardToolbarPublishControls = new ContentWizardToolbarPublishControls(actions);
        this.contentWizardToolbarPublishControls.getPublishButton().hide();
        super.addElement(this.contentWizardToolbarPublishControls);

        this.contentWizardToolbarPublishControls.getPublishButton().onInitialized(() => {
            this.status.show();
            this.author.show();
            this.contentWizardToolbarPublishControls.getPublishButton().show();
            // Call after the ContentPublishMenuButton.handleActionsUpdated debounced calls
            setTimeout(() => this.foldOrExpand());
        });
    }

    private addTogglerButtons(actions: ContentWizardActions) {
        this.cycleViewModeButton = new CycleButton([actions.getShowLiveEditAction(), actions.getShowFormAction()]);
        this.componentsViewToggler = new TogglerButton('icon-clipboard', i18n('field.showComponent'));

        super.addElement(this.cycleViewModeButton);
        super.addElement(this.componentsViewToggler);
    }

    getCycleViewModeButton(): CycleButton {
        return this.cycleViewModeButton;
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
        this.mobileItemStatisticsButton.setEnabled(true).addClass('icon-cog details-toggle');
        super.addElement(this.mobileItemStatisticsButton);
    }
}
