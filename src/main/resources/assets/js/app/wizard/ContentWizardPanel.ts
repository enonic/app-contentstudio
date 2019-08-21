import {DefaultModels} from './page/DefaultModels';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import {SettingsWizardStepForm} from './SettingsWizardStepForm';
import {ScheduleWizardStepForm} from './ScheduleWizardStepForm';
import {SecurityWizardStepForm} from './SecurityWizardStepForm';
import {DisplayNameResolver} from './DisplayNameResolver';
import {LiveFormPanel, LiveFormPanelConfig} from './page/LiveFormPanel';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentWizardPanelParams} from './ContentWizardPanelParams';
import {ContentWizardToolbar} from './ContentWizardToolbar';
import {ContentWizardStep} from './ContentWizardStep';
import {Router} from '../Router';
import {PersistNewContentRoutine} from './PersistNewContentRoutine';
import {UpdatePersistedContentRoutine} from './UpdatePersistedContentRoutine';
import {ContentWizardDataLoader} from './ContentWizardDataLoader';
import {ThumbnailUploaderEl} from './ThumbnailUploaderEl';
import {LiveEditModel} from '../../page-editor/LiveEditModel';
import {PageModel} from '../../page-editor/PageModel';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {SiteModel} from '../site/SiteModel';
import {ApplicationRemovedEvent} from '../site/ApplicationRemovedEvent';
import {ApplicationAddedEvent} from '../site/ApplicationAddedEvent';
import {ContentNamedEvent} from '../event/ContentNamedEvent';
import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {CreateContentRequest} from '../resource/CreateContentRequest';
import {ContextSplitPanel} from '../view/context/ContextSplitPanel';
import {GetContentXDataRequest} from '../resource/GetContentXDataRequest';
import {GetApplicationXDataRequest} from '../resource/GetApplicationXDataRequest';
import {BeforeContentSavedEvent} from '../event/BeforeContentSavedEvent';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';
import {ImageErrorEvent} from '../inputtype/ui/selector/image/ImageErrorEvent';
import {ContentFormContext} from '../ContentFormContext';
import {IsRenderableRequest} from '../resource/IsRenderableRequest';
import {ContentHelper} from '../util/ContentHelper';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {ContentRequiresSaveEvent} from '../event/ContentRequiresSaveEvent';
import {ContentDeletedEvent} from '../event/ContentDeletedEvent';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {XDataWizardStep} from './XDataWizardStep';
import {Content, ContentBuilder} from '../content/Content';
import {Site} from '../content/Site';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import {PublishStatus} from '../publish/PublishStatus';
import {XDataName} from '../content/XDataName';
import {ExtraData} from '../content/ExtraData';
import {XData} from '../content/XData';
import {ContentType} from '../inputtype/schema/ContentType';
import {Page} from '../page/Page';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {InspectEvent} from '../event/InspectEvent';
import {PermissionHelper} from './PermissionHelper';
import {XDataWizardStepForms} from './XDataWizardStepForms';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {Access} from '../security/Access';
import {LayerContext} from '../layer/LayerContext';
import {ConfirmLocalContentCreateDialog} from '../layer/ConfirmLocalContentCreateDialog';
import PropertyTree = api.data.PropertyTree;
import FormView = api.form.FormView;
import ContentId = api.content.ContentId;
import ContentPath = api.content.ContentPath;
import ContentName = api.content.ContentName;
import ContentUnnamed = api.content.ContentUnnamed;
import ContentTypeName = api.schema.content.ContentTypeName;
import ConfirmationDialog = api.ui.dialog.ConfirmationDialog;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import ResponsiveRanges = api.ui.responsive.ResponsiveRanges;
import ResponsiveItem = api.ui.responsive.ResponsiveItem;
import TogglerButton = api.ui.button.TogglerButton;
import WizardHeaderWithDisplayNameAndName = api.app.wizard.WizardHeaderWithDisplayNameAndName;
import WizardHeaderWithDisplayNameAndNameBuilder = api.app.wizard.WizardHeaderWithDisplayNameAndNameBuilder;
import Application = api.application.Application;
import ApplicationKey = api.application.ApplicationKey;
import ApplicationEvent = api.application.ApplicationEvent;
import Toolbar = api.ui.toolbar.Toolbar;
import CycleButton = api.ui.button.CycleButton;
import ContentServerChangeItem = api.content.event.ContentServerChangeItem;
import i18n = api.util.i18n;
import FormOptionSet = api.form.FormOptionSet;
import Property = api.data.Property;
import PropertyArray = api.data.PropertyArray;
import PropertySet = api.data.PropertySet;
import FormItemSet = api.form.FormItemSet;
import FieldSet = api.form.FieldSet;
import FormOptionSetOption = api.form.FormOptionSetOption;
import Form = api.form.Form;
import ObjectHelper = api.ObjectHelper;
import IsAuthenticatedRequest = api.security.auth.IsAuthenticatedRequest;
import LoginResult = api.security.auth.LoginResult;
import RoleKeys = api.security.RoleKeys;
import PrincipalKey = api.security.PrincipalKey;
import BodyMask = api.ui.mask.BodyMask;
import Body = api.dom.Body;

export class ContentWizardPanel
    extends api.app.wizard.WizardPanel<Content> {

    private contextSplitPanel: ContextSplitPanel;

    protected wizardActions: ContentWizardActions;

    private contentParams: ContentWizardPanelParams;

    private parentContent: Content;

    private defaultModels: DefaultModels;

    private site: Site;

    private contentType: ContentType;

    private siteModel: SiteModel;

    private liveEditModel: LiveEditModel;

    private contentWizardStep: ContentWizardStep;

    private securityWizardStep: ContentWizardStep;

    private contentWizardStepForm: ContentWizardStepForm;

    private settingsWizardStepForm: SettingsWizardStepForm;

    private settingsWizardStep: ContentWizardStep;

    private scheduleWizardStepForm: ScheduleWizardStepForm;

    private scheduleWizardStep: ContentWizardStep;

    private securityWizardStepForm: SecurityWizardStepForm;

    private xDataWizardStepForms: XDataWizardStepForms;

    private displayNameResolver: DisplayNameResolver;

    private requireValid: boolean;

    private isContentFormValid: boolean;

    private isUpdatingInheritedItem: boolean;

    private contentNamedListeners: { (event: ContentNamedEvent): void }[];

    private inMobileViewMode: boolean;

    private skipValidation: boolean;

    private currentContent: ContentSummaryAndCompareStatus;

    private persistedContent: ContentSummaryAndCompareStatus;

    private dataChangedHandler: () => void;

    private dataChangedListeners: { (): void } [];

    private applicationAddedListener: (event: ApplicationAddedEvent) => void;

    private applicationRemovedListener: (event: ApplicationRemovedEvent) => void;

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

    private renderableChanged: boolean = false;

    private reloadPageEditorOnSave: boolean = true;

    private writePermissions: boolean = false;

    private applicationLoadCount: number;

    private debouncedEditorRefresh: (clearInspection: boolean) => void;

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
        this.applicationLoadCount = 0;

        this.displayNameResolver = new DisplayNameResolver();

        this.xDataWizardStepForms = new XDataWizardStepForms();

        this.initListeners();
        this.listenToContentEvents();
        this.handleSiteConfigApply();
        this.handleBrokenImageInTheWizard();
        this.initBindings();

        this.debouncedEditorRefresh = api.util.AppHelper.debounce((clearInspection: boolean = true) => {
            const livePanel = this.getLivePanel();

            livePanel.skipNextReloadConfirmation(true);
            livePanel.loadPage(clearInspection);
        }, 500);
    }

    private initBindings() {
        let nextActions = this.resolveActions(this);
        let currentKeyBindings = api.ui.Action.getKeyBindings(nextActions);
        api.ui.KeyBindings.get().bindKeys(currentKeyBindings);
    }

    protected createWizardActions(): ContentWizardActions {
        const wizardActions: ContentWizardActions = new ContentWizardActions(this);
        wizardActions.getShowLiveEditAction().setEnabled(false);

        wizardActions.getShowSplitEditAction().onExecuted(() => {
            if (!this.inMobileViewMode) {
                this.getCycleViewModeButton()
                    .selectActiveAction(wizardActions.getShowLiveEditAction());
            }
        });

        const publishActionHandler = () => {
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

    fetchContentXData(): wemQ.Promise<XData[]> {
        return new GetContentXDataRequest(this.getPersistedItem().getContentId()).sendAndParse();
    }

    protected doLoadData(): Q.Promise<Content> {
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
        const thumbnailUploader: ThumbnailUploaderEl = new ThumbnailUploaderEl({
            name: 'thumbnail-uploader',
            deferred: true
        });

        if (this.contentParams.createSite || this.getPersistedItem().isSite()) {
            thumbnailUploader.addClass('site');
        }

        return thumbnailUploader;
    }

    public getFormIcon(): ThumbnailUploaderEl {
        return <ThumbnailUploaderEl>super.getFormIcon();
    }

    protected createMainToolbar(): Toolbar {
        return new ContentWizardToolbar(this.contentParams.application, this.wizardActions);
    }

    public getMainToolbar(): ContentWizardToolbar {
        return <ContentWizardToolbar>super.getMainToolbar();
    }

    protected createWizardHeader(): api.app.wizard.WizardHeader {
        const header: WizardHeaderWithDisplayNameAndName = new WizardHeaderWithDisplayNameAndNameBuilder()
            .setDisplayNameGenerator(this.displayNameResolver)
            .build();

        header.setPath(this.getWizardHeaderPath());

        const existing: Content = this.getPersistedItem();
        if (!!existing) {
            header.initNames(existing.getDisplayName(), existing.getName().toString(), false);
        }

        header.onPropertyChanged(this.dataChangedHandler);

        return header;
    }

    private getWizardHeaderPath(): string {
        if (this.parentContent) {
            return this.parentContent.getPath().prettifyUnnamedPathElements().toString() + '/';
        }

        return '/';
    }

    public getWizardHeader(): WizardHeaderWithDisplayNameAndName {
        return <WizardHeaderWithDisplayNameAndName>super.getWizardHeader();
    }

    public getLivePanel(): LiveFormPanel {
        return <LiveFormPanel>super.getLivePanel();
    }

    protected createWizardAndDetailsSplitPanel(leftPanel: api.ui.panel.Panel): api.ui.panel.SplitPanel {
        const wizardActions = this.getWizardActions();
        const contextActions = [
            wizardActions.getUnpublishAction(),
            wizardActions.getPublishAction(),
            wizardActions.getDeleteAction(),
            wizardActions.getDuplicateAction()
        ];

        const data = this.getLivePanel() ? this.getLivePanel().getPageEditorData() : LiveFormPanel.createEmptyPageEditorData();
        this.contextSplitPanel = new ContextSplitPanel(leftPanel, contextActions, data);

        this.onRendered(() => {
            const mainToolbar = this.getMainToolbar();
            const toggler = mainToolbar.getMobileItemStatisticsToggler();
            this.contextSplitPanel.onMobileModeChanged((isMobile: boolean) => {
                if (!isMobile) {
                    if (toggler.isActive()) {
                        toggler.setActive(false);
                    }
                }
            });

            toggler.onActiveChanged((isActive) => {
                if (this.contextSplitPanel.isMobileMode()) {
                    if (isActive) {
                        this.contextSplitPanel.setContent(this.persistedContent);
                        this.contextSplitPanel.showMobilePanel();
                    } else {
                        this.contextSplitPanel.hideMobilePanel();
                    }
                }
            });
        });

        return this.contextSplitPanel;
    }

    protected createLivePanel(): api.ui.panel.Panel {
        if (this.isLivePanelAllowed()) {
            return new LiveFormPanel(<LiveFormPanelConfig>{
                contentWizardPanel: this,
                contentType: this.contentType.getContentTypeName(),
                defaultModels: this.defaultModels
            });
        }

        return null;
    }

    private isLivePanelAllowed(): boolean {
        const isSiteOrWithinSite: boolean = !!this.site || this.contentParams.createSite;
        const isPageTemplate: boolean = this.contentType.isPageTemplate();
        const isShortcut: boolean = this.contentType.isShortcut();

        return (isSiteOrWithinSite || isPageTemplate) && !isShortcut;
    }

    getWizardActions(): ContentWizardActions {
        return <ContentWizardActions>super.getWizardActions();
    }

    doRenderOnDataLoaded(rendered: boolean): Q.Promise<boolean> {

        return super.doRenderOnDataLoaded(rendered).then(() => {
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doRenderOnDataLoaded at ' + new Date().toISOString());
            }

            this.appendChild(this.getContentWizardToolbarPublishControls().getPublishButtonForMobile());

            if (this.getLivePanel()) {
                this.getLivePanel().updateWritePermissions(this.writePermissions);
            }

            if (this.contentType.hasDisplayNameExpression()) {
                this.displayNameResolver.setExpression(this.contentType.getDisplayNameExpression());
            }

            this.addClass('content-wizard-panel');

            this.inMobileViewMode = false;

            ResponsiveManager.onAvailableSizeChanged(this, this.availableSizeChangedHandler.bind(this));

            this.onRemoved(() => {
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

            this.contextSplitPanel.onRendered(() => this.contextSplitPanel.setContent(this.persistedContent));

            this.formPanel.onRendered(() => {
                if (this.getPersistedItem().isInherited()) {
                    this.handleInheritedContent();
                }
            });

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
                            this.updateSiteModel(<Site>persistedItem);
                        }
                    });
                }
            }

            if (persistedItem.getType().isImage()) {
                this.updateWizard(persistedItem);
            } else if (this.securityWizardStepForm) { // update security wizard to have new path/displayName etc.
                this.securityWizardStepForm.update(persistedItem);
            }

            this.xDataWizardStepForms.resetDisabledForms();

            return persistedItem;
        }).finally(() => {
            this.contentUpdateDisabled = false;
            this.updateButtonsState();
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

        if (this.contentType.hasDisplayNameExpression()) {
            if (!this.contentWizardStepForm.giveFocus()) {
                this.getWizardHeader().giveFocus();
            }
        } else {
            this.getWizardHeader().giveFocus();
        }

        this.startRememberFocus();
    }

    doLayout(persistedContent: Content): wemQ.Promise<void> {

        return super.doLayout(persistedContent).then(() => {

            const persistedContentCopy = persistedContent.clone();

            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doLayout at ' + new Date().toISOString(), persistedContent);
            }

            this.updateThumbnailWithContent(persistedContent);

            let wizardHeader = this.getWizardHeader();

            wizardHeader.setSimplifiedNameGeneration(persistedContent.getType().isDescendantOfMedia());

            if (this.isRendered()) {

                let viewedContent = this.assembleViewedContent(persistedContent.newBuilder()).build();
                if (viewedContent.equals(persistedContent) || this.skipValidation) {

                    // force update wizard with server bounced values to erase incorrect ones
                    this.updateWizard(persistedContentCopy, false);

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
                        this.updateXDataStepForms(persistedContentCopy);
                    } else {
                        new ConfirmationDialog()
                            .setQuestion(i18n('dialog.confirm.contentDiffers'))
                            .setYesCallback(() => this.doLayoutPersistedItem(persistedContentCopy))
                            .setNoCallback(() => { /* empty */
                            })
                            .show();
                    }
                }

                return this.updatePersistedContent(persistedContentCopy);

            } else {

                return this.doLayoutPersistedItem(persistedContentCopy).then(() => {
                    return this.updatePersistedContent(persistedContent);
                });
            }

        });

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
    }

    public checkContentCanBePublished(): boolean {
        if (this.getContentWizardToolbarPublishControls().isPendingDelete()) {
            // allow deleting published content without validity check
            return true;
        }

        if (!this.isContentFormValid) {
            return false;
        }

        let allMetadataFormsValid = true;
        let allMetadataFormsHaveValidUserInput = true;

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            if (!form.isValid()) {
                allMetadataFormsValid = false;
            }
            let formHasValidUserInput = form.getFormView().hasValidUserInput();
            if (!formHasValidUserInput) {
                allMetadataFormsHaveValidUserInput = false;
            }
        });
        return allMetadataFormsValid && allMetadataFormsHaveValidUserInput;
    }

    private isCurrentContentId(id: api.content.ContentId): boolean {
        return this.getPersistedItem() && id && this.getPersistedItem().getContentId().equals(id);
    }

    private persistedItemPathIsDescendantOrEqual(path: ContentPath): boolean {
        return this.getPersistedItem().getPath().isDescendantOf(path) || this.getPersistedItem().getPath().equals(path);
    }

    private formContext: ContentFormContext;

    private initListeners() {

        let shownAndLoadedHandler = () => {
            if (this.getPersistedItem()) {
                Router.get().setHash('edit/' + this.getPersistedItem().getId());
            } else {
                Router.get().setHash('new/' + this.contentType.getName());
            }
        };

        this.onShown(() => {
            if (this.isDataLoaded()) {
                shownAndLoadedHandler();
            } else {
                this.onDataLoaded(shownAndLoadedHandler);
            }
        });

        // this.onRendered(() => {
        //     if (this.getPersistedItem().isInherited()) {
        //         this.handleInheritedContent();
        //     }
        // });

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

        this.applicationAddedListener = (event: ApplicationAddedEvent) => {
            this.addXDataStepForms(event.getApplicationKey());
        };

        this.applicationRemovedListener = (event: ApplicationRemovedEvent) => {
            this.removeXDataStepForms(event.getApplicationKey());
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


        InspectEvent.on((event: InspectEvent) => {
            const minimizeWizard = event.isShowPanel() &&
                                   !this.isMinimized() &&
                                   this.renderable &&
                                   this.getLivePanel().isShown() &&
                                   !this.contextSplitPanel.isMobileMode() &&
                                   ResponsiveRanges._1380_1620.isFitOrSmaller(this.getEl().getWidthWithBorder());
            if (minimizeWizard) {
                this.toggleMinimize();
            }
        });

    }

    private handleInheritedContent() {
        const confirmDialog: ConfirmLocalContentCreateDialog = new ConfirmLocalContentCreateDialog();
        confirmDialog.setLocalCopyCreateHandler(this.createLocalCopy.bind(this));
        confirmDialog.setCancelHandler(() => {
            Body.get().addClass('readonly');
            BodyMask.get().show();
            api.notify.showFeedback(i18n('notify.panel.readonly'));

            Body.get().onMouseWheel((event: WheelEvent) => {
                this.formPanel.getHTMLElement().scrollBy(0, event.deltaY);
            });
        });
        confirmDialog.open();
    }

    private createLocalCopy() {
        this.isUpdatingInheritedItem = true;
        this.saveChanges().then(() => {
            api.notify.showFeedback(i18n('notify.layer.local.created', LayerContext.get().getCurrentLayer().getLanguage()));
        }).catch(api.DefaultErrorHandler.handle).finally(() => {
            this.isUpdatingInheritedItem = false;
        });
    }

    private onFileUploaded(event: api.ui.uploader.UploadedEvent<Content>) {
        let newPersistedContent: Content = event.getUploadItem().getModel();
        this.setPersistedItem(newPersistedContent.clone());
        this.updateXDataStepForms(newPersistedContent);
        this.updateThumbnailWithContent(newPersistedContent);

        this.showFeedbackContentSaved(newPersistedContent);
    }

    private updateWizard(content: Content, unchangedOnly: boolean = true) {
        this.updateWizardHeader(content);
        this.updateWizardStepForms(content, unchangedOnly);
        this.updateXDataStepForms(content, unchangedOnly);
        this.resetLastFocusedElement();

        if (content.isSite()) {
            this.updateSiteModel(<Site>content);
        }
    }

    private removeXDataSteps(xDatas: XData[]) {
        xDatas.map((xData: XData) => xData.getXDataName().toString()).forEach((xDataNameStr: string) => {
            if (this.xDataWizardStepForms.contains(xDataNameStr)) {
                this.removeStepWithForm(this.xDataWizardStepForms.get(xDataNameStr));
                this.xDataWizardStepForms.remove(xDataNameStr);
            }
        });
    }

    private resetWizard() {

        this.getWizardHeader().resetBaseValues();

        this.contentWizardStepForm.reset();
        this.settingsWizardStepForm.reset();
        this.scheduleWizardStepForm.reset();
        this.xDataWizardStepForms.reset();
    }

    private updateContent(compareStatus: CompareStatus) {
        this.persistedContent = this.currentContent.setCompareStatus(compareStatus);
        this.getContentWizardToolbarPublishControls().setContent(this.currentContent);
        this.getMainToolbar().setItem(this.currentContent);

        this.wizardActions.refreshPendingDeleteDecorations();
    }

    private isOutboundDependencyUpdated(content: ContentSummaryAndCompareStatus): wemQ.Promise<boolean> {
        return ContentHelper.isReferencedBy(content.getContentSummary(), this.persistedContent.getContentId());
    }

    private isUpdateOfPageModelRequired(content: ContentSummaryAndCompareStatus): wemQ.Promise<boolean> {
        // 3. outbound dependency content has changed
        return this.isOutboundDependencyUpdated(content).then(outboundDependencyUpdated => {
            const viewedPage = this.assembleViewedPage();
            const pageChanged = !api.ObjectHelper.equals(this.getPersistedItem().getPage(), viewedPage);

            return outboundDependencyUpdated && !pageChanged;
        });
    }

    private isNearestSiteChanged(content: ContentSummaryAndCompareStatus): boolean {
        const persistedContent = this.getPersistedItem();
        const isSiteUpdated = content.getType().isSite();
        const isPageTemplateUpdated = content.getType().isPageTemplate();
        const isItemUnderUpdatedSite = persistedContent.getPath().isDescendantOf(content.getPath());
        const site = persistedContent.isSite() ? <Site>persistedContent : this.site;

        const isUpdatedItemUnderSite = site ? content.getPath().isDescendantOf(site.getPath()) : false;

        // 1. template of the nearest site was updated
        // 2. nearest site was updated (app may have been added)
        const nearestSiteChanged = (isPageTemplateUpdated && isUpdatedItemUnderSite) || (isSiteUpdated && isItemUnderUpdatedSite);

        return nearestSiteChanged;
    }

    private createSteps(): ContentWizardStep[] {
        const steps: ContentWizardStep[] = [];

        this.contentWizardStep = new ContentWizardStep(this.contentType.getDisplayName(), this.contentWizardStepForm);
        steps.push(this.contentWizardStep);

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            steps.push(new XDataWizardStep(form));
        });

        this.scheduleWizardStep = new ContentWizardStep(i18n('field.schedule'), this.scheduleWizardStepForm, 'icon-calendar');
        steps.push(this.scheduleWizardStep);

        this.settingsWizardStep = new ContentWizardStep(i18n('field.settings'), this.settingsWizardStepForm, 'icon-wrench');
        steps.push(this.settingsWizardStep);

        this.securityWizardStep = new ContentWizardStep(i18n('field.access'), this.securityWizardStepForm,
            this.canEveryoneRead(this.getPersistedItem()) ? 'icon-unlock' : 'icon-lock');
        steps.push(this.securityWizardStep);

        return steps;
    }

    private fetchPersistedContent(): wemQ.Promise<Content> {
        return new GetContentByIdRequest(this.getPersistedItem().getContentId()).sendAndParse();
    }

    private listenToContentEvents() {

        const serverEvents: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        const deleteHandler = (event: ContentDeletedEvent) => {
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
                    this.loadDefaultModelsAndUpdatePageModel().done();
                    return true;
                }
            });

        };

        const publishOrUnpublishHandler = (contents: ContentSummaryAndCompareStatus[]) => {
            contents.forEach(content => {
                if (this.isCurrentContentId(content.getContentId())) {
                    this.persistedContent = this.currentContent = content;
                    this.getContentWizardToolbarPublishControls().setContent(content, false);
                    this.getMainToolbar().setItem(content);
                    this.refreshScheduleWizardStep();

                    this.getWizardHeader().toggleNameGeneration(content.getCompareStatus() !== CompareStatus.EQUAL);
                }
            });

            this.getContentWizardToolbarPublishControls().refreshState();
        };

        const updateHandler = (updatedContent: ContentSummaryAndCompareStatus) => {
            const contentId: ContentId = updatedContent.getContentId();

            if (this.isCurrentContentId(contentId)) {
                this.handlePersistedContentUpdate(updatedContent);
            } else {
                this.handleOtherContentUpdate(updatedContent);
            }

            // checks if parent site has been modified
            if (this.isParentSiteModified(contentId)) {
                new ContentWizardDataLoader().loadSite(contentId).then(this.updateSiteModel.bind(this)).catch(
                    api.DefaultErrorHandler.handle).done();
            }
        };

        const updatePermissionsHandler = (updatedContent: ContentSummaryAndCompareStatus) => {
            const contentId: ContentId = updatedContent.getContentId();

            if (this.isCurrentContentId(contentId)) {
                const isAlreadyUpdated = updatedContent.equals(this.getPersistedItem());

                if (isAlreadyUpdated) {
                    return;
                }
                this.setUpdatedContent(updatedContent);

                this.fetchPersistedContent().then((content) => {
                    this.setPersistedItem(content.clone());
                    this.securityWizardStepForm.update(content, true);
                    this.updateSecurityWizardStepIcon(content);
                    new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
                        this.getContentWizardToolbarPublishControls().setUserCanPublish(this.isContentPublishableByUser(loginResult));
                        this.toggleStepFormsVisibility(loginResult);
                    });
                });

            } else {
                this.handleOtherContentUpdate(updatedContent);
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

                        this.loadDefaultModelsAndUpdatePageModel().done();

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

        const contentPermissionsUpdatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            if (!this.contentUpdateDisabled) {
                data.forEach((updated: ContentSummaryAndCompareStatus) => {
                    updatePermissionsHandler(updated);
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

        const versionChangeHandler = this.updateButtonsState.bind(this);

        ActiveContentVersionSetEvent.on(versionChangeHandler);
        ContentDeletedEvent.on(deleteHandler);

        serverEvents.onContentMoved(movedHandler);
        serverEvents.onContentSorted(sortedHandler);
        serverEvents.onContentUpdated(contentUpdatedHandler);
        serverEvents.onContentPermissionsUpdated(contentPermissionsUpdatedHandler);
        serverEvents.onContentPublished(publishOrUnpublishHandler);
        serverEvents.onContentUnpublished(publishOrUnpublishHandler);

        serverEvents.onContentCreated(childrenModifiedHandler);
        serverEvents.onContentDeleted(childrenModifiedHandler);

        this.onClosed(() => {
            ActiveContentVersionSetEvent.un(versionChangeHandler);
            ContentDeletedEvent.un(deleteHandler);

            serverEvents.unContentMoved(movedHandler);
            serverEvents.unContentSorted(sortedHandler);
            serverEvents.unContentUpdated(contentUpdatedHandler);
            serverEvents.unContentPermissionsUpdated(contentPermissionsUpdatedHandler);
            serverEvents.unContentPublished(publishOrUnpublishHandler);
            serverEvents.unContentUnpublished(publishOrUnpublishHandler);

            serverEvents.unContentCreated(childrenModifiedHandler);
            serverEvents.unContentDeleted(childrenModifiedHandler);
        });
    }

    private setUpdatedContent(updatedContent: ContentSummaryAndCompareStatus) {
        this.persistedContent = this.currentContent = updatedContent;
        this.getContentWizardToolbarPublishControls().setContent(this.currentContent);
        this.getMainToolbar().setItem(updatedContent);
        this.contextSplitPanel.setContent(updatedContent);
    }

    private handlePersistedContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        this.setUpdatedContent(updatedContent);

        if (this.currentContent.getCompareStatus() != null) {
            this.refreshScheduleWizardStep();
        }

        this.fetchPersistedContent().then(this.updatePersistedItemIfNeeded.bind(this)).catch(api.DefaultErrorHandler.handle).done();
    }

    private updatePersistedItemIfNeeded(content: Content) {
        let isEqualToForm;
        let imageHasChanged;

        const current = this.assembleViewedContent(new ContentBuilder(this.getPersistedItem())).build();

        if (content.getType().isImage()) {
            imageHasChanged = content.getIconUrl() !== current.getIconUrl();

            // if new image has been uploaded then different iconUrl was generated on server from what we have here
            // in this case don't compare extraData as it will be different for new image too
            isEqualToForm = content.getDisplayName() === current.getDisplayName() &&
                            content.getName().equals(current.getName()) &&
                            (imageHasChanged || content.extraDataEquals(current.getAllExtraData(), true)) &&
                            content.dataEquals(current.getContentData(), true) &&
                            content.getPermissions().equals(current.getPermissions());
        } else {
            // Use `content` as `this` value in the `equals` call:
            // `current` is instance of `Content`, while content may be the instance of `Site`.
            // Another order may result in returning `false`.
            isEqualToForm = current.equals(content, true);
        }

        if (!isEqualToForm || imageHasChanged) { //if image has changed then content contains new extraData to be set
            this.setPersistedItem(content.clone());
            this.updateWizard(content, true);

            if (this.isEditorEnabled()) {
                // also update live form panel for renderable content without asking
                this.updateLiveForm(content);
            }

            if (this.isDisplayNameUpdated()) {
                // this.getWizardHeader().forceChangedEvent();
            } else {
                this.getWizardHeader().resetBaseValues();
            }

            this.wizardActions.setDeleteOnlyMode(current, false);
        } else {
            // this update was triggered by our changes, so reset dirty state after save
            this.resetWizard();
        }
    }

    private handleOtherContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        const contentId: ContentId = updatedContent.getContentId();
        const containsIdPromise: wemQ.Promise<boolean> = this.createComponentsContainIdPromise(contentId);
        const templateUpdatedPromise: wemQ.Promise<boolean> = this.createTemplateUpdatedPromise(updatedContent);

        this.getContentWizardToolbarPublishControls().refreshState();

        wemQ.all([containsIdPromise, templateUpdatedPromise]).spread((containsId, templateUpdated) => {
            if (containsId || templateUpdated) {
                this.debouncedEditorRefresh(false);
            }
        }).catch(api.DefaultErrorHandler.handle).done();
    }

    private loadDefaultModelsAndUpdatePageModel(reloadPage: boolean = true) {
        const item = this.getPersistedItem();
        const site = item.isSite() ? <Site>item : this.site;

        return new ContentWizardDataLoader().loadDefaultModels(site, this.contentType.getContentTypeName()).then(
            defaultModels => {
                this.defaultModels = defaultModels;
                return !this.liveEditModel ?
                       wemQ(false) :
                       this.initPageModel(this.liveEditModel, defaultModels).then(() => {
                           const livePanel = this.getLivePanel();
                           // pageModel is updated so we need reload unless we're saving already
                           const needsReload = !this.isSaving();
                           if (livePanel) {
                               livePanel.setModel(this.liveEditModel, true);
                               if (needsReload && reloadPage) {
                                   this.debouncedEditorRefresh(true);
                               }
                           }
                           return needsReload;
                       });
            });
    }

    private createComponentsContainIdPromise(contentId: ContentId): wemQ.Promise<boolean> {
        return this.doComponentsContainId(contentId).then((contains) => {
            if (contains) {
                return this.fetchPersistedContent().then((content: Content) => {
                    this.updateWizard(content, true);
                    return this.isEditorEnabled();
                });
            } else {
                return wemQ(false);
            }
        });
    }

    private createTemplateUpdatedPromise(updatedContent: ContentSummaryAndCompareStatus): wemQ.Promise<boolean> {
        if (this.isNearestSiteChanged(updatedContent)) {
            this.updateButtonsState();
            return this.loadDefaultModelsAndUpdatePageModel(false);
        }

        return this.isUpdateOfPageModelRequired(updatedContent).then(value => {
            if (value) {
                return this.loadDefaultModelsAndUpdatePageModel(false);
            }

            return wemQ(false);
        });

    }

    private isParentSiteModified(contentId: ContentId): boolean {
        if (!this.site) {
            return false;
        }

        if (!this.siteModel) {
            return false;
        }

        if (!this.site.getContentId().equals(contentId)) {
            return false;
        }

        return !this.persistedContent.getContentId().equals(contentId);
    }

    private doComponentsContainId(contentId: ContentId): wemQ.Promise<boolean> {
        const page = this.getPersistedItem().getPage();

        if (page) {
            if (this.doHtmlAreasContainId(contentId.toString())) {
                return wemQ(true);
            }

            return ContentHelper.containsChildContentId(this.getPersistedItem(), contentId);
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
                api.ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.FormOptionSetOption)) {
                result = result.concat(this.getHtmlAreasInForm(<any>item));
            } else if (api.ObjectHelper.iFrameSafeInstanceOf(item, api.form.Input)) {
                let input = <api.form.Input>item;
                if (input.getInputType().getName() === 'HtmlArea') {
                    result.push(input.getPath().toString());
                }
            }
        });

        return result;
    }

    private updateLiveForm(content: Content): wemQ.Promise<any> {
        let formContext = this.getFormContext(content);

        let liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {

            let site = content.isSite() ? <Site>content : this.site;

            this.unbindSiteModelListeners();
            this.siteModel = this.siteModel ? this.updateSiteModel(site) : this.createSiteModel(site);
            this.initSiteModelListeners();

            return this.initLiveEditModel(content, this.siteModel, formContext).then((liveEditModel) => {
                this.liveEditModel = liveEditModel;

                const showPanel = this.renderableChanged && this.renderable;
                liveFormPanel.setModel(this.liveEditModel, showPanel, false);

                this.debouncedEditorRefresh(false);

                return wemQ(null);
            });
        }
        if (!this.siteModel && content.isSite()) {
            this.siteModel = this.createSiteModel(<Site>content);
            this.initSiteModelListeners();
        }
    }

    private updatePersistedContent(persistedContent: Content) {
        return ContentSummaryAndCompareStatusFetcher.fetchByContent(persistedContent).then((summaryAndStatus) => {
            this.persistedContent = this.currentContent = summaryAndStatus;

            this.getWizardHeader().toggleNameGeneration(this.currentContent.getCompareStatus() === CompareStatus.NEW);
            this.getMainToolbar().setItem(this.currentContent);
            new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
                this.getContentWizardToolbarPublishControls().setContent(this.currentContent).setLeafContent(
                    !this.getPersistedItem().hasChildren()).setUserCanPublish(this.isContentPublishableByUser(loginResult));
            });
        });
    }

    private isContentPublishableByUser(loginResult: LoginResult): boolean {
        return PermissionHelper.hasPermission(Permission.PUBLISH, loginResult, this.getPersistedItem().getPermissions());
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
                this.siteModel = this.siteModel ? this.updateSiteModel(site) : this.createSiteModel(site);
                this.initSiteModelListeners();

                this.initLiveEditModel(content, this.siteModel, formContext).then((liveEditModel) => {
                    this.liveEditModel = liveEditModel;

                    liveFormPanel.setModel(this.liveEditModel, false);
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

    // sync persisted content extra data with xData
    // when rendering form - we may add extra fields from xData;
    // as this is intended action from XP, not user - it should be present in persisted content
    private syncPersistedItemWithXData(xDataName: XDataName, xDataPropertyTree: PropertyTree) {
        let persistedContent = this.getPersistedItem();
        let extraData = persistedContent.getExtraData(xDataName);
        if (!extraData) { // ensure ExtraData object corresponds to each step form
            this.enrichWithExtraData(persistedContent, xDataName, xDataPropertyTree.copy());
        } else {
            let diff = extraData.getData().diff(xDataPropertyTree);
            diff.added.forEach((property: api.data.Property) => {
                extraData.getData().addProperty(property.getName(), property.getValue());
            });
        }
    }

    private enrichWithExtraData(content: Content, xDataName: XDataName, propertyTree?: PropertyTree): ExtraData {
        let extraData = new ExtraData(xDataName, propertyTree ? propertyTree.copy() : new PropertyTree());
        content.getAllExtraData().push(extraData);
        return extraData;
    }

    private syncPersistedItemWithContentData(propertyTree: PropertyTree) {
        const persistedContent: Content = this.getPersistedItem();
        const persistedContentData: PropertyTree = persistedContent.getContentData();

        const tree: PropertyTree = this.cleanFormOptionSetsRedundantData(propertyTree.copy());

        persistedContentData.getRoot().syncEmptyArrays(tree.getRoot());

        const diff = persistedContentData.diff(tree);
        diff.added.forEach((property: api.data.Property) => {
            persistedContentData.setPropertyByPath(property.getPath(), property.getValue());
        });

        if (diff.added && diff.added.length > 0) {
            this.wizardActions.refreshSaveActionState();
        }
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
        } else if (this.getSplitPanel()) {
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

        const formContext: ContentFormContext = this.getFormContext(content);

        return this.updateButtonsState().then(() => {
            return this.initLiveEditor(formContext, content).then(() => {

                this.fetchMissingOrStoppedAppKeys().then(this.handleMissingApp.bind(this));

                return this.createWizardStepForms().then(() => {
                    const steps: ContentWizardStep[] = this.createSteps();
                    this.setSteps(steps);

                    return this.layoutWizardStepForms(content).then(() => {
                        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
                            this.initWritePermissions(loginResult);
                            this.toggleStepFormsVisibility(loginResult);
                        });

                        this.syncPersistedItemWithContentData(content.getContentData());
                        this.xDataWizardStepForms.resetState();

                        this.contentWizardStepForm.getFormView().addClass('panel-may-display-validation-errors');
                        if (this.formState.isNew()) {
                            this.contentWizardStepForm.getFormView().highlightInputsOnValidityChange(true);
                        } else {
                            this.displayValidationErrors(!this.isValid());
                        }

                        this.enableDisplayNameScriptExecution(this.contentWizardStepForm.getFormView());

                        if (!this.siteModel && content.isSite()) {
                            this.siteModel = this.createSiteModel(<Site>content);
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

    private createWizardStepForms(): wemQ.Promise<void> {
        this.contentWizardStepForm = new ContentWizardStepForm();
        this.settingsWizardStepForm = new SettingsWizardStepForm();
        this.scheduleWizardStepForm = new ScheduleWizardStepForm();
        this.securityWizardStepForm = new SecurityWizardStepForm();

        return this.fetchContentXData().then(this.createXDataWizardStepForms.bind(this));
    }

    private createXDataWizardStepForms(xDatas: XData[]): XDataWizardStepForm[] {
        const added: XDataWizardStepForm[] = [];

        xDatas.forEach((xData: XData) => {
            const stepForm: XDataWizardStepForm = new XDataWizardStepForm(xData);
            stepForm.onEnableChanged(this.dataChangedHandler);
            this.xDataWizardStepForms.add(stepForm);
            added.push(stepForm);
        });

        return added;
    }

    private fetchMissingOrStoppedAppKeys(): wemQ.Promise<void> {
        this.missingOrStoppedAppKeys = [];

        const applicationKeys = this.site ? this.site.getApplicationKeys() : [];
        const applicationPromises = applicationKeys.map((key: ApplicationKey) => this.fetchApplication(key));

        return wemQ.all(applicationPromises).thenResolve(null);
    }

    private layoutWizardStepForms(content: Content): wemQ.Promise<void> {
        const contentData = content.getContentData();
        contentData.onChanged(this.dataChangedHandler);

        const formViewLayoutPromises: wemQ.Promise<void>[] = [];
        formViewLayoutPromises.push(
            this.contentWizardStepForm.layout(this.getFormContext(content), contentData, this.contentType.getForm()));
        // Must pass FormView from contentWizardStepForm displayNameResolver,
        // since a new is created for each call to renderExisting
        this.displayNameResolver.setFormView(this.contentWizardStepForm.getFormView());
        this.settingsWizardStepForm.layout(content);
        this.settingsWizardStepForm.onPropertyChanged(this.dataChangedHandler);
        this.scheduleWizardStepForm.layout(content);
        this.scheduleWizardStepForm.onPropertyChanged(this.dataChangedHandler);
        this.refreshScheduleWizardStep();
        this.securityWizardStepForm.layout(content);

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            const promise: wemQ.Promise<void> = this.layoutXDataWizardStepForm(content, form);

            form.getData().onChanged(this.dataChangedHandler);

            formViewLayoutPromises.push(promise);
        });

        return wemQ.all(formViewLayoutPromises).thenResolve(null);
    }

    private toggleStepFormsVisibility(loginResult: LoginResult) {
        const visible: boolean = this.isSecurityFormAllowed(loginResult);

        this.securityWizardStepForm.setVisible(visible);
        this.securityWizardStepForm.getPreviousElement().setVisible(visible);
        this.securityWizardStep.getTabBarItem().setVisible(visible);
        this.settingsWizardStepForm.setVisible(visible);
        this.settingsWizardStepForm.getPreviousElement().setVisible(visible);
        this.settingsWizardStep.getTabBarItem().setVisible(visible);
    }

    private isSecurityFormAllowed(loginResult: LoginResult): boolean {
        if (loginResult.getPrincipals().some(principalKey => RoleKeys.isAdmin(principalKey))) {
            return true;
        }

        if (loginResult.isContentAdmin()) {
            return true;
        }

        if (loginResult.isContentExpert()) {
            return true;
        }

        return this.hasFullAccess(loginResult);
    }

    private hasFullAccess(loginResult: LoginResult): boolean {
        const principalKeysWithFullAccess: PrincipalKey[] = this.getPersistedItem().getPermissions().getEntries().filter(
            (ace: AccessControlEntry) => AccessControlEntryView.getAccessValueFromEntry(ace) === Access.FULL).map(
            (ace: AccessControlEntry) => ace.getPrincipalKey());

        return principalKeysWithFullAccess.some((principalFullAccess: PrincipalKey) => loginResult.getPrincipals().some(
            (principal: PrincipalKey) => principalFullAccess.equals(principal)));
    }

    private updateSiteModel(site: Site): SiteModel {
        this.unbindSiteModelListeners();
        this.siteModel.update(site);
        this.initSiteModelListeners();

        return this.siteModel;
    }

    private createSiteModel(site: Site): SiteModel {
        const siteModel = new SiteModel(site);

        const handler = api.util.AppHelper.debounce(() => {
            return this.fetchContentXData().then((xDatas: XData[]) => {
                this.removeXDataSteps(this.getXDatasToRemove(xDatas));
                return this.addXDataSteps(this.getXDatasToAdd(xDatas)).then(() => {
                    this.notifyDataChanged();
                });
            }).finally(() => {
                this.formMask.hide();
            });
        }, 100, false);

        siteModel.onSiteModelUpdated(() => {
            this.formMask.show();
            handler();
        });

        return siteModel;
    }

    private getXDatasToRemove(xDatas: XData[]): XData[] {
        return this.getXDataWizardSteps().filter(
            (step: XDataWizardStep) => !xDatas.some((xData: XData) => xData.getXDataName().equals(step.getXDataName()))).map(
            (step: XDataWizardStep) => step.getStepForm().getXData());
    }

    private getXDataWizardSteps(): XDataWizardStep[] {
        return <XDataWizardStep[]>this.getSteps().filter(step => {
            if (ObjectHelper.iFrameSafeInstanceOf(step, XDataWizardStep)) {
                return true;
            }

            return false;
        });
    }

    private getXDatasToAdd(xDatas: XData[]): XData[] {
        return xDatas.filter((xData: XData) => !this.xDataWizardStepForms.contains(xData.getXDataName().toString()));
    }

    private addXDataSteps(xDatas: XData[]): wemQ.Promise<void> {
        const content: Content = this.getPersistedItem().clone();
        const formViewLayoutPromises: wemQ.Promise<void>[] = [];

        const formsAdded: XDataWizardStepForm[] = this.createXDataWizardStepForms(xDatas);
        formsAdded.forEach((form: XDataWizardStepForm) => {
            this.insertStepBefore(new XDataWizardStep(form), this.settingsWizardStep);
            form.resetHeaderState();
            const promise: wemQ.Promise<void> = this.layoutXDataWizardStepForm(content, form);
            form.getData().onChanged(this.dataChangedHandler);

            formViewLayoutPromises.push(promise);
        });

        return wemQ.all(formViewLayoutPromises).thenResolve(null);
    }

    private layoutXDataWizardStepForm(content: Content, xDataStepForm: XDataWizardStepForm): wemQ.Promise<void> {
        const extraData = content.getExtraData(xDataStepForm.getXData().getXDataName());
        const data: PropertyTree = extraData ? extraData.getData() : new PropertyTree();

        const xDataForm: Form = new api.form.FormBuilder().addFormItems(xDataStepForm.getXData().getFormItems()).build();

        return xDataStepForm.layout(this.getFormContext(content), data, xDataForm).then(() => {
            this.syncPersistedItemWithXData(xDataStepForm.getXDataName(), data);
            return wemQ(null);
        });
    }

    private initLiveEditModel(content: Content, siteModel: SiteModel, formContext: ContentFormContext): wemQ.Promise<LiveEditModel> {
        const liveEditModel = LiveEditModel.create()
            .setParentContent(this.parentContent)
            .setContent(content)
            .setContentFormContext(formContext)
            .setSiteModel(siteModel)
            .build();

        return this.initPageModel(liveEditModel, this.defaultModels).then(() => liveEditModel);
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

    private getOptionSetsInForm(formItemContainer: api.form.FormItemContainer): FormOptionSet[] {
        let result: FormOptionSet[] = [];

        formItemContainer.getFormItems().forEach((item) => {
            if (api.ObjectHelper.iFrameSafeInstanceOf(item, FormItemSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, FieldSet) ||
                api.ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSetOption)) {
                result = result.concat(this.getOptionSetsInForm(<any>item));
            } else if (api.ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSet)) {
                result.push(<api.form.FormOptionSet>item);
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

            if (!this.isUpdatingInheritedItem) {
                this.showFeedbackContentSaved(content);
            }

            this.getWizardHeader().resetBaseValues();

            return content;
        }).then((content: Content) => {
            this.contentWizardStepForm.validate();
            this.displayValidationErrors(!this.isValid());

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
            .setLanguage(this.getLanguageForUpdateRequest(viewedContent))
            .setPublishFrom(viewedContent.getPublishFromTime())
            .setPublishTo(viewedContent.getPublishToTime())
            .setPermissions(viewedContent.getPermissions())
            .setInheritPermissions(viewedContent.isInheritPermissionsEnabled())
            .setOverwritePermissions(viewedContent.isOverwritePermissionsEnabled());
    }

    private getLanguageForUpdateRequest(viewedContent: Content): string {
        if (viewedContent.getLanguage()) {
            return viewedContent.getLanguage();
        }

        if (viewedContent.isInherited()) {
            return LayerContext.get().getCurrentLayer().getLanguage();
        }

        return null;
    }

    private isDisplayNameUpdated(): boolean {
        return this.getPersistedItem().getDisplayName() !== this.getWizardHeader().getDisplayName();
    }

    hasUnsavedChanges(): boolean {
        if (!this.isRendered()) {
            return false;
        }

        const persistedContent: Content = this.getPersistedItem();

        if (persistedContent == null) {
            return true;
        }

        const viewedContent: Content = this.assembleViewedContent(new ContentBuilder(persistedContent), true).build();

        return !viewedContent.equals(persistedContent);
    }

    private enableDisplayNameScriptExecution(formView: FormView) {

        if (this.displayNameResolver.hasExpression()) {

            formView.onKeyUp((event: KeyboardEvent) => {
                this.getWizardHeader().setDisplayName(this.displayNameResolver.execute());
            });
        }
    }

    private addXDataStepForms(applicationKey: ApplicationKey): wemQ.Promise<void> {

        this.applicationLoadCount++;
        this.formMask.show();

        return new GetApplicationXDataRequest(this.persistedContent.getType(), applicationKey).sendAndParse().then(
            (xDatas: XData[]) => {
                const xDatasToAdd: XData[] = xDatas.filter((xData: XData) => !this.xDataWizardStepForms.contains(xData.getName()));

                const layoutPromises = [];

                const formsAdded: XDataWizardStepForm[] = this.createXDataWizardStepForms(xDatasToAdd);
                formsAdded.forEach((form: XDataWizardStepForm) => {
                    this.insertStepBefore(new XDataWizardStep(form), this.settingsWizardStep);

                    form.onRendered(() => {
                        form.validate(false, true);
                    });

                    const promise: wemQ.Promise<void> = this.layoutXDataWizardStepFormOfPersistedItem(form);

                    form.getData().onChanged(this.dataChangedHandler);

                    layoutPromises.push(promise);
                });

                return wemQ.all(layoutPromises).then(() => {
                    this.xDataWizardStepForms.resetState();
                });

            }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).finally(() => {
            if (--this.applicationLoadCount === 0) {
                this.formMask.hide();
            }
        });
    }

    private layoutXDataWizardStepFormOfPersistedItem(xDataStepForm: XDataWizardStepForm): wemQ.Promise<void> {
        const data: PropertyTree = new PropertyTree();

        const xDataForm: Form = new api.form.FormBuilder().addFormItems(xDataStepForm.getXData().getFormItems()).build();

        return xDataStepForm.layout(this.getFormContext(this.getPersistedItem()), data, xDataForm);
    }

    private removeXDataStepForms(applicationKey: ApplicationKey): wemQ.Promise<void> {
        this.missingOrStoppedAppKeys = [];

        this.applicationLoadCount++;
        this.formMask.show();
        return new GetApplicationXDataRequest(this.persistedContent.getType(), applicationKey).sendAndParse().then(
            (xDatasToRemove: XData[]) => {
                this.formMask.show();
                this.handleMissingApp();
                this.removeXDataSteps(xDatasToRemove);
            }).finally(() => {
            if (--this.applicationLoadCount === 0) {
                this.formMask.hide();
            }
        });
    }

    private cleanFormOptionSetsRedundantData(data: api.data.PropertyTree): api.data.PropertyTree {
        const formOptionSets: FormOptionSet[] = this.getOptionSetsInForm(this.getContentType().getForm());

        formOptionSets.forEach((formOptionSet: FormOptionSet) => {
            const property: Property = data.getProperty(formOptionSet.getPath().toString());
            if (!!property) {
                const optionSetProperty: PropertySet = property.getPropertySet();
                const selectionArray: PropertyArray = optionSetProperty.getPropertyArray('_selected');
                if (!selectionArray) {
                    return;
                }
                formOptionSet.getOptions().forEach((option: api.form.FormOptionSetOption) => {
                    let isSelected: boolean = false;
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
                const data: api.data.PropertyTree = new api.data.PropertyTree(this.contentWizardStepForm.getData().getRoot()); // copy
                viewedContentBuilder.setData(this.cleanFormOptionSetsRedundantData(data));
            }
        }

        const extraData: ExtraData[] = [];

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            extraData.push(new ExtraData(new XDataName(form.getXDataNameAsString()), form.getData()));
        });

        viewedContentBuilder.setExtraData(extraData);

        this.settingsWizardStepForm.apply(viewedContentBuilder);
        this.scheduleWizardStepForm.apply(viewedContentBuilder);

        viewedContentBuilder.setPage(this.assembleViewedPage());

        this.securityWizardStepForm.apply(viewedContentBuilder);

        return viewedContentBuilder;
    }

    private displayValidationErrors(value: boolean) {
        this.contentWizardStepForm.displayValidationErrors(value);
        this.xDataWizardStepForms.displayValidationErrors(value);
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

    private notifyContentNamed(content: Content) {
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

    private initWritePermissions(loginResult: LoginResult) {
        const isWriteAllowed: boolean =
            this.getPersistedItem().isAnyPrincipalAllowed(loginResult.getPrincipals(), Permission.WRITE_PERMISSIONS);

        this.updateWritePermissions(isWriteAllowed);
    }

    private updateWritePermissions(value: boolean) {
        this.writePermissions = value;

        this.getEl().toggleClass('no-write-permissions', !this.writePermissions);
        if (this.getLivePanel()) {
            this.getLivePanel().updateWritePermissions(this.writePermissions);
        }
    }

    hasWritePermissions(): boolean {
        return this.writePermissions;
    }

    /**
     * Synchronizes wizard's extraData step forms with passed content -
     * erases steps forms (meta)data and populates it with content's (meta)data.
     * @param content
     */
    private updateXDataStepForms(content: Content, unchangedOnly: boolean = true) {
        this.getFormContext(content).updatePersistedContent(content);

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            const xDataName: XDataName = new XDataName(form.getXDataNameAsString());
            const extraData: ExtraData = content.getExtraData(xDataName);
            if (!extraData) {
                return;
            }

            form.getData().unChanged(this.dataChangedHandler);

            const data: PropertyTree = extraData.getData();
            data.onChanged(this.dataChangedHandler);

            form.resetState(data);

            if (form.isEnabled()) {
                form.update(data, unchangedOnly);
            } else {
                form.resetData();
            }

            this.syncPersistedItemWithXData(xDataName, data);
        });
    }

    private updateWizardStepForms(content: Content, unchangedOnly: boolean = true) {

        this.contentWizardStepForm.getData().unChanged(this.dataChangedHandler);

        content.getContentData().onChanged(this.dataChangedHandler);

        this.contentWizardStepForm.update(content.getContentData(), unchangedOnly).then(() => {
            setTimeout(this.contentWizardStepForm.validate.bind(this.contentWizardStepForm), 100);

            this.syncPersistedItemWithContentData(content.getContentData());
        });

        this.settingsWizardStepForm.update(content, unchangedOnly);
        this.scheduleWizardStepForm.update(content, unchangedOnly);
        this.securityWizardStepForm.update(content, unchangedOnly);
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

        if (this.contextSplitPanel.isMobileMode()) {
            this.getMainToolbar().getMobileItemStatisticsToggler().setActive(false);
        }

        this.getSplitPanel().showSecondPanel();
        const showInspectionPanel = ResponsiveRanges._1920_UP.isFitOrBigger(this.getEl().getWidthWithBorder());
        livePanel.clearPageViewSelectionAndOpenInspectPage(showInspectionPanel);
        this.showMinimizeEditButton();
    }

    private closeLiveEdit() {
        if (this.contextSplitPanel.isMobileMode()) {
            this.getMainToolbar().getMobileItemStatisticsToggler().setActive(false);
        }
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
            this.renderableChanged = this.renderable !== renderable;
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
            this.getComponentsViewToggler().setEnabled(this.renderable);
            this.getComponentsViewToggler().setVisible(this.renderable);
            this.contextSplitPanel.updateRenderableStatus(this.renderable);
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
        let showStep = false;

        if (this.getContent()) {
            const contentSummary = this.getContent().getContentSummary();

            if (contentSummary) {

                if (contentSummary.getPublishFromTime() != null || contentSummary.getPublishFromTime() != null) {
                    showStep = true;
                } else if (contentSummary.getPublishFirstTime() != null) {
                    showStep = this.getContent().isPublished();
                }
            }
        }

        this.scheduleWizardStep.show(showStep);
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

            this.getLivePanel().onPageViewReady(() => {
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

    private updateSecurityWizardStepIcon(content: Content) {
        const canEveryoneRead: boolean = this.canEveryoneRead(content);

        this.securityWizardStep.getTabBarItem().toggleClass('icon-unlock', canEveryoneRead);
        this.securityWizardStep.getTabBarItem().toggleClass('icon-lock', !canEveryoneRead);
    }

    private canEveryoneRead(content: Content): boolean {
        const entry: AccessControlEntry = content.getPermissions().getEntry(api.security.RoleKeys.EVERYONE);
        return !!entry && entry.isAllowed(Permission.READ);
    }
}
