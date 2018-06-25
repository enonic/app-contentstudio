import '../../api.ts';
import {DefaultModels} from './page/DefaultModels';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import {SettingsWizardStepForm} from './SettingsWizardStepForm';
import {ScheduleWizardStepForm} from './ScheduleWizardStepForm';
import {SecurityWizardStepForm} from './SecurityWizardStepForm';
import {DisplayNameScriptExecutor} from './DisplayNameScriptExecutor';
import {LiveFormPanel, LiveFormPanelConfig} from './page/LiveFormPanel';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardPanelParams} from './ContentWizardPanelParams';
import {ContentWizardToolbar} from './ContentWizardToolbar';
import {ContentWizardStep} from './ContentWizardStep';
import {ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';
import {Router} from '../Router';
import {PersistNewContentRoutine} from './PersistNewContentRoutine';
import {UpdatePersistedContentRoutine} from './UpdatePersistedContentRoutine';
import {ContentWizardDataLoader} from './ContentWizardDataLoader';
import {ThumbnailUploaderEl} from './ThumbnailUploaderEl';
import {LiveEditModel} from '../../page-editor/LiveEditModel';
import {PageModel} from '../../page-editor/PageModel';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import PropertyTree = api.data.PropertyTree;
import FormView = api.form.FormView;
import ContentFormContext = api.content.form.ContentFormContext;
import Content = api.content.Content;
import ContentId = api.content.ContentId;
import ContentPath = api.content.ContentPath;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import CompareStatus = api.content.CompareStatus;
import PublishStatus = api.content.PublishStatus;
import ContentBuilder = api.content.ContentBuilder;
import ContentName = api.content.ContentName;
import ContentUnnamed = api.content.ContentUnnamed;
import CreateContentRequest = api.content.resource.CreateContentRequest;
import UpdateContentRequest = api.content.resource.UpdateContentRequest;
import GetContentByIdRequest = api.content.resource.GetContentByIdRequest;
import ExtraData = api.content.ExtraData;
import Page = api.content.page.Page;
import Site = api.content.site.Site;
import SiteModel = api.content.site.SiteModel;
import ContentType = api.schema.content.ContentType;
import ContentTypeName = api.schema.content.ContentTypeName;

import ConfirmationDialog = api.ui.dialog.ConfirmationDialog;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import ResponsiveRanges = api.ui.responsive.ResponsiveRanges;
import ResponsiveItem = api.ui.responsive.ResponsiveItem;
import TogglerButton = api.ui.button.TogglerButton;
import WizardHeaderWithDisplayNameAndName = api.app.wizard.WizardHeaderWithDisplayNameAndName;
import WizardHeaderWithDisplayNameAndNameBuilder = api.app.wizard.WizardHeaderWithDisplayNameAndNameBuilder;
import ContentRequiresSaveEvent = api.content.event.ContentRequiresSaveEvent;
import ImageErrorEvent = api.content.image.ImageErrorEvent;

import Application = api.application.Application;
import ApplicationKey = api.application.ApplicationKey;
import ApplicationEvent = api.application.ApplicationEvent;
import Mixin = api.schema.mixin.Mixin;
import MixinName = api.schema.mixin.MixinName;
import GetContentXDataRequest = api.schema.xdata.GetContentXDataRequest;

import ContentDeletedEvent = api.content.event.ContentDeletedEvent;
import ContentNamedEvent = api.content.event.ContentNamedEvent;
import BeforeContentSavedEvent = api.content.event.BeforeContentSavedEvent;
import ContentServerChangeItem = api.content.event.ContentServerChangeItem;

import Toolbar = api.ui.toolbar.Toolbar;
import CycleButton = api.ui.button.CycleButton;

import Permission = api.security.acl.Permission;
import AccessControlEntry = api.security.acl.AccessControlEntry;
import i18n = api.util.i18n;

import IsRenderableRequest = api.content.page.IsRenderableRequest;
import NavigatorEvent = api.ui.NavigatorEvent;

export class ContentWizardPanel
    extends api.app.wizard.WizardPanel<Content> {

    protected wizardActions: ContentWizardActions;

    private contentParams: ContentWizardPanelParams;

    private parentContent: Content;

    private defaultModels: DefaultModels;

    private site: Site;

    private contentType: ContentType;

    private siteModel: SiteModel;

    private liveEditModel: LiveEditModel;

    private contentWizardStep: ContentWizardStep;

    private contentWizardStepForm: ContentWizardStepForm;

    private settingsWizardStepForm: SettingsWizardStepForm;

    private settingsWizardStep: ContentWizardStep;

    private scheduleWizardStepForm: ScheduleWizardStepForm;

    private scheduleWizardStep: ContentWizardStep;

    private scheduleWizardStepIndex: number;

    private securityWizardStepForm: SecurityWizardStepForm;

    private xDataStepFormByName: { [name: string]: XDataWizardStepForm; };

    private displayNameScriptExecutor: DisplayNameScriptExecutor;

    private requireValid: boolean;

    private isContentFormValid: boolean;

    private contentNamedListeners: { (event: ContentNamedEvent): void }[];

    private inMobileViewMode: boolean;

    private skipValidation: boolean;

    private currentContent: ContentSummaryAndCompareStatus;

    private persistedContent: ContentSummaryAndCompareStatus;

    private dataChangedHandler: () => void;

    private dataChangedListeners: { (): void } [];

    private applicationAddedListener: (event: api.content.site.ApplicationAddedEvent) => void;

    private applicationRemovedListener: (event: api.content.site.ApplicationRemovedEvent) => void;

    private applicationUnavailableListener: (event: ApplicationEvent) => void;

    private applicationStartedListener: (event: ApplicationEvent) => void;

    private static EDITOR_DISABLED_TYPES: ContentTypeName[] = [
        ContentTypeName.FOLDER,
        ContentTypeName.TEMPLATE_FOLDER,
        ContentTypeName.SHORTCUT,
        ContentTypeName.UNSTRUCTURED,
    ];

    private contentUpdateDisabled: boolean;

    private missingOrStoppedAppKeys: ApplicationKey[] = [];

    private contentDeleted: boolean;

    private renderable: boolean = false;

    private reloadPageEditorOnSave: boolean = true;

    private xDataAnchor: ContentTabBarItem;

    public static debug: boolean = false;

    constructor(params: ContentWizardPanelParams) {
        super({
            tabId: params.tabId
        });

        this.contentParams = params;

        this.loadData();

        this.isContentFormValid = false;

        this.requireValid = false;
        this.skipValidation = false;
        this.contentNamedListeners = [];
        this.dataChangedListeners = [];
        this.contentUpdateDisabled = false;

        this.displayNameScriptExecutor = new DisplayNameScriptExecutor();

        this.xDataStepFormByName = {};

        this.initListeners();
        this.listenToContentEvents();
        this.handleSiteConfigApply();
        this.handleBrokenImageInTheWizard();
        this.initBindings();
    }

    private initBindings() {
        let nextActions = this.resolveActions(this);
        let currentKeyBindings = api.ui.Action.getKeyBindings(nextActions);
        api.ui.KeyBindings.get().bindKeys(currentKeyBindings);
    }

    protected createWizardActions(): ContentWizardActions {
        let wizardActions: ContentWizardActions = new ContentWizardActions(this);
        wizardActions.getShowLiveEditAction().setEnabled(false);
        wizardActions.getSaveAction().onExecuted(() => {
            this.contentWizardStepForm.validate();
            this.displayValidationErrors(!this.isValid());
        });

        wizardActions.getShowSplitEditAction().onExecuted(() => {
            if (!this.inMobileViewMode) {
                this.getCycleViewModeButton()
                    .selectActiveAction(wizardActions.getShowLiveEditAction());
            }
        });

        let publishActionHandler = () => {
            if (this.hasUnsavedChanges()) {
                this.contentWizardStepForm.validate();
                this.displayValidationErrors(!this.isValid());
            }
        };

        wizardActions.getPublishAction().onExecuted(publishActionHandler);
        wizardActions.getUnpublishAction().onExecuted(publishActionHandler);
        wizardActions.getPublishTreeAction().onExecuted(publishActionHandler);

        return wizardActions;
    }

    private initListeners() {

        let shownAndLoadedHandler = () => {
            if (this.getPersistedItem()) {
                Router.setHash('edit/' + this.getPersistedItem().getId());
            } else {
                Router.setHash('new/' + this.contentType.getName());
            }
        };

        this.onShown(() => {
            if (this.isDataLoaded()) {
                shownAndLoadedHandler();
            } else {
                this.onDataLoaded(shownAndLoadedHandler);
            }
        });

        this.onContentNamed(event => {
            // content path has changed so update site as well
            const content = event.getContent();
            if (content.isSite()) {
                this.site = <Site>content;
            } else {
                new ContentWizardDataLoader().loadSite(content.getContentId()).then(site => {
                    this.site = site;
                });
            }
        });

        this.dataChangedHandler = () => {
            setTimeout(this.updatePublishStatusOnDataChange.bind(this), 100);

            this.notifyDataChanged();
        };

        this.applicationAddedListener = (event: api.content.site.ApplicationAddedEvent) => {
            this.addMetadataStepForms(event.getApplicationKey());
        };

        this.applicationRemovedListener = (event: api.content.site.ApplicationRemovedEvent) => {
            this.removeMetadataStepForms(event.getApplicationKey());
        };

        this.applicationUnavailableListener = (event: ApplicationEvent) => {
            let isAppFromSiteModelUnavailable: boolean = this.siteModel.getApplicationKeys().some((applicationKey: ApplicationKey) => {
                return event.getApplicationKey().equals(applicationKey);
            });

            if (isAppFromSiteModelUnavailable) {
                this.missingOrStoppedAppKeys.push(event.getApplicationKey());

                let message = i18n('notify.app.missing', event.getApplicationKey().toString());

                if (this.isVisible()) {
                    api.notify.showWarning(message);
                } else {
                    let shownHandler = () => {
                        new api.application.GetApplicationRequest(event.getApplicationKey()).sendAndParse()
                            .then(
                                (application: Application) => {
                                    if (application.getState() === 'stopped') {
                                        api.notify.showWarning(message);
                                    }
                                })
                            .catch((reason: any) => { //app was uninstalled
                                api.notify.showWarning(message);
                            });

                        this.unShown(shownHandler);
                    };

                    this.onShown(shownHandler);
                }

                this.handleMissingApp();
            }
        };

        this.applicationStartedListener = (event: ApplicationEvent) => {
            let isAppFromSiteModelStarted: boolean = this.siteModel.getApplicationKeys().some((applicationKey: ApplicationKey) => {
                return event.getApplicationKey().equals(applicationKey);
            });

            if (isAppFromSiteModelStarted) {
                let indexToRemove = -1;
                this.missingOrStoppedAppKeys.some((applicationKey: ApplicationKey, index) => {
                    indexToRemove = index;
                    return event.getApplicationKey().equals(applicationKey);
                });
                if (indexToRemove > -1) {
                    this.missingOrStoppedAppKeys.splice(indexToRemove, 1);
                }
                this.handleMissingApp();
            }
        };

        api.app.wizard.MaskContentWizardPanelEvent.on(event => {
            if (this.getPersistedItem().getContentId().equals(event.getContentId())) {
                this.wizardActions.suspendActions(event.isMask());
            }
        });

    }

    protected doLoadData(): Q.Promise<api.content.Content> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.doLoadData at ' + new Date().toISOString());
        }
        return new ContentWizardDataLoader().loadData(this.contentParams)
            .then((loader) => {
                if (ContentWizardPanel.debug) {
                    console.debug('ContentWizardPanel.doLoadData: loaded data at ' + new Date().toISOString(), loader);
                }
                if (loader.content) {
                    // in case of new content will be created in super.loadData()
                    this.formState.setIsNew(false);
                    this.setPersistedItem(loader.content);
                }
                this.defaultModels = loader.defaultModels;
                this.site = loader.siteContent;
                this.contentType = loader.contentType;
                this.parentContent = loader.parentContent;
                this.persistedContent = this.currentContent =
                    ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                        loader.content, loader.compareStatus, loader.publishStatus
                    );

            }).then(() => super.doLoadData());
    }

    protected createFormIcon(): ThumbnailUploaderEl {
        let thumbnailUploader = new ThumbnailUploaderEl({
            name: 'thumbnail-uploader',
            deferred: true
        });

        if (this.contentParams.createSite || this.getPersistedItem().isSite()) {
            thumbnailUploader.addClass('site');
        }

        return thumbnailUploader;
    }

    public getFormIcon(): ThumbnailUploaderEl {
        return <ThumbnailUploaderEl> super.getFormIcon();
    }

    protected createMainToolbar(): Toolbar {
        return new ContentWizardToolbar(this.contentParams.application, this.wizardActions);
    }

    public getMainToolbar(): ContentWizardToolbar {
        return <ContentWizardToolbar> super.getMainToolbar();
    }

    protected createWizardHeader(): api.app.wizard.WizardHeader {
        let header = new WizardHeaderWithDisplayNameAndNameBuilder()
            .setDisplayNameGenerator(this.displayNameScriptExecutor)
            .build();

        if (this.parentContent) {
            header.setPath(this.parentContent.getPath().prettifyUnnamedPathElements().toString() + '/');
        } else {
            header.setPath('/');
        }

        let existing = this.getPersistedItem();
        if (!!existing) {
            header.initNames(existing.getDisplayName(), existing.getName().toString(), false);
        }

        header.onPropertyChanged(this.dataChangedHandler);

        return header;
    }

    public getWizardHeader(): WizardHeaderWithDisplayNameAndName {
        return <WizardHeaderWithDisplayNameAndName> super.getWizardHeader();
    }

    protected createLivePanel(): api.ui.panel.Panel {
        let liveFormPanel;
        let isSiteOrWithinSite = !!this.site || this.contentParams.createSite;
        let isPageTemplate = this.contentType.isPageTemplate();
        let isShortcut = this.contentType.isShortcut();

        if ((isSiteOrWithinSite || isPageTemplate) && !isShortcut) {

            liveFormPanel = new LiveFormPanel(<LiveFormPanelConfig> {
                contentWizardPanel: this,
                contentType: this.contentType.getContentTypeName(),
                defaultModels: this.defaultModels
            });
        }
        return liveFormPanel;
    }

    public getLivePanel(): LiveFormPanel {
        return <LiveFormPanel> super.getLivePanel();
    }

    doRenderOnDataLoaded(rendered: boolean): Q.Promise<boolean> {

        return super.doRenderOnDataLoaded(rendered).then((renderedAfter: boolean) => {
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doRenderOnDataLoaded at ' + new Date().toISOString());
            }

            this.appendChild(this.getContentWizardToolbarPublishControls().getPublishButtonForMobile());

            if (this.contentType.hasContentDisplayNameScript()) {
                this.displayNameScriptExecutor.setScript(this.contentType.getContentDisplayNameScript());
            }

            this.addClass('content-wizard-panel');

            this.inMobileViewMode = false;

            ResponsiveManager.onAvailableSizeChanged(this, this.availableSizeChangedHandler.bind(this));

            this.onRemoved((event) => {
                ResponsiveManager.unAvailableSizeChanged(this);
            });

            const thumbnailUploader = this.getFormIcon();

            this.onValidityChanged((event: api.ValidityChangedEvent) => {

                if (!this.persistedContent) {
                    return;
                }

                let isThisValid = this.isValid(); // event.isValid() = false will prevent the call to this.isValid()
                this.isContentFormValid = isThisValid;
                if (thumbnailUploader) {
                    thumbnailUploader.toggleClass('invalid', !isThisValid);
                }
                this.getMainToolbar().toggleValid(isThisValid);
                this.getContentWizardToolbarPublishControls().setContentCanBePublished(this.checkContentCanBePublished());
                if (!this.formState.isNew()) {
                    this.displayValidationErrors(!(isThisValid && event.isValid()));
                }
            });

            if (thumbnailUploader) {
                thumbnailUploader.setEnabled(!this.contentType.isImage());
                thumbnailUploader.onFileUploaded(this.onFileUploaded.bind(this));
            }

            return rendered;
        });
    }

    private availableSizeChangedHandler(item: ResponsiveItem) {
        if (this.isVisible()) {
            this.updateStickyToolbar();
            if (item.isInRangeOrSmaller(ResponsiveRanges._720_960)) {
                this.inMobileViewMode = true;
                if (this.isSplitView()) {
                    if (this.isMinimized()) {
                        this.toggleMinimize();
                    }
                    this.showForm();
                    this.getCycleViewModeButton().selectActiveAction(this.wizardActions.getShowFormAction());
                }
            } else {
                if (this.inMobileViewMode && this.isLiveView()) {
                    this.inMobileViewMode = false;
                    this.showSplitEdit();
                }

                this.inMobileViewMode = false;
            }
        }
    }

    saveChanges(): wemQ.Promise<Content> {
        let liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {
            liveFormPanel.skipNextReloadConfirmation(true);
        }
        this.setRequireValid(false);
        this.contentUpdateDisabled = true;
        new BeforeContentSavedEvent().fire();
        return super.saveChanges().then((content: Content) => {

            const persistedItem = content.clone();

            if (liveFormPanel) {
                this.liveEditModel.setContent(persistedItem);
                if (this.reloadPageEditorOnSave) {
                    this.updateLiveForm(persistedItem).then(() => {
                        if (persistedItem.isSite()) {
                            this.updateWizardStepForms(persistedItem, false);
                        }
                    });
                }
            }

            if (persistedItem.getType().isImage()) {
                this.updateWizard(persistedItem);
            } else if (this.securityWizardStepForm) { // update security wizard to have new path/displayName etc.
                this.securityWizardStepForm.update(persistedItem);
            }

            this.resetDisabledXDataForms();

            return persistedItem;
        }).finally(() => {
            this.contentUpdateDisabled = false;
            this.updateButtonsState().then(() => this.getLivePanel().maximizeContentFormPanelIfNeeded());
        });
    }

    private handleSiteConfigApply() {
        let siteConfigApplyHandler = (event: ContentRequiresSaveEvent) => {
            if (this.isCurrentContentId(event.getContentId())) {
                this.saveChanges();
            }
        };

        ContentRequiresSaveEvent.on(siteConfigApplyHandler);
        this.onClosed(() => {
            ContentRequiresSaveEvent.un(siteConfigApplyHandler);
        });
    }

    private handleBrokenImageInTheWizard() {
        let brokenImageHandler = (event: ImageErrorEvent) => {
            if (this.isCurrentContentId(event.getContentId())) {
                this.wizardActions.setDeleteOnlyMode(this.getPersistedItem());
            }
        };

        ImageErrorEvent.on(brokenImageHandler);
        this.onClosed(() => {
            ImageErrorEvent.un(brokenImageHandler);
        });
    }

    getContentType(): ContentType {
        return this.contentType;
    }

    giveInitialFocus() {

        if (this.contentType.hasContentDisplayNameScript()) {
            if (!this.contentWizardStepForm.giveFocus()) {
                this.getWizardHeader().giveFocus();
            }
        } else {
            this.getWizardHeader().giveFocus();
        }

        this.startRememberFocus();
    }

    private onFileUploaded(event: api.ui.uploader.FileUploadedEvent<api.content.Content>) {
        let newPersistedContent: Content = event.getUploadItem().getModel();
        this.setPersistedItem(newPersistedContent.clone());
        this.updateMetadataAndMetadataStepForms(newPersistedContent);
        this.updateThumbnailWithContent(newPersistedContent);

        this.showFeedbackContentSaved(newPersistedContent);
    }

    close(checkCanClose: boolean = false) {
        let liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {
            liveFormPanel.skipNextReloadConfirmation(true);
        }
        super.close(checkCanClose);
    }

    private fetchApplication(key: ApplicationKey): wemQ.Promise<Application> {
        let deferred = wemQ.defer<Application>();
        new api.application.GetApplicationRequest(key).sendAndParse().then((app) => {
            if (app.getState() === Application.STATE_STOPPED) {
                this.missingOrStoppedAppKeys.push(key);
            }
            deferred.resolve(app);
        }).catch((reason) => {
            this.missingOrStoppedAppKeys.push(key);
            deferred.resolve(null);
        }).done();
        return deferred.promise;
    }

    private handleMissingApp() {
        const appsIsMissing = this.missingOrStoppedAppKeys.length > 0;
        const livePanel = this.getLivePanel();

        if (livePanel) {
            livePanel.toggleClass('no-preview', appsIsMissing);
        }

        this.getCycleViewModeButton().setEnabled(!appsIsMissing);

        this.getComponentsViewToggler().setVisible(this.renderable && !appsIsMissing);
        this.getContextWindowToggler().setVisible(this.renderable && !appsIsMissing);
    }

    public checkContentCanBePublished(): boolean {
        if (this.getContentWizardToolbarPublishControls().isPendingDelete()) {
            // allow deleting published content without validity check
            return true;
        }

        let allMetadataFormsValid = true;
        let allMetadataFormsHaveValidUserInput = true;
        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                let form = this.xDataStepFormByName[key];
                if (!form.isValid()) {
                    allMetadataFormsValid = false;
                }
                let formHasValidUserInput = form.getFormView().hasValidUserInput();
                if (!formHasValidUserInput) {
                    allMetadataFormsHaveValidUserInput = false;
                }
            }
        }
        return this.isContentFormValid && allMetadataFormsValid && allMetadataFormsHaveValidUserInput;
    }

    private hasDisabledExternalMixin(): boolean {
        let value = false;

        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                const form: XDataWizardStepForm = this.xDataStepFormByName[key];

                if (form.isExternal() && !form.isEnabled()) {
                    value = true;
                    break;
                }
            }
        }

        return value;
    }

    private areAllExternalMixinsCollapsed(): boolean {
        let value = true;

        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                const form: XDataWizardStepForm = this.xDataStepFormByName[key];

                if (form.isExternal() && form.isEnabled()) {
                    value = false;
                    break;
                }
            }
        }

        return value;
    }

    private isCurrentContentId(id: api.content.ContentId): boolean {
        return this.getPersistedItem() && id && this.getPersistedItem().getContentId().equals(id);
    }

    private persistedItemPathIsDescendantOrEqual(path: ContentPath): boolean {
        return this.getPersistedItem().getPath().isDescendantOf(path) || this.getPersistedItem().getPath().equals(path);
    }

    private formContext: ContentFormContext;

    private updateWizard(content: Content, unchangedOnly: boolean = true) {

        this.updateWizardHeader(content);
        this.updateWizardStepForms(content, unchangedOnly);
        this.updateMetadataAndMetadataStepForms(content, unchangedOnly);
        this.resetLastFocusedElement();
    }

    private createXDataAnchor(xDataAnchorIndex: number) {
        this.xDataAnchor =
            (<ContentTabBarItemBuilder>new ContentTabBarItemBuilder()
                .setLabel('X-data')
                .setClickHandler(() => {
                    this.getStepNavigator().deselectNavigationItem();
                    this.getWizardStepsPanel().setListenToScroll(false);
                    this.getWizardStepsPanel().showPanelByIndex(xDataAnchorIndex).then(() => {
                        this.getWizardStepsPanel().setListenToScroll(true);
                    });
                }))
                .setIconCls('icon-plus')
                .build();

        this.xDataAnchor.addClass('x-data-anchor');
        this.getStepNavigator().insertChild(this.xDataAnchor, xDataAnchorIndex);
    }

    private togglexDataAnchorVisibility() {
        if (!this.xDataAnchor) {
            return;
        }
        this.xDataAnchor.toggleClass('hidden', !this.hasDisabledExternalMixin());
        this.xDataAnchor.toggleClass('all-collapsed', this.areAllExternalMixinsCollapsed());
    }

    private createSteps(contentId: ContentId): wemQ.Promise<Mixin[]> {
        this.contentWizardStepForm = new ContentWizardStepForm();
        this.settingsWizardStepForm = new SettingsWizardStepForm();
        this.scheduleWizardStepForm = new ScheduleWizardStepForm();
        this.securityWizardStepForm = new SecurityWizardStepForm();
        this.missingOrStoppedAppKeys = [];

        let applicationKeys = this.site ? this.site.getApplicationKeys() : [];
        let applicationPromises = applicationKeys.map((key: ApplicationKey) => this.fetchApplication(key));

        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult: api.security.auth.LoginResult) => {
            this.checkSecurityWizardStepFormAllowed(loginResult);
            return wemQ.all(applicationPromises);
        }).then(() => {
            this.handleMissingApp();

            return new GetContentXDataRequest(contentId).sendAndParse().then(
                (xDatas: Mixin[]) => {
                    let xDataAnchorIndex;
                    let steps: ContentWizardStep[] = [];

                    this.contentWizardStep = new ContentWizardStep(this.contentType.getDisplayName(), this.contentWizardStepForm);
                    steps.push(this.contentWizardStep);

                    xDatas.forEach((xData: Mixin, index: number) => {
                        if (!this.xDataStepFormByName[xData.getMixinName().toString()]) {
                            let stepForm = new XDataWizardStepForm(xData.isExternal());
                            this.xDataStepFormByName[xData.getMixinName().toString()] = stepForm;

                            if (!xDataAnchorIndex && xData.isExternal()) {
                                xDataAnchorIndex = steps.length;
                            }
                            stepForm.onEnableChanged(() => {
                                this.togglexDataAnchorVisibility();
                                this.getStepNavigatorContainer().checkAndMinimize();
                                this.getStepNavigatorContainer().renumerateSteps();
                            });

                            steps.splice(index + 1, 0, new ContentWizardStep(xData.getDisplayName(), stepForm));
                        }
                    });

                    this.getStepNavigator().onNavigationItemAdded((event: NavigatorEvent) => {
                        const item = <ContentTabBarItem>event.getItem();
                        if (item.getIconCls()) {
                            this.getHeader(item.getIndex()).addClass('step-icon ' + item.getIconCls());
                        }

                    });

                    this.scheduleWizardStep = new ContentWizardStep(i18n('field.schedule'), this.scheduleWizardStepForm, 'icon-calendar');
                    this.scheduleWizardStepIndex = steps.length;
                    steps.push(this.scheduleWizardStep);

                    this.settingsWizardStep = new ContentWizardStep(i18n('field.settings'), this.settingsWizardStepForm, 'icon-wrench');
                    steps.push(this.settingsWizardStep);

                    steps.push(new ContentWizardStep(i18n('field.access'), this.securityWizardStepForm, 'icon-masks'));

                    this.setSteps(steps);

                    if (xDataAnchorIndex) {
                        this.createXDataAnchor(xDataAnchorIndex);
                    }

                    return xDatas;
                });
        });
    }

    private resetWizard() {

        this.getWizardHeader().resetBaseValues();

        this.contentWizardStepForm.reset();
        this.settingsWizardStepForm.reset();
        this.scheduleWizardStepForm.reset();

        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                let form = this.xDataStepFormByName[key];
                form.reset();
            }
        }

    }

    private updateContent(compareStatus: CompareStatus) {
        this.persistedContent = this.currentContent.setCompareStatus(compareStatus);
        this.getContentWizardToolbarPublishControls().setContent(this.currentContent);
        this.getMainToolbar().setItem(this.currentContent);

        this.wizardActions.refreshPendingDeleteDecorations();
    }

    private isOutboundDependencyUpdated(content: ContentSummaryAndCompareStatus): wemQ.Promise<boolean> {
        return this.persistedContent.isReferencedBy([content.getContentId()]);
    }

    private isUpdateOfPageModelRequired(content: ContentSummaryAndCompareStatus): wemQ.Promise<boolean> {

        const item = this.getPersistedItem();
        const isSiteUpdated = content.getType().isSite();
        const isPageTemplateUpdated = content.getType().isPageTemplate();
        const isItemUnderUpdatedSite = item.getPath().isDescendantOf(content.getPath());
        const site = item.isSite() ? <Site>item : this.site;

        const isUpdatedItemUnderSite = site ? content.getPath().isDescendantOf(site.getPath()) : false;

        // 1. template of the nearest site was updated
        // 2. nearest site was updated (app may have been added)
        const nearestSiteChanged = (isPageTemplateUpdated && isUpdatedItemUnderSite) || (isSiteUpdated && isItemUnderUpdatedSite);

        if (nearestSiteChanged) {
            return wemQ(true);
        }

        // 3. outbound dependency content has changed
        return this.isOutboundDependencyUpdated(content).then(outboundDependencyUpdated => {
            const persistedContent: Content = this.getPersistedItem();
            const viewedPage = this.assembleViewedPage();

            const pageChanged = !api.ObjectHelper.equals(persistedContent.getPage(), viewedPage);
            return outboundDependencyUpdated && !pageChanged;

        });
    }

    private listenToContentEvents() {

        let serverEvents = api.content.event.ContentServerEventsHandler.getInstance();

        const loadDefaultModelsAndUpdatePageModel = (reloadPage: boolean = true) => {
            const item = this.getPersistedItem();
            const site = item.isSite() ? <Site>item : this.site;

            return new ContentWizardDataLoader().loadDefaultModels(site, this.contentType.getContentTypeName()).then(
                defaultModels => {
                    this.defaultModels = defaultModels;
                    return this.initPageModel(this.liveEditModel, defaultModels).then(pageModel => {
                        const livePanel = this.getLivePanel();
                        const needsReload = !this.isSaving(); // pageModel is updated so we need reload unless we're saving already
                        if (livePanel) {
                            livePanel.setModel(this.liveEditModel);
                            if (needsReload && reloadPage) {
                                livePanel.skipNextReloadConfirmation(true);
                                livePanel.loadPage();
                            }
                        }
                        return needsReload;
                    });
                });
        };

        const deleteHandler = (event: api.content.event.ContentDeletedEvent) => {
            if (!this.getPersistedItem()) {
                return;
            }

            event.getDeletedItems().filter((deletedItem) => {
                return !!deletedItem && this.getPersistedItem().getPath().equals(deletedItem.getContentPath());
            }).some((deletedItem) => {
                if (deletedItem.isPending()) {
                    this.getContentWizardToolbarPublishControls().setContentCanBePublished(true, false);
                    this.updateContent(deletedItem.getCompareStatus());
                } else {
                    this.contentDeleted = true;
                    this.close();
                }

                return true;
            });

            event.getUndeletedItems().filter((undeletedItem) => {
                return !!undeletedItem && this.getPersistedItem().getPath().equals(undeletedItem.getContentPath());
            }).some((undeletedItem) => {
                this.updateContent(undeletedItem.getCompareStatus());

                return true;
            });

            [].concat(event.getDeletedItems(), event.getUndeletedItems()).some(deletedItem => {
                const defaultTemplate = this.defaultModels ? this.defaultModels.getPageTemplate() : null;
                const pageTemplate = this.liveEditModel ? this.liveEditModel.getPageModel().getTemplate() : null;
                const isDefaultTemplate = defaultTemplate && deletedItem.getContentId().equals(defaultTemplate.getKey());
                const isPageTemplate = pageTemplate && deletedItem.getContentId().equals(pageTemplate.getKey());
                if (isDefaultTemplate || isPageTemplate) {
                    loadDefaultModelsAndUpdatePageModel().done();
                    return true;
                }
            });

        };

        const publishOrUnpublishHandler = (contents: ContentSummaryAndCompareStatus[]) => {
            contents.forEach(content => {
                if (this.isCurrentContentId(content.getContentId())) {
                    this.persistedContent = this.currentContent = content;
                    this.getContentWizardToolbarPublishControls().setContent(content);
                    this.getMainToolbar().setItem(content);
                    this.refreshScheduleWizardStep();

                    this.getWizardHeader().toggleNameGeneration(content.getCompareStatus() !== CompareStatus.EQUAL);
                }
            });
        };

        const updateHandler = (updatedContent: ContentSummaryAndCompareStatus) => {
            const contentId: ContentId = updatedContent.getContentId();

            if (this.isCurrentContentId(contentId)) {

                this.persistedContent = this.currentContent = updatedContent;
                this.getContentWizardToolbarPublishControls().setContent(this.currentContent);
                this.getMainToolbar().setItem(updatedContent);

                if (this.currentContent.getCompareStatus() != null) {
                    this.refreshScheduleWizardStep();
                }
                this.fetchPersistedContent().then((content: Content) => {
                    let isAlreadyUpdated = content.equals(this.getPersistedItem());

                    if (!isAlreadyUpdated) {
                        this.setPersistedItem(content.clone());
                        this.updateWizard(content, true);

                        if (this.isEditorEnabled()) {
                            // also update live form panel for renderable content without asking
                            this.updateLiveForm(content);
                        }
                        if (!this.isDisplayNameUpdated()) {
                            this.getWizardHeader().resetBaseValues();
                        }
                        this.wizardActions.setDeleteOnlyMode(this.getPersistedItem(), false);
                    } else {
                        this.resetWizard();
                    }
                }).catch(api.DefaultErrorHandler.handle).done();
            } else {
                const containsIdPromise: wemQ.Promise<boolean> = this.doComponentsContainId(contentId).then((contains) => {
                    if (contains) {
                        this.fetchPersistedContent().then((content: Content) => {
                            this.updateWizard(content, true);
                            if (this.isEditorEnabled()) {
                                return true;
                            }
                        }).catch(api.DefaultErrorHandler.handle).done();
                    } else {
                        return false;
                    }
                });

                let templateUpdatedPromise: wemQ.Promise<boolean>;

                this.isUpdateOfPageModelRequired(updatedContent).then(value => {
                    if (value) {
                        templateUpdatedPromise = loadDefaultModelsAndUpdatePageModel(false);
                    } else {
                        templateUpdatedPromise = wemQ(false);
                    }

                    wemQ.all([containsIdPromise, templateUpdatedPromise]).spread((containsId, templateUpdated) => {
                        if (containsId || templateUpdated) {
                            const livePanel = this.getLivePanel();
                            livePanel.skipNextReloadConfirmation(true);
                            livePanel.loadPage(false);
                        }
                    });
                });
            }

            // checks if parent site has been modified
            if (this.site != null && this.siteModel !== null && this.site.getContentId().equals(contentId)
                && !this.persistedContent.getContentId().equals(contentId)) {
                new ContentWizardDataLoader().loadSite(contentId).then(site => {
                    this.siteModel.update(site);
                }).catch(api.DefaultErrorHandler.handle).done();
            }
        };

        const sortedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            let indexOfCurrentContent;
            let wasSorted = data.some((sorted: ContentSummaryAndCompareStatus, index: number) => {
                indexOfCurrentContent = index;
                return this.isCurrentContentId(sorted.getContentId());
            });
            if (wasSorted) {
                this.getContentWizardToolbarPublishControls().setContent(data[indexOfCurrentContent]);
            }

            const content = this.getPersistedItem();
            if (content instanceof Site) {
                data.some(sortedItem => {
                    if (sortedItem.getType().isTemplateFolder() && sortedItem.getPath().isDescendantOf(content.getPath())) {

                        loadDefaultModelsAndUpdatePageModel().done();

                        return true;
                    }
                });
            }
        };

        const movedHandler = (data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            let wasMoved = oldPaths.some((oldPath: ContentPath) => {
                return this.persistedItemPathIsDescendantOrEqual(oldPath);
            });

            if (wasMoved) {
                updateHandler(data[0]);
            }
        };

        const contentUpdatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            if (!this.contentUpdateDisabled) {
                data.forEach((updated: ContentSummaryAndCompareStatus) => {
                    updateHandler(updated);
                });
            }
        };

        const isChild = (path: ContentPath) => path.isChildOf(this.persistedContent.getPath());

        const childrenModifiedHandler = (data: Array<ContentSummaryAndCompareStatus | ContentServerChangeItem>) => {
            const childUpdated = data.some(item => isChild(item.getPath()));
            if (childUpdated) {
                this.fetchPersistedContent().then((content: Content) => {
                    const isLeaf = !content.hasChildren();
                    this.getContentWizardToolbarPublishControls().setLeafContent(isLeaf);
                }).catch(api.DefaultErrorHandler.handle).done();
            }
        };

        ContentDeletedEvent.on(deleteHandler);

        serverEvents.onContentMoved(movedHandler);
        serverEvents.onContentSorted(sortedHandler);
        serverEvents.onContentUpdated(contentUpdatedHandler);
        serverEvents.onContentPublished(publishOrUnpublishHandler);
        serverEvents.onContentUnpublished(publishOrUnpublishHandler);

        serverEvents.onContentCreated(childrenModifiedHandler);
        serverEvents.onContentDeleted(childrenModifiedHandler);

        this.onClosed(() => {
            ContentDeletedEvent.un(deleteHandler);

            serverEvents.unContentMoved(movedHandler);
            serverEvents.unContentSorted(sortedHandler);
            serverEvents.unContentUpdated(contentUpdatedHandler);
            serverEvents.unContentPublished(publishOrUnpublishHandler);
            serverEvents.unContentUnpublished(publishOrUnpublishHandler);

            serverEvents.unContentCreated(childrenModifiedHandler);
            serverEvents.unContentDeleted(childrenModifiedHandler);
        });
    }

    private fetchPersistedContent(): wemQ.Promise<Content> {
        return new GetContentByIdRequest(this.getPersistedItem().getContentId()).sendAndParse();
    }

    private updateLiveForm(content: Content): wemQ.Promise<any> {
        let formContext = this.getFormContext(content);

        if (this.siteModel) {
            this.unbindSiteModelListeners();
        }

        let liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {

            let site = content.isSite() ? <Site>content : this.site;

            this.siteModel = this.siteModel ? this.siteModel.update(site) : new SiteModel(site);
            this.initSiteModelListeners();

            return this.initLiveEditModel(content, this.siteModel, formContext).then((liveEditModel) => {
                this.liveEditModel = liveEditModel;

                liveFormPanel.setModel(this.liveEditModel);
                liveFormPanel.skipNextReloadConfirmation(true);
                liveFormPanel.loadPage(false);

                return wemQ(null);
            });

        }
        if (!this.siteModel && content.isSite()) {
            this.siteModel = new SiteModel(<Site>content);
            this.initSiteModelListeners();
        }
    }

    private doComponentsContainId(contentId: ContentId): wemQ.Promise<boolean> {
        const page = this.getPersistedItem().getPage();

        if (page) {
            if (this.doHtmlAreasContainId(contentId.toString())) {
                return wemQ(true);
            }

            return this.getPersistedItem().containsChildContentId(contentId);
        }

        return wemQ(false);
    }

    private doHtmlAreasContainId(id: string): boolean {
        let areas = this.getHtmlAreasInForm(this.getContentType().getForm());
        let data: api.data.PropertyTree = this.getPersistedItem().getContentData();

        return areas.some((area) => {
            let property = data.getProperty(area);
            if (property && property.hasNonNullValue() && property.getType().equals(api.data.ValueTypes.STRING)) {
                return property.getString().indexOf(id) >= 0;
            }
        });
    }

    private getHtmlAreasInForm(formItemContainer: api.form.FormItemContainer): string[] {
        let result: string[] = [];

        formItemContainer.getFormItems().forEach((item) => {
            if (api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FormItemSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FieldSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FormOptionSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FormOptionSetOption)) {
                result = result.concat(this.getHtmlAreasInForm(<any>item));
            } else if (api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.Input)) {
                let input = <api.form.Input> item;
                if (input.getInputType().getName() === 'HtmlArea') {
                    result.push(input.getPath().toString());
                }
            }
        });

        return result;
    }

    doLayout(persistedContent: Content): wemQ.Promise<void> {

        return super.doLayout(persistedContent).then(() => {

            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doLayout at ' + new Date().toISOString(), persistedContent);
            }

            this.updateThumbnailWithContent(persistedContent);

            let publishControls = this.getContentWizardToolbarPublishControls();
            let wizardHeader = this.getWizardHeader();

            wizardHeader.setSimplifiedNameGeneration(persistedContent.getType().isDescendantOfMedia());
            publishControls.enableActionsForExisting(persistedContent);

            if (this.isRendered()) {

                let viewedContent = this.assembleViewedContent(persistedContent.newBuilder()).build();
                if (viewedContent.equals(persistedContent) || this.skipValidation) {

                    // force update wizard with server bounced values to erase incorrect ones
                    this.updateWizard(persistedContent, false);

                    let liveFormPanel = this.getLivePanel();
                    if (liveFormPanel) {
                        liveFormPanel.loadPage();
                    }
                } else {
                    console.warn(`Received Content from server differs from what's viewed:`);
                    if (!viewedContent.getContentData().equals(persistedContent.getContentData())) {
                        console.warn(' inequality found in Content.data');
                        if (persistedContent.getContentData() && viewedContent.getContentData()) {
                            console.warn(' comparing persistedContent.data against viewedContent.data:');
                            new api.data.PropertyTreeComparator().compareTree(persistedContent.getContentData(),
                                viewedContent.getContentData());
                        }
                    }
                    if (!api.ObjectHelper.equals(viewedContent.getPage(), persistedContent.getPage())) {
                        console.warn(' inequality found in Content.page');
                        if (persistedContent.getPage() && viewedContent.getPage()) {
                            console.warn(' comparing persistedContent.page.config against viewedContent.page.config:');
                            new api.data.PropertyTreeComparator().compareTree(persistedContent.getPage().getConfig(),
                                viewedContent.getPage().getConfig());
                        }
                    }
                    if (!api.ObjectHelper.arrayEquals(viewedContent.getAllExtraData(), persistedContent.getAllExtraData())) {
                        console.warn(' inequality found in Content.meta');
                    }
                    if (!api.ObjectHelper.equals(viewedContent.getAttachments(), persistedContent.getAttachments())) {
                        console.warn(' inequality found in Content.attachments');
                    }
                    if (!api.ObjectHelper.equals(viewedContent.getPermissions(), persistedContent.getPermissions())) {
                        console.warn(' inequality found in Content.permissions');
                    }
                    console.warn(' viewedContent: ', viewedContent);
                    console.warn(' persistedContent: ', persistedContent);

                    if (persistedContent.getType().isDescendantOfMedia()) {
                        this.updateMetadataAndMetadataStepForms(persistedContent);
                    } else {
                        new ConfirmationDialog()
                            .setQuestion(i18n('dialog.confirm.contentDiffers'))
                            .setYesCallback(() => this.doLayoutPersistedItem(persistedContent.clone()))
                            .setNoCallback(() => { /* empty */
                            })
                            .show();
                    }
                }

                return this.updatePersistedContent(persistedContent);

            } else {

                return this.doLayoutPersistedItem(persistedContent.clone()).then(() => {
                    return this.updatePersistedContent(persistedContent);
                });
            }

        });

    }

    private updatePersistedContent(persistedContent: Content) {
        return api.content.resource.ContentSummaryAndCompareStatusFetcher.fetchByContent(persistedContent).then((summaryAndStatus) => {
            this.persistedContent = this.currentContent = summaryAndStatus;

            this.getWizardHeader().toggleNameGeneration(this.currentContent.getCompareStatus() === CompareStatus.NEW);
            this.getMainToolbar().setItem(this.currentContent);
            this.getContentWizardToolbarPublishControls().setContent(this.currentContent).setLeafContent(
                !this.getPersistedItem().hasChildren());
        });
    }

    saveChangesWithoutValidation(reloadPageEditor?: boolean): wemQ.Promise<Content> {
        this.skipValidation = true;
        this.reloadPageEditorOnSave = reloadPageEditor;

        let result = this.saveChanges();
        result.then(() => {
            this.skipValidation = false;
            this.reloadPageEditorOnSave = true;
        });

        return result;
    }

    private updateThumbnailWithContent(content: Content) {
        let thumbnailUploader = this.getFormIcon();

        thumbnailUploader
            .setParams({
                id: content.getContentId().toString()
            })
            .setEnabled(!content.isImage())
            .setValue(new api.content.util.ContentIconUrlResolver().setContent(content).resolve());

        thumbnailUploader.toggleClass('invalid', !content.isValid());
    }

    private initLiveEditor(formContext: ContentFormContext, content: Content): wemQ.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.initLiveEditor at ' + new Date().toISOString());
        }
        let deferred = wemQ.defer<void>();
        let liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {

            if (!this.liveEditModel) {
                let site = content.isSite() ? <Site>content : this.site;

                this.unbindSiteModelListeners();
                this.siteModel = this.siteModel ? this.siteModel.update(site) : new SiteModel(site);
                this.initSiteModelListeners();

                this.initLiveEditModel(content, this.siteModel, formContext).then((liveEditModel) => {
                    this.liveEditModel = liveEditModel;

                    liveFormPanel.setModel(this.liveEditModel);
                    liveFormPanel.loadPage();
                    this.setupWizardLiveEdit();

                    deferred.resolve(null);
                });
            } else {
                liveFormPanel.loadPage();
                deferred.resolve(null);
            }
        } else {
            deferred.resolve(null);
        }
        return deferred.promise;
    }

    private resetDisabledXDataForms() {
        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                let form = this.xDataStepFormByName[key];
                if (form.isExpandable() && !form.isEnabled()) {
                    form.resetForm();
                }
            }
        }
    }

    // synch persisted content extra data with data from mixins
    // when rendering form - we may add extra fields from mixins;
    // as this is intended action from XP, not user - it should be present in persisted content
    private synchPersistedItemWithMixinData(mixinName: MixinName, mixinData: PropertyTree) {
        let persistedContent = this.getPersistedItem();
        let extraData = persistedContent.getExtraData(mixinName);
        if (!extraData) { // ensure ExtraData object corresponds to each step form
            this.enrichWithExtraData(persistedContent, mixinName, mixinData.copy());
        } else {
            let diff = extraData.getData().diff(mixinData);
            diff.added.forEach((property: api.data.Property) => {
                extraData.getData().addProperty(property.getName(), property.getValue());
            });
        }
    }

    private enrichWithExtraData(content: Content, mixinName: MixinName, propertyTree?: PropertyTree): ExtraData {
        let extraData = new ExtraData(mixinName, propertyTree ? propertyTree.copy() : new PropertyTree());
        content.getAllExtraData().push(extraData);
        return extraData;
    }

    private isSplitEditModeActive() {
        return (this.getEl().getWidth() > ResponsiveRanges._720_960.getMaximumRange() &&
                this.isEditorEnabled() && this.shouldOpenEditorByDefault());
    }

    private setupWizardLiveEdit() {

        const editorEnabled = this.isEditorEnabled();

        this.toggleClass('rendered', editorEnabled);

        this.wizardActions.getShowLiveEditAction().setEnabled(editorEnabled);
        this.wizardActions.getShowSplitEditAction().setEnabled(editorEnabled);
        this.wizardActions.getPreviewAction().setVisible(editorEnabled);

        this.getCycleViewModeButton().setVisible(editorEnabled);

        if (this.isSplitEditModeActive()) {
            this.wizardActions.getShowSplitEditAction().execute();
        } else if (!!this.getSplitPanel()) {
            this.wizardActions.getShowFormAction().execute();
        }
        if (editorEnabled) {
            this.formMask.show();
        }
    }

    private initSiteModelListeners() {
        if (this.siteModel) {
            this.siteModel.onApplicationAdded(this.applicationAddedListener);
            this.siteModel.onApplicationRemoved(this.applicationRemovedListener);
            this.siteModel.onApplicationUnavailable(this.applicationUnavailableListener);
            this.siteModel.onApplicationStarted(this.applicationStartedListener);
        }
    }

    private unbindSiteModelListeners() {
        if (this.siteModel) {
            this.siteModel.unApplicationAdded(this.applicationAddedListener);
            this.siteModel.unApplicationRemoved(this.applicationRemovedListener);
            this.siteModel.unApplicationUnavailable(this.applicationUnavailableListener);
            this.siteModel.unApplicationStarted(this.applicationStartedListener);
        }
    }

    // Remember that content has been cloned here and it is not the persistedItem any more
    private doLayoutPersistedItem(content: Content): wemQ.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.doLayoutPersistedItem at ' + new Date().toISOString());
        }

        this.toggleClass('rendered', false);

        let formContext = this.getFormContext(content);

        return this.updateButtonsState().then(() => {
            return this.initLiveEditor(formContext, content).then(() => {

                return this.createSteps(content.getContentId()).then((schemas: Mixin[]) => {

                    let contentData = content.getContentData();

                    contentData.onChanged(this.dataChangedHandler);

                    let formViewLayoutPromises: wemQ.Promise<void>[] = [];
                    formViewLayoutPromises.push(this.contentWizardStepForm.layout(formContext, contentData, this.contentType.getForm()));
                    // Must pass FormView from contentWizardStepForm displayNameScriptExecutor,
                    // since a new is created for each call to renderExisting
                    this.displayNameScriptExecutor.setFormView(this.contentWizardStepForm.getFormView());
                    this.settingsWizardStepForm.layout(content);
                    this.settingsWizardStepForm.onPropertyChanged(this.dataChangedHandler);
                    this.scheduleWizardStepForm.layout(content);
                    this.scheduleWizardStepForm.onPropertyChanged(this.dataChangedHandler);
                    this.refreshScheduleWizardStep();
                    this.securityWizardStepForm.layout(content);

                    schemas.forEach((schema: Mixin, index: number) => {
                        let extraData = content.getExtraData(schema.getMixinName());
                        if (!extraData) {
                            extraData = this.enrichWithExtraData(content, schema.getMixinName());
                        }
                        let xDataFormView = this.xDataStepFormByName[schema.getMixinName().toString()];
                        let xDataForm = new api.form.FormBuilder().addFormItems(schema.getFormItems()).build();

                        let data = extraData.getData();
                        data.onChanged(this.dataChangedHandler);

                        formViewLayoutPromises.push(xDataFormView.layout(formContext, data, xDataForm));

                        this.synchPersistedItemWithMixinData(schema.getMixinName(), data);
                    });

                    return wemQ.all(formViewLayoutPromises).spread<void>(() => {

                        this.togglexDataAnchorVisibility();

                        this.contentWizardStepForm.getFormView().addClass('panel-may-display-validation-errors');
                        if (this.formState.isNew()) {
                            this.contentWizardStepForm.getFormView().highlightInputsOnValidityChange(true);
                        } else {
                            this.displayValidationErrors(!this.isValid());
                        }

                        this.enableDisplayNameScriptExecution(this.contentWizardStepForm.getFormView());

                        if (!this.siteModel && content.isSite()) {
                            this.siteModel = new SiteModel(<Site>content);
                            this.initSiteModelListeners();
                        }

                        this.wizardActions.setUnsavedChangesCallback(this.hasUnsavedChanges.bind(this));

                        this.onLiveModelChanged(() => {
                            setTimeout(this.updatePublishStatusOnDataChange.bind(this), 100);
                        });

                        return wemQ(null);
                    });
                });
            });
        });
    }

    private removeMetadataStepForms(applicationKey: ApplicationKey) {
        this.missingOrStoppedAppKeys = [];

        new api.schema.xdata.GetApplicationXDataRequest(this.persistedContent.getType(), applicationKey).sendAndParse().then(
            (mixinsToRemove: Mixin[]) => {
                this.handleMissingApp();

                for (const i in mixinsToRemove) {
                    if (mixinsToRemove.hasOwnProperty(i)) {
                        this.removeStepWithForm(this.xDataStepFormByName[mixinsToRemove[i].getName()]);
                        delete this.xDataStepFormByName[mixinsToRemove[i].getName()];
                    }
                }
            }).done();
    }

    private initLiveEditModel(content: Content, siteModel: SiteModel, formContext: ContentFormContext): wemQ.Promise<LiveEditModel> {
        const liveEditModel = LiveEditModel.create()
            .setParentContent(this.parentContent)
            .setContent(content)
            .setContentFormContext(formContext)
            .setSiteModel(siteModel)
            .build();

        return this.initPageModel(liveEditModel, this.defaultModels).then(pageModel => {
            return liveEditModel;
        });
    }

    private initPageModel(liveEditModel: LiveEditModel, defaultModels: DefaultModels): wemQ.Promise<PageModel> {
        return liveEditModel.init(defaultModels.getPageTemplate(), defaultModels.getPageDescriptor());
    }

    persistNewItem(): wemQ.Promise<Content> {
        return new PersistNewContentRoutine(this).setCreateContentRequestProducer(this.produceCreateContentRequest).execute().then(
            (content: Content) => {
                api.notify.showFeedback(i18n('notify.content.created'));
                return content;
            });
    }

    postPersistNewItem(persistedContent: Content): wemQ.Promise<Content> {

        /*        if (persistedContent.isSite()) {
                    this.site = <Site>persistedContent;
                }*/

        return wemQ(persistedContent);
    }

    private produceCreateContentRequest(): wemQ.Promise<CreateContentRequest> {
        let deferred = wemQ.defer<CreateContentRequest>();

        let parentPath = this.parentContent != null ? this.parentContent.getPath() : api.content.ContentPath.ROOT;

        if (this.contentType.getContentTypeName().isMedia()) {
            deferred.resolve(null);
        } else {
            deferred.resolve(
                new CreateContentRequest()
                    .setRequireValid(this.requireValid)
                    .setName(api.content.ContentUnnamed.newUnnamed())
                    .setParent(parentPath)
                    .setContentType(this.contentType.getContentTypeName())
                    .setDisplayName('')     // new content is created on wizard open so display name is always empty
                    .setData(new PropertyTree()).setExtraData([]));
        }

        return deferred.promise;
    }

    private getOptionSetsInForm(formItemContainer: api.form.FormItemContainer): api.form.FormOptionSet[] {
        let result: api.form.FormOptionSet[] = [];

        formItemContainer.getFormItems().forEach((item) => {
            if (api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FormItemSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FieldSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FormOptionSetOption)) {
                result = result.concat(this.getOptionSetsInForm(<any>item));
            } else if (api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FormOptionSet)) {
                result.push(<api.form.FormOptionSet> item);
                result = result.concat(this.getOptionSetsInForm(<any>item));
            }
        });

        return result;
    }

    updatePersistedItem(): wemQ.Promise<Content> {
        let persistedContent = this.getPersistedItem();

        let viewedContent = this.assembleViewedContent(persistedContent.newBuilder(), true).build();

        let updatePersistedContentRoutine = new UpdatePersistedContentRoutine(this, persistedContent, viewedContent)
            .setUpdateContentRequestProducer(this.produceUpdateContentRequest);

        return updatePersistedContentRoutine.execute().then((content: Content) => {

            if (persistedContent.getName().isUnnamed() && !content.getName().isUnnamed()) {
                this.notifyContentNamed(content);
            }

            this.showFeedbackContentSaved(content);

            this.getWizardHeader().resetBaseValues();

            return content;
        });
    }

    private showFeedbackContentSaved(content: Content) {
        const name = content.getName();
        let message;
        if (name.isUnnamed()) {
            message = i18n('notify.item.savedUnnamed');
        } else {
            message = i18n('notify.item.saved', name);
        }
        api.notify.showFeedback(message);
    }

    private produceUpdateContentRequest(content: Content, viewedContent: Content): UpdateContentRequest {
        const persistedContent = this.getPersistedItem();

        return new UpdateContentRequest(persistedContent.getId())
            .setRequireValid(this.requireValid)
            .setContentName(viewedContent.getName())
            .setDisplayName(viewedContent.getDisplayName())
            .setData(viewedContent.getContentData())
            .setExtraData(viewedContent.getAllExtraData())
            .setOwner(viewedContent.getOwner())
            .setLanguage(viewedContent.getLanguage())
            .setPublishFrom(viewedContent.getPublishFromTime())
            .setPublishTo(viewedContent.getPublishToTime())
            .setPermissions(viewedContent.getPermissions())
            .setInheritPermissions(viewedContent.isInheritPermissionsEnabled())
            .setOverwritePermissions(viewedContent.isOverwritePermissionsEnabled());
    }

    private isDisplayNameUpdated(): boolean {
        return this.getPersistedItem().getDisplayName() !== this.getWizardHeader().getDisplayName();
    }

    hasUnsavedChanges(): boolean {
        if (!this.isRendered()) {
            return false;
        }
        let persistedContent: Content = this.getPersistedItem();
        if (persistedContent == null) {
            return true;
        } else {

            let viewedContent = this.assembleViewedContent(new ContentBuilder(persistedContent), true).build();

            // ignore empty values for auto-created content that hasn't been updated yet because it doesn't have data at all
            let ignoreEmptyValues = !persistedContent.getModifiedTime() || !persistedContent.getCreatedTime() ||
                                    persistedContent.getCreatedTime().getTime() === persistedContent.getModifiedTime().getTime();

            return !viewedContent.equals(persistedContent, ignoreEmptyValues);
        }
    }

    private enableDisplayNameScriptExecution(formView: FormView) {

        if (this.displayNameScriptExecutor.hasScript()) {

            formView.onKeyUp((event: KeyboardEvent) => {
                if (this.displayNameScriptExecutor.hasScript()) {
                    this.getWizardHeader().setDisplayName(this.displayNameScriptExecutor.execute());
                }
            });
        }
    }

    private addMetadataStepForms(applicationKey: ApplicationKey) {
        new api.schema.xdata.GetApplicationXDataRequest(this.persistedContent.getType(), applicationKey).sendAndParse().then(
            (xDatas: Mixin[]) => {
                const xDatasToAdd = xDatas.filter(xData =>
                    !this.xDataStepFormByName[xData.getName()]
                );

                const formContext = this.getFormContext(this.getPersistedItem());

                xDatasToAdd.forEach((mixin: Mixin) => {
                    if (!this.xDataStepFormByName[mixin.getMixinName().toString()]) {

                        let stepForm = new XDataWizardStepForm(mixin.isExternal());
                        this.xDataStepFormByName[mixin.getMixinName().toString()] = stepForm;

                        let wizardStep = new ContentWizardStep(mixin.getDisplayName(), stepForm);
                        this.insertStepBefore(wizardStep, this.settingsWizardStep);

                        let extraData = new ExtraData(mixin.getMixinName(), new PropertyTree());

                        extraData.getData().onChanged(this.dataChangedHandler);

                        stepForm.layout(formContext, extraData.getData(), mixin.toForm());
                    }
                });
            }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }

    private cleanFormRedundantData(data: api.data.PropertyTree): api.data.PropertyTree {
        let optionSets = this.getOptionSetsInForm(this.getContentType().getForm());

        optionSets.forEach((optionSet) => {
            let property = data.getProperty(optionSet.getPath().toString());
            if (!!property) {
                let optionSetProperty = property.getPropertySet();
                let selectionArray = optionSetProperty.getPropertyArray('_selected');
                if (!selectionArray) {
                    return;
                }
                optionSet.getOptions().forEach((option: api.form.FormOptionSetOption) => {
                    let isSelected = false;
                    selectionArray.forEach((selectedOptionName: api.data.Property) => {
                        if (selectedOptionName.getString() === option.getName()) {
                            isSelected = true;
                        }
                    });
                    if (!isSelected) {
                        optionSetProperty.removeProperty(option.getName(), 0);
                    }
                });
            }
        });

        return data;
    }

    private assembleViewedPage(): Page {
        let liveFormPanel = this.getLivePanel();
        return liveFormPanel ? liveFormPanel.getPage() : null;
    }

    private resolveContentNameForUpdateRequest(): ContentName {
        if (api.util.StringHelper.isEmpty(this.getWizardHeader().getName())) {
            if (this.getPersistedItem().getName().isUnnamed()) {
                return this.getPersistedItem().getName();
            } else {
                return ContentUnnamed.newUnnamed();
            }
        }
        return ContentName.fromString(this.getWizardHeader().getName());
    }

    setRequireValid(requireValid: boolean) {
        this.requireValid = requireValid;
    }

    showLiveEdit() {
        if (!this.inMobileViewMode) {
            this.showSplitEdit();
            return;
        }

        this.getSplitPanel().addClass('toggle-live').removeClass('toggle-form toggle-split');
        this.getMainToolbar().toggleClass('live', true);
        this.toggleClass('form', false);

        this.openLiveEdit();
    }

    showSplitEdit() {
        this.getSplitPanel().addClass('toggle-split').removeClass('toggle-live toggle-form');
        this.getMainToolbar().toggleClass('live', true);
        this.toggleClass('form', false);

        this.openLiveEdit();
    }

    showForm() {
        this.getSplitPanel().addClass('toggle-form').removeClass('toggle-live toggle-split');
        this.getMainToolbar().toggleClass('live', false);
        this.toggleClass('form', true);

        this.closeLiveEdit();
    }

    private isSplitView(): boolean {
        return this.getSplitPanel() && this.getSplitPanel().hasClass('toggle-split');
    }

    private isLiveView(): boolean {
        return this.getSplitPanel() && this.getSplitPanel().hasClass('toggle-live');
    }

    private assembleViewedContent(viewedContentBuilder: ContentBuilder, cleanFormRedundantData: boolean = false): ContentBuilder {

        viewedContentBuilder.setName(this.resolveContentNameForUpdateRequest());
        viewedContentBuilder.setDisplayName(this.getWizardHeader().getDisplayName());
        if (this.contentWizardStepForm) {
            if (!cleanFormRedundantData) {
                viewedContentBuilder.setData(this.contentWizardStepForm.getData());
            } else {
                let data: api.data.PropertyTree = new api.data.PropertyTree(this.contentWizardStepForm.getData().getRoot()); // copy
                viewedContentBuilder.setData(this.cleanFormRedundantData(data));
            }
        }

        let extraData: ExtraData[] = [];
        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                extraData.push(new ExtraData(new MixinName(key), this.xDataStepFormByName[key].getData()));
            }
        }

        viewedContentBuilder.setExtraData(extraData);

        this.settingsWizardStepForm.apply(viewedContentBuilder);
        this.scheduleWizardStepForm.apply(viewedContentBuilder);

        viewedContentBuilder.setPage(this.assembleViewedPage());

        this.securityWizardStepForm.apply(viewedContentBuilder);

        return viewedContentBuilder;
    }

    private displayValidationErrors(value: boolean) {
        this.contentWizardStepForm.displayValidationErrors(value);

        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                let form = this.xDataStepFormByName[key];
                form.displayValidationErrors(value);
            }
        }
    }

    getContextWindowToggler(): TogglerButton {
        return this.getMainToolbar().getContextWindowToggler();
    }

    getComponentsViewToggler(): TogglerButton {
        return this.getMainToolbar().getComponentsViewToggler();
    }

    getContentWizardToolbarPublishControls(): ContentWizardToolbarPublishControls {
        return this.getMainToolbar().getContentWizardToolbarPublishControls();
    }

    getCycleViewModeButton(): CycleButton {
        return this.getMainToolbar().getCycleViewModeButton();
    }

    getCloseAction(): api.ui.Action {
        return this.wizardActions.getCloseAction();
    }

    onContentNamed(listener: (event: ContentNamedEvent) => void) {
        this.contentNamedListeners.push(listener);
    }

    unContentNamed(listener: (event: ContentNamedEvent) => void) {
        this.contentNamedListeners = this.contentNamedListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    getContent(): ContentSummaryAndCompareStatus {
        return this.currentContent;
    }

    getCompareStatus(): CompareStatus {
        return this.currentContent ? this.currentContent.getCompareStatus() : null;
    }

    getPublishStatus(): PublishStatus {
        return this.currentContent ? this.currentContent.getPublishStatus() : null;
    }

    private notifyContentNamed(content: api.content.Content) {
        this.contentNamedListeners.forEach((listener: (event: ContentNamedEvent) => void) => {
            listener.call(this, new ContentNamedEvent(this, content));
        });
    }

    private getFormContext(content: Content): ContentFormContext {
        if (!this.formContext) {
            this.formContext = <ContentFormContext>ContentFormContext.create()
                .setSite(this.site)
                .setParentContent(this.parentContent)
                .setPersistedContent(content)
                .setContentTypeName(this.contentType ? this.contentType.getContentTypeName() : undefined)
                .setFormState(this.formState)
                .setShowEmptyFormItemSetOccurrences(this.isItemPersisted())
                .build();
        }
        return this.formContext;
    }

    private checkSecurityWizardStepFormAllowed(loginResult: api.security.auth.LoginResult) {
        const noWritePermission = !this.getPersistedItem().isAnyPrincipalAllowed(loginResult.getPrincipals(), Permission.WRITE_PERMISSIONS);
        this.securityWizardStepForm.toggleClass('no-write-permissions', noWritePermission);
    }

    /**
     * Synchronizes wizard's extraData step forms with passed content -
     * erases steps forms (meta)data and populates it with content's (meta)data.
     * @param content
     */
    private updateMetadataAndMetadataStepForms(content: Content, unchangedOnly: boolean = true) {
        let contentCopy = content.clone();
        this.getFormContext(contentCopy).updatePersistedContent(contentCopy);

        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {

                let mixinName = new MixinName(key);
                let extraData = contentCopy.getExtraData(mixinName);
                if (!extraData) { // ensure ExtraData object corresponds to each step form
                    extraData = this.enrichWithExtraData(contentCopy, mixinName);
                }

                let form = this.xDataStepFormByName[key];
                form.getData().unChanged(this.dataChangedHandler);

                let data = extraData.getData();
                data.onChanged(this.dataChangedHandler);

                form.update(data, unchangedOnly);

                this.synchPersistedItemWithMixinData(mixinName, data);
            }
        }
    }

    private updateWizardStepForms(content: Content, unchangedOnly: boolean = true) {

        this.contentWizardStepForm.getData().unChanged(this.dataChangedHandler);

        // remember to copy data to have persistedItem pristine
        let contentCopy = content.clone();
        contentCopy.getContentData().onChanged(this.dataChangedHandler);

        this.contentWizardStepForm.update(contentCopy.getContentData(), unchangedOnly).then(() => {
            setTimeout(this.contentWizardStepForm.validate.bind(this.contentWizardStepForm), 100);
        });

        if (contentCopy.isSite()) {
            this.siteModel.update(<Site>contentCopy);
        }

        this.settingsWizardStepForm.update(contentCopy, unchangedOnly);
        this.scheduleWizardStepForm.update(contentCopy, unchangedOnly);
        this.securityWizardStepForm.update(contentCopy, unchangedOnly);
    }

    getSecurityWizardStepForm() {
        return this.securityWizardStepForm;
    }

    private updateWizardHeader(content: Content) {

        this.updateThumbnailWithContent(content);

        this.getWizardHeader().initNames(content.getDisplayName(), content.getName().toString(), true, false);

        // case when content was moved
        this.getWizardHeader()
            .setPath(content.getPath().getParentPath().isRoot() ? '/' : content.getPath().getParentPath().toString() + '/');
    }

    private openLiveEdit() {
        let livePanel = this.getLivePanel();

        this.getSplitPanel().showSecondPanel();
        livePanel.clearPageViewSelectionAndOpenInspectPage();
        this.showMinimizeEditButton();
    }

    private closeLiveEdit() {
        this.getSplitPanel().hideSecondPanel();
        this.hideMinimizeEditButton();

        if (this.liveMask && this.liveMask.isVisible()) {
            this.liveMask.hide();
        }

        if (this.isMinimized()) {
            this.toggleMinimize();
        }
    }

    private checkIfRenderable(): wemQ.Promise<Boolean> {
        return new IsRenderableRequest(this.getPersistedItem().getContentId()).sendAndParse().then((renderable: boolean) => {
            this.renderable = renderable;

            return renderable;
        });
    }

    public isContentDeleted(): boolean {
        return this.contentDeleted;
    }

    private shouldOpenEditorByDefault(): boolean {
        let isTemplate = this.contentType.getContentTypeName().isPageTemplate();
        let isSite = this.contentType.getContentTypeName().isSite();

        return this.renderable || isSite || isTemplate;
    }

    private isEditorEnabled(): boolean {

        return !!this.site || (this.shouldOpenEditorByDefault() && !api.util.ArrayHelper.contains(ContentWizardPanel.EDITOR_DISABLED_TYPES,
            this.contentType.getContentTypeName()));
    }

    private updateButtonsState(): wemQ.Promise<void> {
        return this.checkIfRenderable().then(() => {
            this.wizardActions.getPreviewAction().setEnabled(this.renderable);
            this.wizardActions.refreshPendingDeleteDecorations();
            this.getContextWindowToggler().setEnabled(this.renderable);
            this.getComponentsViewToggler().setEnabled(this.renderable);

            this.getComponentsViewToggler().setVisible(this.renderable);
            this.getContextWindowToggler().setVisible(this.renderable);
        });
    }

    private updatePublishStatusOnDataChange() {
        let publishControls = this.getContentWizardToolbarPublishControls();

        if (this.isContentFormValid) {
            if (!this.hasUnsavedChanges()) {
                // WARN: intended to restore status to persisted value if data is changed to original values,
                // but if invoked after save this will revert status to persisted one as well
                this.currentContent = this.persistedContent;

            } else {
                if (this.currentContent === this.persistedContent) {
                    this.currentContent =
                        ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(this.persistedContent.getContentSummary(),
                            this.persistedContent.getCompareStatus(), this.persistedContent.getPublishStatus());
                }
                if (publishControls.isOnline()) {
                    this.currentContent.setCompareStatus(CompareStatus.NEWER);
                }
                this.currentContent.setPublishStatus(this.scheduleWizardStepForm.getPublishStatus());
            }
            publishControls.setContent(this.currentContent);
            this.getMainToolbar().setItem(this.currentContent);
        }
    }

    private refreshScheduleWizardStep() {
        const contentWasPublished = !!this.getContent() && this.getContent().isPublished();

        this.scheduleWizardStep.show(contentWasPublished);
        this.getWizardStepsPanel().getHeader(this.scheduleWizardStepIndex).setVisible(contentWasPublished);
    }

    getLiveMask(): api.ui.mask.LoadMask {
        return this.liveMask;
    }

    onFormPanelAdded() {
        super.onFormPanelAdded(!this.isSplitEditModeActive());
    }

    onLiveModelChanged(listener: () => void) {
        if (this.getLivePanel()) {
            if (this.getLivePanel().getPageView()) {
                this.onPageChanged(listener);
            }

            this.getLivePanel().onPageViewReady((pageView) => {
                this.checkIfRenderable().then(() => {
                    this.onPageChanged(listener);
                });
            });
        }
    }

    private onPageChanged(listener: () => void) {
        const pageView = this.getLivePanel().getPageView();

        if (pageView) {
            pageView.setRenderable(this.renderable);
            pageView.onItemViewAdded(listener);
            pageView.onItemViewRemoved(listener);
            pageView.onPageLocked(listener);
        }
        const pageModel = this.liveEditModel ? this.liveEditModel.getPageModel() : null;

        if (pageModel) {
            pageModel.onPropertyChanged(listener);
            pageModel.onComponentPropertyChangedEvent(listener);
            pageModel.onCustomizeChanged(listener);
            pageModel.onPageModeChanged(listener);
            pageModel.onReset(listener);
        }
    }

    unLiveModelChanged(listener: () => void) {
        const pageModel: PageModel = this.liveEditModel ? this.liveEditModel.getPageModel() : null;

        if (pageModel) {
            pageModel.unPropertyChanged(listener);
            pageModel.unComponentPropertyChangedEvent(listener);
            pageModel.unCustomizeChanged(listener);
            pageModel.unPageModeChanged(listener);
            pageModel.unReset(listener);
        }
    }

    onPermissionItemChanged(listener: (item: AccessControlEntry) => void) {
        this.securityWizardStepForm.onPermissionItemChanged(listener);
    }

    unPermissionItemChanged(listener: (item: AccessControlEntry) => void) {
        this.securityWizardStepForm.unPermissionItemChanged(listener);
    }

    onPermissionItemsAdded(listener: (items: AccessControlEntry[]) => void) {
        this.securityWizardStepForm.onPermissionItemsAdded(listener);
    }

    unPermissionItemsAdded(listener: (items: AccessControlEntry[]) => void) {
        this.securityWizardStepForm.unPermissionItemsAdded(listener);
    }

    onPermissionItemsRemoved(listener: (items: AccessControlEntry[]) => void) {
        this.securityWizardStepForm.onPermissionItemsRemoved(listener);
    }

    unPermissionItemsRemoved(listener: (items: AccessControlEntry[]) => void) {
        this.securityWizardStepForm.unPermissionItemsRemoved(listener);
    }

    onDataChanged(listener: () => void) {
        this.dataChangedListeners.push(listener);
    }

    unDataChanged(listener: () => void) {
        this.dataChangedListeners = this.dataChangedListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    private notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}
