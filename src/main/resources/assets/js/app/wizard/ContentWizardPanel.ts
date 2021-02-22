import * as Q from 'q';
import {showFeedback, showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DefaultModels} from './page/DefaultModels';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import {SettingsWizardStepForm} from './SettingsWizardStepForm';
import {ScheduleWizardStepForm} from './ScheduleWizardStepForm';
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
import {WorkflowStateIconsManager, WorkflowStateStatus} from './WorkflowStateIconsManager';
import {RoutineContext} from './Flow';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {FormView} from 'lib-admin-ui/form/FormView';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentName} from 'lib-admin-ui/content/ContentName';
import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {TogglerButton} from 'lib-admin-ui/ui/button/TogglerButton';
import {WizardHeaderWithDisplayNameAndNameBuilder} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {Application} from 'lib-admin-ui/application/Application';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ApplicationEvent} from 'lib-admin-ui/application/ApplicationEvent';
import {Toolbar} from 'lib-admin-ui/ui/toolbar/Toolbar';
import {CycleButton} from 'lib-admin-ui/ui/button/CycleButton';
import {FormOptionSet} from 'lib-admin-ui/form/set/optionset/FormOptionSet';
import {Property} from 'lib-admin-ui/data/Property';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {PropertySet} from 'lib-admin-ui/data/PropertySet';
import {FormItemSet} from 'lib-admin-ui/form/set/itemset/FormItemSet';
import {FieldSet} from 'lib-admin-ui/form/set/fieldset/FieldSet';
import {FormOptionSetOption} from 'lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {Form, FormBuilder} from 'lib-admin-ui/form/Form';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {RoleKeys} from 'lib-admin-ui/security/RoleKeys';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {WizardPanel} from 'lib-admin-ui/app/wizard/WizardPanel';
import {Action} from 'lib-admin-ui/ui/Action';
import {WizardHeader} from 'lib-admin-ui/app/wizard/WizardHeader';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {SplitPanel} from 'lib-admin-ui/ui/panel/SplitPanel';
import {ValidityChangedEvent} from 'lib-admin-ui/ValidityChangedEvent';
import {PropertyTreeComparator} from 'lib-admin-ui/data/PropertyTreeComparator';
import {GetApplicationRequest} from 'lib-admin-ui/application/GetApplicationRequest';
import {MaskContentWizardPanelEvent} from 'lib-admin-ui/app/wizard/MaskContentWizardPanelEvent';
import {UploadedEvent} from 'lib-admin-ui/ui/uploader/UploadedEvent';
import {Input} from 'lib-admin-ui/form/Input';
import {FormItemContainer} from 'lib-admin-ui/form/FormItemContainer';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {ArrayHelper} from 'lib-admin-ui/util/ArrayHelper';
import {LoadMask} from 'lib-admin-ui/ui/mask/LoadMask';
import {assert} from 'lib-admin-ui/util/Assert';
import {ContentIds} from '../ContentIds';
import {AfterContentSavedEvent} from '../event/AfterContentSavedEvent';
import {ProjectDeletedEvent} from '../settings/event/ProjectDeletedEvent';
import {ProjectContext} from '../project/ProjectContext';
import {ProjectHelper} from '../settings/data/project/ProjectHelper';
import {Element} from 'lib-admin-ui/dom/Element';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {OpenEditPermissionsDialogEvent} from '../event/OpenEditPermissionsDialogEvent';
import {UrlAction} from '../UrlAction';
import {ContentWizardHeader} from './ContentWizardHeader';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';
import {FormItem} from 'lib-admin-ui/form/FormItem';

export class ContentWizardPanel
    extends WizardPanel<Content> {

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

    private contentWizardStepForm: ContentWizardStepForm;

    private settingsWizardStepForm: SettingsWizardStepForm;

    private settingsWizardStep: ContentWizardStep;

    private scheduleWizardStepForm: ScheduleWizardStepForm;

    private scheduleWizardStep: ContentWizardStep;

    private xDataWizardStepForms: XDataWizardStepForms;

    private displayNameResolver: DisplayNameResolver;

    private editPermissionsToolbarButton: Element;

    private requireValid: boolean;

    private isContentFormValid: boolean;

    private isMarkedAsReady: boolean;

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

    private wizardFormUpdatedDuringSave: boolean;

    private pageEditorUpdatedDuringSave: boolean;

    private modifyPermissions: boolean = false;

    private applicationLoadCount: number;

    private debouncedEditorRefresh: (clearInspection: boolean) => void;

    private isFirstUpdateAndRenameEventSkiped: boolean;

    private workflowStateIconsManager: WorkflowStateIconsManager;

    public static debug: boolean = false;

    private loginResult: LoginResult;

    constructor(params: ContentWizardPanelParams, cls?: string) {
        super({
            tabId: params.tabId
        });

        if (cls) {
            this.addClass(cls);
        }

        this.contentParams = params;

        this.loadData();

        this.isContentFormValid = false;
        this.isMarkedAsReady = false;

        this.requireValid = false;
        this.skipValidation = false;
        this.contentNamedListeners = [];
        this.dataChangedListeners = [];
        this.contentUpdateDisabled = false;
        this.applicationLoadCount = 0;
        this.isFirstUpdateAndRenameEventSkiped = false;

        this.displayNameResolver = new DisplayNameResolver();

        this.xDataWizardStepForms = new XDataWizardStepForms();

        this.workflowStateIconsManager = new WorkflowStateIconsManager(this);

        this.initListeners();
        this.listenToContentEvents();
        this.handleSiteConfigApply();
        this.handleBrokenImageInTheWizard();
        this.initBindings();

        this.debouncedEditorRefresh = AppHelper.debounce((clearInspection: boolean = true) => {
            const livePanel = this.getLivePanel();

            livePanel.skipNextReloadConfirmation(true);
            livePanel.loadPage(clearInspection);
        }, 500);
    }

    private initBindings() {
        let nextActions = this.getActions();
        let currentKeyBindings = Action.getKeyBindings(nextActions);
        KeyBindings.get().bindKeys(currentKeyBindings);
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

    fetchContentXData(): Q.Promise<XData[]> {
        return new GetContentXDataRequest(this.getPersistedItem().getContentId()).sendAndParse();
    }

    protected doLoadData(): Q.Promise<Content> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.doLoadData at ' + new Date().toISOString());
        }
        return new ContentWizardDataLoader().loadData(this.contentParams)
            .then((loader: ContentWizardDataLoader) => {
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
                this.currentContent =
                    ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                        loader.content, loader.compareStatus, loader.publishStatus
                    );
                this.setPersistedContent(this.currentContent);

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
        return new ContentWizardToolbar({
            application: this.contentParams.application,
            actions: this.wizardActions,
            workflowStateIconsManager: this.workflowStateIconsManager
        });
    }

    public getMainToolbar(): ContentWizardToolbar {
        return <ContentWizardToolbar>super.getMainToolbar();
    }

    protected createWizardHeader(): WizardHeader {
        const header: ContentWizardHeader = new ContentWizardHeader(new WizardHeaderWithDisplayNameAndNameBuilder()
            .setDisplayNameGenerator(this.displayNameResolver)
            .setDisplayNameLabel(this.contentType ? this.contentType.getDisplayNameLabel() : null));

        header.setPersistedPath(this.isItemPersisted() ? this.getPersistedItem() : null);
        header.setPath(this.getWizardHeaderPath());

        const existing: Content = this.getPersistedItem();
        if (existing) {
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

    public getWizardHeader(): ContentWizardHeader {
        return <ContentWizardHeader>super.getWizardHeader();
    }

    public getLivePanel(): LiveFormPanel {
        return <LiveFormPanel>super.getLivePanel();
    }

    protected createWizardAndDetailsSplitPanel(leftPanel: Panel): SplitPanel {
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

    protected createLivePanel(): Panel {
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

            this.appendChild(this.getContentWizardToolbarPublishControls().getMobilePublishControls());

            if (this.getLivePanel()) {
                this.getLivePanel().setModifyPermissions(this.modifyPermissions);
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

            const thumbnailUploader: ThumbnailUploaderEl = this.getFormIcon();

            this.onValidityChanged((event: ValidityChangedEvent) => {
                if (!this.persistedContent) {
                    return;
                }

                const isThisValid: boolean = this.isValid();
                this.isContentFormValid = isThisValid;
                this.workflowStateIconsManager.updateIcons();
                this.wizardActions
                    .setContentCanBePublished(this.checkContentCanBePublished())
                    .setIsValid(isThisValid)
                    .refreshState();
                if (!this.isNew()) {
                    this.displayValidationErrors(!(isThisValid && event.isValid()));
                }
            });

            if (thumbnailUploader) {
                thumbnailUploader.setEnabled(!this.contentType.isImage());
                thumbnailUploader.onFileUploaded(this.onFileUploaded.bind(this));
            }

            this.contextSplitPanel.onRendered(() => this.contextSplitPanel.setContent(this.persistedContent));

            this.workflowStateIconsManager.onStatusChanged((status: WorkflowStateStatus) => {
                this.wizardActions.setContentCanBeMarkedAsReady(status.inProgress).refreshState();
            });

            this.getContentWizardToolbarPublishControls().getPublishButton().onPublishRequestActionChanged((added: boolean) => {
                this.wizardActions.setHasPublishRequest(added);
                this.wizardActions.refreshState();
            });

            this.editPermissionsToolbarButton = new DivEl('edit-permissions-button');
            this.editPermissionsToolbarButton.getEl().setTitle(i18n('field.access'));
            this.editPermissionsToolbarButton.addClass(this.canEveryoneRead(this.getPersistedItem()) ? 'icon-unlock' : 'icon-lock');
            this.editPermissionsToolbarButton.onClicked(this.handleEditPermissionsButtonClicked.bind(this));
            this.getStepNavigatorContainer().appendChild(this.editPermissionsToolbarButton);

            return rendered;
        });
    }

    private handleEditPermissionsButtonClicked() {
        const content: Content = this.getPersistedItem();
        OpenEditPermissionsDialogEvent.create()
            .setContentId(content.getContentId())
            .setContentPath(content.getPath())
            .setDisplayName(content.getDisplayName())
            .setPermissions(content.getPermissions())
            .setInheritPermissions(content.isInheritPermissionsEnabled())
            .setOverwritePermissions(false)
            .build()
            .fire();
    }

    isNew(): boolean {
        return this.formState.isNew();
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

    saveChanges(): Q.Promise<Content> {
        let liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {
            liveFormPanel.skipNextReloadConfirmation(true);
        }
        this.setRequireValid(false);
        this.contentUpdateDisabled = true;
        this.isFirstUpdateAndRenameEventSkiped = false;
        new BeforeContentSavedEvent().fire();
        return super.saveChanges().then((content: Content) => {
            const persistedItem = content.clone();
            if (liveFormPanel) {
                this.liveEditModel.setContent(persistedItem);
                if (this.pageEditorUpdatedDuringSave) {
                    if (this.reloadPageEditorOnSave) {
                        this.updateLiveForm(persistedItem);
                    }
                    this.updateXDataStepForms(persistedItem);
                }
            }

            if (this.wizardFormUpdatedDuringSave) {
                if (persistedItem.getType().isImage()) {
                    this.updateWizard(persistedItem);
                } else {
                    this.updateWizardStepForms(persistedItem, false);

                    if (persistedItem.isSite()) {
                        this.updateSiteModel(<Site>persistedItem);
                    }
                }
                this.xDataWizardStepForms.resetDisabledForms();
            } else if (persistedItem.isSite() && !this.isNew()) {
                this.updateWizardStepForms(persistedItem, false);
            }

            return persistedItem;
        }).finally(() => {
            this.isMarkedAsReady = false;
            this.contentUpdateDisabled = false;
            this.updateButtonsState();

            new AfterContentSavedEvent().fire();
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

        if (!this.modifyPermissions) {
            return;
        }

        if (this.contentType.hasDisplayNameExpression()) {
            if (!this.contentWizardStepForm.giveFocus()) {
                this.getWizardHeader().giveFocus();
            }
        } else {
            this.getWizardHeader().giveFocus();
        }

        this.startRememberFocus();
    }

    doLayout(persistedContent: Content): Q.Promise<void> {

        return super.doLayout(persistedContent).then(() => {

            const persistedContentCopy = persistedContent.clone();

            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doLayout at ' + new Date().toISOString(), persistedContent);
            }

            this.updateThumbnailWithContent(persistedContent);

            this.getWizardHeader().setSimplifiedNameGeneration(persistedContent.getType().isDescendantOfMedia());

            if (this.isRendered()) {

                const viewedContent = this.assembleViewedContent(persistedContent.newBuilder()).build();
                if (viewedContent.equals(persistedContent) || this.skipValidation) {

                    // force update wizard with server bounced values to erase incorrect ones
                    this.updateWizard(persistedContentCopy, false);

                    const liveFormPanel = this.getLivePanel();
                    if (liveFormPanel) {
                        liveFormPanel.loadPage();
                    }
                } else {
                    console.warn(`Received Content from server differs from what's viewed:`);
                    if (!viewedContent.getContentData().equals(persistedContent.getContentData())) {
                        console.warn(' inequality found in Content.data');
                        if (persistedContent.getContentData() && viewedContent.getContentData()) {
                            console.warn(' comparing persistedContent.data against viewedContent.data:');
                            new PropertyTreeComparator().compareTree(persistedContent.getContentData(),
                                viewedContent.getContentData());
                        }
                    }
                    if (!ObjectHelper.equals(viewedContent.getPage(), persistedContent.getPage())) {
                        console.warn(' inequality found in Content.page');
                        if (persistedContent.getPage() && viewedContent.getPage()) {
                            console.warn(' comparing persistedContent.page.config against viewedContent.page.config:');
                            new PropertyTreeComparator().compareTree(persistedContent.getPage().getConfig(),
                                viewedContent.getPage().getConfig());
                        }
                    }
                    if (!ObjectHelper.arrayEquals(viewedContent.getAllExtraData(), persistedContent.getAllExtraData())) {
                        console.warn(' inequality found in Content.meta');
                    }
                    if (!ObjectHelper.equals(viewedContent.getAttachments(), persistedContent.getAttachments())) {
                        console.warn(' inequality found in Content.attachments');
                    }
                    if (!ObjectHelper.equals(viewedContent.getPermissions(), persistedContent.getPermissions())) {
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
                            .setNoCallback(() => {/* empty */
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

    private fetchApplication(key: ApplicationKey): Q.Promise<Application> {
        let deferred = Q.defer<Application>();
        new GetApplicationRequest(key).sendAndParse().then((app) => {
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
        if (this.wizardActions.isPendingDelete()) {
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

    private isCurrentContentId(id: ContentId): boolean {
        return this.getPersistedItem() && id && this.getPersistedItem().getContentId().equals(id);
    }

    private persistedItemPathIsDescendantOrEqual(path: ContentPath): boolean {
        return this.getPersistedItem().getPath().isDescendantOf(path) || this.getPersistedItem().getPath().equals(path);
    }

    private formContext: ContentFormContext;

    private initListeners() {

        let shownAndLoadedHandler = () => {
            if (!this.getPersistedItem()) {
                Router.get().setHash(`${UrlAction.NEW}/${this.contentType.getName()}`);
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
                    showWarning(message);
                } else {
                    let shownHandler = () => {
                        new GetApplicationRequest(event.getApplicationKey()).sendAndParse()
                            .then(
                                (application: Application) => {
                                    if (application.getState() === 'stopped') {
                                        showWarning(message);
                                    }
                                })
                            .catch((reason: any) => { //app was uninstalled
                                showWarning(message);
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

        MaskContentWizardPanelEvent.on(event => {
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

    private isLocalizeInUrl(): boolean {
        return Router.getPath().getElements().some((pathEl: string) => pathEl === UrlAction.LOCALIZE);
    }

    private onFileUploaded(event: UploadedEvent<Content>) {
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

    private updateContent(compareStatus: CompareStatus): Q.Promise<void> {
        const newContent = this.currentContent.clone();
        newContent.setCompareStatus(compareStatus);

        this.currentContent = newContent;
        this.setPersistedContent(newContent);
        this.getMainToolbar().setItem(newContent);
        this.wizardActions.setContent(newContent).refreshState();
        this.workflowStateIconsManager.updateIcons();

        return this.wizardActions.refreshPendingDeleteDecorations();
    }

    private isOutboundDependencyUpdated(content: ContentSummaryAndCompareStatus): Q.Promise<boolean> {
        return ContentHelper.isReferencedBy(content.getContentSummary(), this.persistedContent.getContentId());
    }

    private isUpdateOfPageModelRequired(content: ContentSummaryAndCompareStatus): Q.Promise<boolean> {
        // 3. outbound dependency content has changed
        return this.isOutboundDependencyUpdated(content).then(outboundDependencyUpdated => {
            const viewedPage = this.assembleViewedPage();
            const pageChanged = !ObjectHelper.equals(this.getPersistedItem().getPage(), viewedPage);

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

        return steps;
    }

    private fetchPersistedContent(): Q.Promise<Content> {
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
                    this.wizardActions.setContentCanBePublished(true);
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
                this.updatePublishStatusOnDataChange();

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
                    this.currentContent = content;
                    this.setPersistedContent(content);
                    this.getMainToolbar().setItem(content);
                    this.wizardActions.setContent(content).refreshState();
                    this.workflowStateIconsManager.updateIcons();
                    this.refreshScheduleWizardStep();

                    this.getWizardHeader().toggleNameGeneration(content.getCompareStatus() !== CompareStatus.EQUAL);
                }
            });

            this.wizardActions.refreshState();
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
                    DefaultErrorHandler.handle).done();
            }
        };

        const updatePermissionsHandler = (updatedContent: ContentSummaryAndCompareStatus) => {
            const isAlreadyUpdated: boolean = updatedContent.equals(this.getPersistedItem());

            if (isAlreadyUpdated) {
                return;
            }

            this.setUpdatedContent(updatedContent);

            this.fetchPersistedContent().then((content) => {
                this.setPersistedItem(content.clone());
                this.updateEditPermissionsButtonIcon(content);
                new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
                    const userCanPublish: boolean = this.isContentPublishableByUser(loginResult);
                    const userCanModify: boolean = this.isContentModifiableByUser(loginResult);
                    this.wizardActions
                        .setUserCanPublish(userCanPublish)
                        .setUserCanModify(userCanModify)
                        .refreshState();
                    this.toggleStepFormsVisibility(loginResult);
                }).catch(DefaultErrorHandler.handle);
            });
        };

        const sortedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            let indexOfCurrentContent = null;
            const wasSorted = data.some((sorted: ContentSummaryAndCompareStatus, index: number) => {
                indexOfCurrentContent = index;
                return this.isCurrentContentId(sorted.getContentId());
            });
            if (wasSorted && indexOfCurrentContent != null) {
                this.wizardActions.setContent(data[indexOfCurrentContent]).refreshState();
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
            if (this.contentUpdateDisabled && !this.isFirstUpdateAndRenameEventSkiped) {
                data.some(content => {
                    const isCurrentContent = this.isCurrentContentId(content.getContentId());
                    if (isCurrentContent) {
                        this.isFirstUpdateAndRenameEventSkiped = this.isContentUpdatedAndRenamed(content);
                        return this.isFirstUpdateAndRenameEventSkiped;
                    }
                    return false;
                });
            } else if (!this.contentUpdateDisabled) {
                data.forEach((updated: ContentSummaryAndCompareStatus) => {
                    updateHandler(updated);
                });
            }
        };

        const contentPermissionsUpdatedHandler = (contentIds: ContentIds) => {
            if (this.contentUpdateDisabled || !this.getPersistedItem()) {
                return;
            }

            const thisContentId: ContentId = this.getPersistedItem().getContentId();
            const isThisContentUpdated: boolean = contentIds.contains(thisContentId);

            if (!isThisContentUpdated) {
                return;
            }

            ContentSummaryAndCompareStatusFetcher.fetch(thisContentId)
                .then(updatePermissionsHandler)
                .catch(DefaultErrorHandler.handle);
        };

        const contentRenamedHandler = (contents: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            contents.forEach((renamedContent: ContentSummaryAndCompareStatus, index: number) => {
                if (this.isCurrentContentId(renamedContent.getContentId())) {
                    const isWizardAlreadyUpdated = renamedContent.getContentSummary().getPath().equals(this.getPersistedItem().getPath());

                    if (isWizardAlreadyUpdated) {
                        return;
                    }

                    this.handlePersistedContentUpdate(renamedContent);
                } else if (this.getPersistedItem().getPath().isDescendantOf(oldPaths[index])) {
                    ContentSummaryAndCompareStatusFetcher.fetchByContent(this.getPersistedItem()).then((summaryAndStatus) => {
                        this.handlePersistedContentUpdate(summaryAndStatus);
                    });
                }
            });
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
        serverEvents.onContentRenamed(contentRenamedHandler);

        this.onClosed(() => {
            ActiveContentVersionSetEvent.un(versionChangeHandler);
            ContentDeletedEvent.un(deleteHandler);

            serverEvents.unContentMoved(movedHandler);
            serverEvents.unContentSorted(sortedHandler);
            serverEvents.unContentUpdated(contentUpdatedHandler);
            serverEvents.unContentPermissionsUpdated(contentPermissionsUpdatedHandler);
            serverEvents.unContentPublished(publishOrUnpublishHandler);
            serverEvents.unContentUnpublished(publishOrUnpublishHandler);
            serverEvents.unContentRenamed(contentRenamedHandler);
        });

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            if (event.getProjectName() === ProjectContext.get().getProject().getName()) {
                this.contentDeleted = true;
                this.close();
            }
        });
    }

    private setUpdatedContent(updatedContent: ContentSummaryAndCompareStatus) {
        const isUpdatedAndRenamed = this.isContentUpdatedAndRenamed(updatedContent);
        this.currentContent = updatedContent;
        this.setPersistedContent(updatedContent);
        this.getMainToolbar().setItem(updatedContent);
        this.wizardActions.setContent(updatedContent).refreshState();
        if (!isUpdatedAndRenamed || this.isFirstUpdateAndRenameEventSkiped) {
            this.isFirstUpdateAndRenameEventSkiped = false;
            this.workflowStateIconsManager.updateIcons();
        }
        this.contextSplitPanel.setContent(updatedContent);
    }

    private isContentUpdatedAndRenamed(updatedContent: ContentSummaryAndCompareStatus): boolean {
        // When the content without displayName and name is saved with new
        // names and became valid, the server will generate 2 sequential
        // `NodeServerChangeType.UPDATE` events.
        const noContent = updatedContent == null ||
                          this.currentContent == null ||
                          updatedContent.getContentSummary() == null ||
                          this.currentContent.getContentSummary() == null;

        if (noContent) {
            return false;
        }

        const oldItem = this.currentContent.getContentSummary();
        const wasUnnamed = !oldItem.getDisplayName() && (oldItem.getName() != null && oldItem.getName().isUnnamed());

        const newContent = updatedContent.getContentSummary();
        const hasName = !!newContent.getDisplayName() && (newContent.getName() != null && !newContent.getName().isUnnamed());

        return wasUnnamed && hasName;
    }

    private handlePersistedContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        this.setUpdatedContent(updatedContent);

        if (this.currentContent.getCompareStatus() != null) {
            this.refreshScheduleWizardStep();
        }

        this.fetchPersistedContent().then(this.updatePersistedItemIfNeeded.bind(this)).catch(DefaultErrorHandler.handle).done();
    }

    private updatePersistedItemIfNeeded(content: Content) {
        let isEqualToForm;
        let imageHasChanged;

        const current = this.assembleViewedContent(new ContentBuilder(this.getPersistedItem()), true).build();

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
        const containsIdPromise: Q.Promise<boolean> = this.createComponentsContainIdPromise(contentId);
        const templateUpdatedPromise: Q.Promise<boolean> = this.createTemplateUpdatedPromise(updatedContent);

        this.wizardActions.refreshState();

        Q.all([containsIdPromise, templateUpdatedPromise]).spread((containsId, templateUpdated) => {
            if (containsId || templateUpdated) {
                this.debouncedEditorRefresh(false);
            }
        }).catch(DefaultErrorHandler.handle).done();
    }

    private loadDefaultModelsAndUpdatePageModel(reloadPage: boolean = true) {
        const item = this.getPersistedItem();
        const site = item.isSite() ? <Site>item : this.site;

        return new ContentWizardDataLoader().loadDefaultModels(site, this.contentType.getContentTypeName()).then(
            defaultModels => {
                this.defaultModels = defaultModels;
                return !this.liveEditModel ?
                       Q(false) :
                       this.initPageModel(this.liveEditModel, defaultModels).then(() => {
                           const livePanel = this.getLivePanel();
                           // pageModel is updated so we need reload unless we're saving already
                           const needsReload = !this.isSaving();
                           if (livePanel) {
                               livePanel.setModel(this.liveEditModel);
                               if (reloadPage) {
                                   livePanel.clearSelectionAndInspect(true, true);
                               }
                               if (needsReload && reloadPage) {
                                   this.debouncedEditorRefresh(true);
                               }
                           }
                           return needsReload;
                       });
            });
    }

    private createComponentsContainIdPromise(contentId: ContentId): Q.Promise<boolean> {
        return this.doComponentsContainId(contentId).then((contains) => {
            if (contains) {
                return this.fetchPersistedContent().then((content: Content) => {
                    this.updateWizard(content, true);
                    return this.isEditorEnabled();
                });
            } else {
                return Q(false);
            }
        });
    }

    private createTemplateUpdatedPromise(updatedContent: ContentSummaryAndCompareStatus): Q.Promise<boolean> {
        if (this.isNearestSiteChanged(updatedContent)) {
            this.updateButtonsState();
            return this.loadDefaultModelsAndUpdatePageModel(false);
        }

        return this.isUpdateOfPageModelRequired(updatedContent).then(value => {
            if (value) {
                return this.loadDefaultModelsAndUpdatePageModel(false);
            }

            return Q(false);
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

    private doComponentsContainId(contentId: ContentId): Q.Promise<boolean> {
        const page = this.getPersistedItem().getPage();

        if (page) {
            if (this.doHtmlAreasContainId(contentId.toString())) {
                return Q(true);
            }

            return ContentHelper.containsChildContentId(this.getPersistedItem(), contentId);
        }

        return Q(false);
    }

    private doHtmlAreasContainId(id: string): boolean {
        let areas = this.getHtmlAreasInForm(this.getContentType().getForm());
        let data: PropertyTree = this.getPersistedItem().getContentData();

        return areas.some((area) => {
            let property = data.getProperty(area);
            if (property && property.hasNonNullValue() && property.getType().equals(ValueTypes.STRING)) {
                return property.getString().indexOf(id) >= 0;
            }
        });
    }

    private getHtmlAreasInForm(formItemContainer: FormItemContainer): string[] {
        let result: string[] = [];

        formItemContainer.getFormItems().forEach((item) => {
            if (ObjectHelper.iFrameSafeInstanceOf(item, FormItemSet) ||
                ObjectHelper.iFrameSafeInstanceOf(item, FieldSet) ||
                ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSet) ||
                ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSetOption)) {
                result = result.concat(this.getHtmlAreasInForm(<any>item));
            } else if (ObjectHelper.iFrameSafeInstanceOf(item, Input)) {
                let input = <Input>item;
                if (input.getInputType().getName() === 'HtmlArea') {
                    result.push(input.getPath().toString());
                }
            }
        });

        return result;
    }

    private updateLiveForm(content: Content): Q.Promise<any> {
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
                liveFormPanel.setModel(this.liveEditModel);
                liveFormPanel.clearSelectionAndInspect(showPanel, false);

                this.debouncedEditorRefresh(false);

                return Q(null);
            });
        }
        if (!this.siteModel && content.isSite()) {
            this.siteModel = this.createSiteModel(<Site>content);
            this.initSiteModelListeners();
        }
    }

    private updatePersistedContent(persistedContent: Content) {
        return ContentSummaryAndCompareStatusFetcher.fetchByContent(persistedContent).then((summaryAndStatus) => {
            this.currentContent = summaryAndStatus;
            this.setPersistedContent(summaryAndStatus);
            this.getMainToolbar().setItem(summaryAndStatus);
            this.wizardActions.setContent(summaryAndStatus).refreshState();
            this.getWizardHeader().toggleNameGeneration(this.currentContent.getCompareStatus() === CompareStatus.NEW);
            this.workflowStateIconsManager.updateIcons();
            new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
                const userCanPublish: boolean = this.isContentPublishableByUser(loginResult);
                const userCanModify: boolean = this.isContentModifiableByUser(loginResult);
                this.wizardActions
                    .setUserCanPublish(userCanPublish)
                    .setUserCanModify(userCanModify)
                    .refreshState();
            });
        });
    }

    private isContentPublishableByUser(loginResult: LoginResult): boolean {
        return PermissionHelper.hasPermission(Permission.PUBLISH, loginResult, this.getPersistedItem().getPermissions());
    }

    private isContentModifiableByUser(loginResult: LoginResult): boolean {
        return PermissionHelper.hasPermission(Permission.MODIFY, loginResult, this.getPersistedItem().getPermissions());
    }

    saveChangesWithoutValidation(reloadPageEditor?: boolean): Q.Promise<Content> {
        this.skipValidation = true;
        this.reloadPageEditorOnSave = reloadPageEditor;

        return this.saveChanges().then((content: Content) => {
            this.skipValidation = false;
            this.reloadPageEditorOnSave = true;
            return content;
        });
    }

    private updateThumbnailWithContent(content: Content) {
        const thumbnailUploader: ThumbnailUploaderEl = this.getFormIcon();
        thumbnailUploader.toggleClass('has-origin-project', !!content.getOriginProject());
        const id = content.getContentId().toString();

        thumbnailUploader
            .setParams({id})
            .setEnabled(!content.isImage())
            .setValue(new ContentIconUrlResolver().setContent(content).resolve());
        this.workflowStateIconsManager.updateIcons();
    }

    private initLiveEditor(formContext: ContentFormContext, content: Content): Q.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.initLiveEditor at ' + new Date().toISOString());
        }
        let deferred = Q.defer<void>();
        let liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {

            if (!this.liveEditModel) {
                let site = content.isSite() ? <Site>content : this.site;

                this.unbindSiteModelListeners();
                this.siteModel = this.siteModel ? this.updateSiteModel(site) : this.createSiteModel(site);
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

    // sync persisted content extra data with xData
    // when rendering form - we may add extra fields from xData;
    // as this is intended action from XP, not user - it should be present in persisted content
    private syncPersistedItemWithXData(xDataName: XDataName, xDataPropertyTree: PropertyTree) {
        let persistedContent = this.getPersistedItem();
        let extraData = persistedContent.getExtraDataByName(xDataName);
        if (!extraData) { // ensure ExtraData object corresponds to each step form
            this.enrichWithExtraData(persistedContent, xDataName, xDataPropertyTree);
        } else {
            let diff = extraData.getData().diff(xDataPropertyTree);
            diff.added.forEach((property: Property) => {
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

        const treeCopy: PropertyTree = this.cleanFormOptionSetsRedundantData(propertyTree.copy());

        persistedContentData.getRoot().syncEmptyArrays(treeCopy.getRoot());

        const diff = persistedContentData.diff(treeCopy);
        diff.added.forEach((property: Property) => {
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
    private doLayoutPersistedItem(content: Content): Q.Promise<void> {
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
                            this.setModifyPermissions(loginResult);
                            this.toggleStepFormsVisibility(loginResult);
                            this.updateUrlAction();

                            if (this.isLocalizeInUrl()) {
                                this.settingsWizardStepForm.updateInitialLanguage();
                            }

                            if (!this.modifyPermissions) {
                                NotifyManager.get().showFeedback(i18n('notify.item.readonly'));
                            }
                        });

                        this.syncPersistedItemWithContentData(content.getContentData());
                        this.xDataWizardStepForms.resetState();

                        this.contentWizardStepForm.getFormView().addClass('panel-may-display-validation-errors');
                        this.contentWizardStepForm.validate();

                        if (this.isNew()) {
                            this.contentWizardStepForm.getFormView().highlightInputsOnValidityChange(true);
                        } else {
                            this.displayValidationErrors(!this.isValid());
                        }

                        this.enableDisplayNameScriptExecution(this.contentWizardStepForm.getFormView());

                        if (!this.siteModel && content.isSite()) {
                            this.siteModel = this.createSiteModel(<Site>content);
                            this.initSiteModelListeners();
                        }

                        this.wizardActions.initUnsavedChangesListeners();

                        this.onLiveModelChanged(() => {
                            setTimeout(this.updatePublishStatusOnDataChange.bind(this), 100);
                        });

                        return Q(null);
                    });
                });
            });
        });
    }

    private createWizardStepForms(): Q.Promise<void> {
        this.contentWizardStepForm = new ContentWizardStepForm();
        this.settingsWizardStepForm = new SettingsWizardStepForm();
        this.scheduleWizardStepForm = new ScheduleWizardStepForm();

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

    private fetchMissingOrStoppedAppKeys(): Q.Promise<void> {
        this.missingOrStoppedAppKeys = [];

        const applicationKeys = this.site ? this.site.getApplicationKeys() : [];
        const applicationPromises = applicationKeys.map((key: ApplicationKey) => this.fetchApplication(key));

        return Q.all(applicationPromises).thenResolve(null);
    }

    private layoutWizardStepForms(content: Content): Q.Promise<void> {
        const contentData = content.getContentData();
        contentData.onChanged(this.dataChangedHandler);

        const formViewLayoutPromises: Q.Promise<void>[] = [];
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

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            const promise: Q.Promise<void> = this.layoutXDataWizardStepForm(content, form);

            form.getData().onChanged(this.dataChangedHandler);

            formViewLayoutPromises.push(promise);
        });

        return Q.all(formViewLayoutPromises).thenResolve(null);
    }

    private toggleElementsVisibility(visible: boolean) {
        this.settingsWizardStepForm.setVisible(visible);
        this.settingsWizardStepForm.getPreviousElement().setVisible(visible);
        this.settingsWizardStep.getTabBarItem().setVisible(visible);
        this.editPermissionsToolbarButton.setVisible(visible);
    }

    private toggleStepFormsVisibility(loginResult: LoginResult) {
        const hasAdminPermissions: boolean = this.hasAdminPermissions(loginResult);

        if (hasAdminPermissions) {
            this.toggleElementsVisibility(true);
        } else {
            ProjectHelper.isUserProjectOwner(loginResult).then((isOwner: boolean) => this.toggleElementsVisibility(isOwner));
        }
    }

    private hasAdminPermissions(loginResult: LoginResult): boolean {
        if (loginResult.getPrincipals().some(principalKey => RoleKeys.isAdmin(principalKey))) {
            return true;
        }

        if (loginResult.isContentAdmin() || loginResult.isContentExpert()) {
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

        const handler = AppHelper.debounce(() => {
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
            if (this.wizardFormUpdatedDuringSave) {
                this.formMask.show();
                handler();
            }
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

    private addXDataSteps(xDatas: XData[]): Q.Promise<void> {
        const content: Content = this.getPersistedItem().clone();
        const formViewLayoutPromises: Q.Promise<void>[] = [];

        const formsAdded: XDataWizardStepForm[] = this.createXDataWizardStepForms(xDatas);
        formsAdded.forEach((form: XDataWizardStepForm) => {
            this.insertStepBefore(new XDataWizardStep(form), this.settingsWizardStep);
            form.resetHeaderState();
            const promise: Q.Promise<void> = this.layoutXDataWizardStepForm(content, form);
            form.getData().onChanged(this.dataChangedHandler);

            formViewLayoutPromises.push(promise);
        });

        return Q.all(formViewLayoutPromises).thenResolve(null);
    }

    private layoutXDataWizardStepForm(content: Content, xDataStepForm: XDataWizardStepForm): Q.Promise<void> {
        const extraData = content.getExtraDataByName(xDataStepForm.getXData().getXDataName());
        const data: PropertyTree = extraData ? extraData.getData() : new PropertyTree();

        const xDataForm: Form = new FormBuilder().addFormItems(xDataStepForm.getXData().getFormItems()).build();

        return xDataStepForm.layout(this.getFormContext(content), data, xDataForm).then(() => {
            this.syncPersistedItemWithXData(xDataStepForm.getXDataName(), data);
            return Q(null);
        });
    }

    private initLiveEditModel(content: Content, siteModel: SiteModel, formContext: ContentFormContext): Q.Promise<LiveEditModel> {
        const liveEditModel = LiveEditModel.create()
            .setParentContent(this.parentContent)
            .setContent(content)
            .setContentFormContext(formContext)
            .setSiteModel(siteModel)
            .build();

        return this.initPageModel(liveEditModel, this.defaultModels).then(() => liveEditModel);
    }

    private initPageModel(liveEditModel: LiveEditModel, defaultModels: DefaultModels): Q.Promise<PageModel> {
        return liveEditModel.init(defaultModels.getPageTemplate(), defaultModels.getPageDescriptor());
    }

    persistNewItem(): Q.Promise<Content> {
        return new PersistNewContentRoutine(this).setCreateContentRequestProducer(this.produceCreateContentRequest).execute().then(
            (context: RoutineContext) => {
                showFeedback(i18n('notify.content.created'));
                return context.content;
            });
    }

    postPersistNewItem(persistedContent: Content): Q.Promise<Content> {

        /*        if (persistedContent.isSite()) {
                    this.site = <Site>persistedContent;
                }*/

        return Q(persistedContent);
    }

    private produceCreateContentRequest(): Q.Promise<CreateContentRequest> {
        let deferred = Q.defer<CreateContentRequest>();

        let parentPath = this.parentContent != null ? this.parentContent.getPath() : ContentPath.ROOT;

        if (this.contentType.getContentTypeName().isMedia()) {
            deferred.resolve(null);
        } else {
            deferred.resolve(
                new CreateContentRequest()
                    .setRequireValid(this.requireValid)
                    .setName(ContentUnnamed.newUnnamed())
                    .setParent(parentPath)
                    .setContentType(this.contentType.getContentTypeName())
                    .setDisplayName('')     // new content is created on wizard open so display name is always empty
                    .setData(new PropertyTree())
                    .setExtraData([])
                    .setWorkflow(Workflow.create().setState(WorkflowState.IN_PROGRESS).build()));
        }

        return deferred.promise;
    }

    private getOptionSetsInForm(formItemContainer: FormItemContainer): FormOptionSet[] {
        let result: FormOptionSet[] = [];

        formItemContainer.getFormItems().forEach((item) => {
            if (ObjectHelper.iFrameSafeInstanceOf(item, FormItemSet) ||
                ObjectHelper.iFrameSafeInstanceOf(item, FieldSet) ||
                ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSetOption)) {
                result = result.concat(this.getOptionSetsInForm(<any>item));
            } else if (ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSet)) {
                result.push(<FormOptionSet>item);
                result = result.concat(this.getOptionSetsInForm(<any>item));
            }
        });

        return result;
    }

    updatePersistedItem(): Q.Promise<Content> {
        const persistedContent: Content = this.getPersistedItem();
        const viewedContent: Content = this.assembleViewedContent(persistedContent.newBuilder(), true).build();
        const isInherited: boolean = persistedContent.isDataInherited();

        const updateContentRoutine: UpdatePersistedContentRoutine = new UpdatePersistedContentRoutine(this, persistedContent, viewedContent)
            .setRequireValid(this.requireValid)
            .setWorkflowState(this.isMarkedAsReady ? WorkflowState.READY : WorkflowState.IN_PROGRESS);

        return updateContentRoutine.execute().then((context: RoutineContext) => {
            const content = context.content;
            this.wizardFormUpdatedDuringSave = context.dataUpdated;
            this.pageEditorUpdatedDuringSave = context.pageUpdated;

            if (persistedContent.getName().isUnnamed() && !content.getName().isUnnamed()) {
                this.notifyContentNamed(content);
            }

            if (context.dataUpdated || context.pageUpdated) {
                this.showFeedbackContentSaved(content, isInherited);
            }

            if (isInherited && this.isLocalizeInUrl()) {
                Router.get().setHash(`${UrlAction.EDIT}/${this.getPersistedItem().getId()}`);
            }

            this.getWizardHeader().resetBaseValues();

            return content;
        }).then((content: Content) => {
            this.contentWizardStepForm.validate();
            this.displayValidationErrors(!this.isValid());

            return content;
        });
    }

    private showFeedbackContentSaved(content: Content, wasInherited: boolean = false) {
        const name = content.getName();
        let message;
        if (wasInherited) {
            message = i18n('notify.content.localized');
        } else if (name.isUnnamed()) {
            message = i18n('notify.item.savedUnnamed');
        } else if (this.isMarkedAsReady) {
            message = i18n('notify.item.markedAsReady', name);
        } else {
            message = i18n('notify.item.saved', name);
        }
        showFeedback(message);
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

    private addXDataStepForms(applicationKey: ApplicationKey): Q.Promise<void> {

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

                    const promise: Q.Promise<void> = this.layoutXDataWizardStepFormOfPersistedItem(form);

                    form.getData().onChanged(this.dataChangedHandler);

                    layoutPromises.push(promise);
                });

                return Q.all(layoutPromises).then(() => {
                    this.xDataWizardStepForms.resetState();
                });

            }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).finally(() => {
            if (--this.applicationLoadCount === 0) {
                this.formMask.hide();
            }
        });
    }

    private layoutXDataWizardStepFormOfPersistedItem(xDataStepForm: XDataWizardStepForm): Q.Promise<void> {
        const data: PropertyTree = new PropertyTree();

        const xDataForm: Form = new FormBuilder().addFormItems(xDataStepForm.getXData().getFormItems()).build();

        return xDataStepForm.layout(this.getFormContext(this.getPersistedItem()), data, xDataForm);
    }

    private removeXDataStepForms(applicationKey: ApplicationKey): Q.Promise<void> {
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

    private cleanFormOptionSetsRedundantData(data: PropertyTree): PropertyTree {
        const formOptionSets: FormOptionSet[] = this.getOptionSetsInForm(this.getContentType().getForm());

        formOptionSets.forEach((formOptionSet: FormOptionSet) => {
            const parentPropertySet = formOptionSet.getPath().elementCount() > 1 ?
                                      data.getPropertySet(formOptionSet.getPath().getParentPath()) :
                                      data;

            const optionSetOccurrences = parentPropertySet.getPropertyArray(formOptionSet.getName());
            if (!optionSetOccurrences) {
                return;
            }

            optionSetOccurrences.forEach((optionSetOccurrence: Property) => {
                this.cleanOptionSetOccurrence(formOptionSet, optionSetOccurrence);
            });
        });

        return data;
    }

    private cleanOptionSetOccurrence(formOptionSet: FormOptionSet, optionSetOccurrence: Property) {
        const optionSetPropertySet: PropertySet = optionSetOccurrence.getPropertySet();
        const selectionArray: PropertyArray = optionSetPropertySet.getPropertyArray('_selected');
        if (!selectionArray || selectionArray.isEmpty()) {
            optionSetPropertySet.removeAllProperties();
            return;
        }

        this.cleanOptionSetProperties(formOptionSet, optionSetPropertySet);
    }

    private getOptionFormItems(formOptionSet: FormOptionSet, optionName: string): FormItem[] {

        const formOption: FormOptionSetOption = formOptionSet.getOptions()
            .find(option => option.getName() === optionName);

        if (!formOption) {
            return [];
        }

        return formOption.getFormItems();
    }

    private cleanOptionSetProperties(formOptionSet: FormOptionSet, optionSetPropertySet: PropertySet) {
        optionSetPropertySet.getPropertyArrays().forEach((optionPropertySet: PropertyArray) => {
            const optionArrayName = optionPropertySet.getName();
            if (optionArrayName === '_selected') {
                return;
            }

            const formItems = this.getOptionFormItems(formOptionSet, optionArrayName);
            const isEmptyOrNonSelectedOption = !formItems.length || !this.isOptionSelected(optionSetPropertySet, optionArrayName);
            if (isEmptyOrNonSelectedOption && !optionPropertySet.isEmpty()) {
                optionSetPropertySet.removeProperty(optionArrayName, 0);
            } else {
                this.recursiveCleanMissingProperties(optionPropertySet.getSet(0), formItems);
            }
        });
    }

    private isOptionSelected(optionSetProperty: PropertySet, optionName: string): boolean {
        const selectionArray: PropertyArray = optionSetProperty.getPropertyArray('_selected');
        if (!selectionArray || selectionArray.isEmpty()) {
            return false;
        }

        return selectionArray.some((selectedOptionName: Property) => {
            return selectedOptionName.getString() === optionName;
        });
    }

    private recursiveCleanMissingProperties(optionProperties: PropertySet, items: FormItem[]) {
        if (!optionProperties || !items) {
            return;
        }
        optionProperties.forEach((property: Property) => {
            const formItem: FormItem = items.find(item => item.getName() === property.getName());
            if (!formItem) {
                optionProperties.removeProperty(property.getName(), 0);
            } else if (formItem instanceof FieldSet ||
                       formItem instanceof FormItemSet ||
                       formItem instanceof FormOptionSet ||
                       formItem instanceof FormOptionSetOption) {

                this.recursiveCleanMissingProperties(optionProperties.getPropertySet(property.getName()), formItem.getFormItems());
            }
        });
    }

    private assembleViewedPage(): Page {
        let liveFormPanel = this.getLivePanel();
        return liveFormPanel ? liveFormPanel.getPage() : null;
    }

    private resolveContentNameForUpdateRequest(): ContentName {
        if (StringHelper.isBlank(this.getWizardHeader().getName())) {
            if (this.getPersistedItem().getName().isUnnamed()) {
                return this.getPersistedItem().getName();
            } else {
                return ContentUnnamed.newUnnamed();
            }
        }

        const name: string = this.getWizardHeader().getName();
        assert(name != null, 'name cannot be null');
        if (name.indexOf(ContentUnnamed.UNNAMED_PREFIX) === 0) {
            return new ContentUnnamed(name);
        }
        return new ContentName(name);
    }

    setRequireValid(requireValid: boolean) {
        this.requireValid = requireValid;
    }

    setIsMarkedAsReady(value: boolean) {
        this.isMarkedAsReady = value;
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

    assembleViewedContent(viewedContentBuilder: ContentBuilder, cleanFormRedundantData: boolean = false): ContentBuilder {

        viewedContentBuilder.setName(this.resolveContentNameForUpdateRequest());
        viewedContentBuilder.setDisplayName(this.getWizardHeader().getDisplayName());
        if (this.contentWizardStepForm) {
            if (!cleanFormRedundantData) {
                viewedContentBuilder.setData(this.contentWizardStepForm.getData());
            } else {
                const data: PropertyTree = new PropertyTree(this.contentWizardStepForm.getData().getRoot()); // copy
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

    getCloseAction(): Action {
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

    private setModifyPermissions(loginResult: LoginResult) {
        this.modifyPermissions =
            this.getPersistedItem().isAnyPrincipalAllowed(loginResult.getPrincipals(), Permission.MODIFY);
        this.getEl().toggleClass('no-modify-permissions', !this.modifyPermissions);
        if (this.getLivePanel()) {
            this.getLivePanel().setModifyPermissions(this.modifyPermissions);
        }
    }

    hasModifyPermissions(): boolean {
        return this.modifyPermissions;
    }

    /**
     * Synchronizes wizard's extraData step forms with passed content -
     * erases steps forms (meta)data and populates it with content's (meta)data.
     * @param content
     */
    private updateXDataStepForms(content: Content, unchangedOnly: boolean = true) {

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            const xDataName: XDataName = new XDataName(form.getXDataNameAsString());
            const extraData: ExtraData = content.getExtraDataByName(xDataName);

            //fill empty fields by empty values in persisted xdata
            const viewedData = form.getData().copy();
            viewedData.getRoot().reset();

            form.getData().unChanged(this.dataChangedHandler);

            const data: PropertyTree = extraData ? extraData.getData() : new PropertyTree();
            data.onChanged(this.dataChangedHandler);

            form.resetState(data);

            if (form.isEnabled()) {
                form.update(data, unchangedOnly);
            } else {
                form.resetData();
            }

            if (!form.isOptional() || !extraData || extraData.getData().getRoot().getSize() > 0) {
                this.syncPersistedItemWithXData(xDataName, form.isEnabled() ? viewedData : new PropertyTree());
            }

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

    private checkIfRenderable(): Q.Promise<Boolean> {
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

        return !!this.site || (this.shouldOpenEditorByDefault() && !ArrayHelper.contains(ContentWizardPanel.EDITOR_DISABLED_TYPES,
            this.contentType.getContentTypeName()));
    }

    private updateButtonsState(): Q.Promise<void> {
        return this.checkIfRenderable().then(() => {
            this.wizardActions.getPreviewAction().setEnabled(this.renderable);

            return this.wizardActions.refreshPendingDeleteDecorations().then(() => {
                this.getComponentsViewToggler().setEnabled(this.renderable);
                this.getComponentsViewToggler().setVisible(this.renderable);
                this.contextSplitPanel.updateRenderableStatus(this.renderable);
            });
        });
    }

    private updatePublishStatusOnDataChange() {
        if (this.isContentFormValid) {
            const hasUnsavedChanges: boolean = this.hasUnsavedChanges();
            if (!hasUnsavedChanges) {
                // WARN: intended to restore status to persisted value if data is changed to original values,
                // but if invoked after save this will revert status to persisted one as well
                this.currentContent = this.persistedContent;

            } else {
                if (this.currentContent === this.persistedContent) {
                    this.currentContent = this.persistedContent.clone();
                }
                if (this.wizardActions.isOnline()) {
                    this.currentContent.setCompareStatus(CompareStatus.NEWER);
                }
                this.currentContent.setPublishStatus(this.scheduleWizardStepForm.getPublishStatus());
            }
            this.getMainToolbar().setItem(this.currentContent);
            this.wizardActions.setContent(this.currentContent).refreshState();
            this.workflowStateIconsManager.updateIcons();
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

    getLiveMask(): LoadMask {
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

    private updateEditPermissionsButtonIcon(content: Content) {
        const canEveryoneRead: boolean = this.canEveryoneRead(content);

        this.editPermissionsToolbarButton.toggleClass('icon-unlock', canEveryoneRead);
        this.editPermissionsToolbarButton.toggleClass('icon-lock', !canEveryoneRead);
    }

    private canEveryoneRead(content: Content): boolean {
        const entry: AccessControlEntry = content.getPermissions().getEntry(RoleKeys.EVERYONE);
        return !!entry && entry.isAllowed(Permission.READ);
    }

    private updateUrlAction() {
        const action: string = (this.modifyPermissions && this.getPersistedItem().isDataInherited() &&
                                this.isLocalizeInUrl())
                               ? UrlAction.LOCALIZE
                               : UrlAction.EDIT;
        Router.get().setHash(`${action}/${this.getPersistedItem().getId()}`);
        if (!window.name) {
            window.name = `${action}:${this.getPersistedItem().getId()}`;
        }
    }

    protected setPersistedItem(newPersistedItem: Content): void {
        super.setPersistedItem(newPersistedItem);

        if (this.getWizardHeader()) {
            this.getWizardHeader().setPersistedPath(newPersistedItem);
            this.getWizardHeader().setOnline(this.persistedContent.isOnline());
        }
    }

    isHeaderValidForSaving(): boolean {
        return !this.getWizardHeader() || this.getWizardHeader().isValidForSaving();
    }

    private setPersistedContent(content: ContentSummaryAndCompareStatus) {
        this.persistedContent = content;

        if (this.getWizardHeader()) {
            this.getWizardHeader().setOnline(this.persistedContent.isOnline());
        }
    }

    protected checkIfEditIsAllowed(): Q.Promise<boolean> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.loginResult = loginResult;

            return Q(this.getPersistedItem().isAnyPrincipalAllowed(loginResult.getPrincipals(), Permission.MODIFY));
        });
    }

    protected handleCanModify(canModify: boolean): void {
        super.handleCanModify(canModify);

        if (this.getLivePanel()) {
            this.getLivePanel().setModifyPermissions(this.canModify);
        }

        this.toggleStepFormsVisibility(this.loginResult);
        this.updateUrlAction();

        if (this.isLocalizeInUrl()) {
            this.settingsWizardStepForm.updateInitialLanguage();
        }
    }
}
