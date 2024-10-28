import {MinimizeWizardPanelEvent} from '@enonic/lib-admin-ui/app/wizard/MinimizeWizardPanelEvent';
import {WizardHeader} from '@enonic/lib-admin-ui/app/wizard/WizardHeader';
import {WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {WizardStep} from '@enonic/lib-admin-ui/app/wizard/WizardStep';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ApplicationEvent} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PropertyTreeComparator} from '@enonic/lib-admin-ui/data/PropertyTreeComparator';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LangDirection} from '@enonic/lib-admin-ui/dom/Element';
import {Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {showFeedback, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActivatedEvent} from '@enonic/lib-admin-ui/ui/ActivatedEvent';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder} from '@enonic/lib-admin-ui/ui/panel/SplitPanel';
import {SplitPanelSize} from '@enonic/lib-admin-ui/ui/panel/SplitPanelSize';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import {assert} from '@enonic/lib-admin-ui/util/Assert';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ValidationErrorHelper} from '@enonic/lib-admin-ui/ValidationErrorHelper';
import {ValidityChangedEvent} from '@enonic/lib-admin-ui/ValidityChangedEvent';
import * as Q from 'q';
import {LiveEditModel} from '../../page-editor/LiveEditModel';
import {Permission} from '../access/Permission';
import {AI} from '../ai/AI';
import {EnonicAiAppliedData} from '../ai/event/data/EnonicAiAppliedData';
import {AiTranslatorOpenDialogEvent} from '../ai/event/outgoing/AiTranslatorOpenDialogEvent';
import {MovedContentItem} from '../browse/MovedContentItem';
import {CompareStatus} from '../content/CompareStatus';
import {Content, ContentBuilder} from '../content/Content';
import {ContentIconUrlResolver} from '../content/ContentIconUrlResolver';
import {ContentId} from '../content/ContentId';
import {ContentName} from '../content/ContentName';
import {ContentPath} from '../content/ContentPath';
import {ContentPathPrettifier} from '../content/ContentPathPrettifier';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentUnnamed} from '../content/ContentUnnamed';
import {ExtraData} from '../content/ExtraData';
import {Site} from '../content/Site';
import {WorkflowState} from '../content/WorkflowState';
import {XData} from '../content/XData';
import {XDataName} from '../content/XDataName';
import {ContentFormContext} from '../ContentFormContext';
import {BeforeContentSavedEvent} from '../event/BeforeContentSavedEvent';
import {ContentNamedEvent} from '../event/ContentNamedEvent';
import {ContentRequiresSaveEvent} from '../event/ContentRequiresSaveEvent';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentType} from '../inputtype/schema/ContentType';
import {ImageErrorEvent} from '../inputtype/ui/selector/image/ImageErrorEvent';
import {Descriptor} from '../page/Descriptor';
import {PageControllerCustomizedEvent} from '../page/event/PageControllerCustomizedEvent';
import {PageControllerUpdatedEvent} from '../page/event/PageControllerUpdatedEvent';
import {PageUpdatedEvent} from '../page/event/PageUpdatedEvent';
import {Page} from '../page/Page';
import {ProjectContext} from '../project/ProjectContext';
import {PublishStatus} from '../publish/PublishStatus';
import {RenderingMode} from '../rendering/RenderingMode';
import {RepositoryId} from '../repository/RepositoryId';
import {ContentsExistRequest} from '../resource/ContentsExistRequest';
import {ContentsExistResult} from '../resource/ContentsExistResult';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {CreateContentRequest} from '../resource/CreateContentRequest';
import {GetApplicationRequest} from '../resource/GetApplicationRequest';
import {GetApplicationsRequest} from '../resource/GetApplicationsRequest';
import {GetApplicationXDataRequest} from '../resource/GetApplicationXDataRequest';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {GetContentXDataRequest} from '../resource/GetContentXDataRequest';
import {GetPageTemplateByKeyRequest} from '../resource/GetPageTemplateByKeyRequest';
import {IsRenderableRequest} from '../resource/IsRenderableRequest';
import {Router} from '../Router';
import {ProjectDeletedEvent} from '../settings/event/ProjectDeletedEvent';
import {ApplicationAddedEvent} from '../site/ApplicationAddedEvent';
import {ApplicationRemovedEvent} from '../site/ApplicationRemovedEvent';
import {SiteModel} from '../site/SiteModel';
import {UrlAction} from '../UrlAction';
import {ContentHelper} from '../util/ContentHelper';
import {PageHelper} from '../util/PageHelper';
import {UrlHelper} from '../util/UrlHelper';
import {ContextPanelState} from '../view/context/ContextPanelState';
import {ContextPanelMode} from '../view/context/ContextSplitPanel';
import {ContextView} from '../view/context/ContextView';
import {DockedContextPanel} from '../view/context/DockedContextPanel';
import {VersionContext} from '../view/context/widget/version/VersionContext';
import {ContentSaveAction} from './action/ContentSaveAction';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentActionCycleButton} from './ContentActionCycleButton';
import {ContentContext} from './ContentContext';
import {ContentTabBarItem} from './ContentTabBarItem';
import {ContentWizardContextSplitPanel} from './ContentWizardContextSplitPanel';
import {ContentWizardDataLoader} from './ContentWizardDataLoader';
import {ContentWizardHeader} from './ContentWizardHeader';
import {ContentWizardPanelParams} from './ContentWizardPanelParams';
import {ContentWizardStep} from './ContentWizardStep';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import {ContentWizardToolbar} from './ContentWizardToolbar';
import {ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {DisplayNameResolver} from './DisplayNameResolver';
import {RoutineContext} from './Flow';
import {MaskContentWizardPanelEvent} from './MaskContentWizardPanelEvent';
import {GetPageDescriptorsByApplicationsRequest} from './page/contextwindow/inspect/page/GetPageDescriptorsByApplicationsRequest';
import {DefaultModels} from './page/DefaultModels';
import {LiveEditPageProxy} from './page/LiveEditPageProxy';
import {LiveFormPanel, LiveFormPanelConfig} from './page/LiveFormPanel';
import {PageState} from './page/PageState';
import {PageComponentsView} from './PageComponentsView';
import {PageComponentsWizardStep} from './PageComponentsWizardStep';
import {PageComponentsWizardStepForm} from './PageComponentsWizardStepForm';
import {PageEventsManager} from './PageEventsManager';
import {PermissionHelper} from './PermissionHelper';
import {PersistNewContentRoutine} from './PersistNewContentRoutine';
import {ThumbnailUploaderEl} from './ThumbnailUploaderEl';
import {UpdatePersistedContentRoutine} from './UpdatePersistedContentRoutine';
import {WorkflowStateManager, WorkflowStateStatus} from './WorkflowStateManager';
import {XDataWizardStep} from './XDataWizardStep';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {XDataWizardStepForms} from './XDataWizardStepForms';
import {PageTemplate} from '../content/PageTemplate';
import {InspectEvent} from '../event/InspectEvent';
import {PageNavigationEventSource} from './PageNavigationEventData';
import {WizardStepsPanel} from '@enonic/lib-admin-ui/app/wizard/WizardStepsPanel';
import {ContentWizardStepsPanel} from './ContentWizardStepsPanel';
import {ContentDiffHelper} from '../util/ContentDiffHelper';
import {ContentDiff} from '../content/ContentDiff';

export type FormContextName = 'content' | 'xdata' | 'live';

export class ContentWizardPanel
    extends WizardPanel<Content> {

    private contextSplitPanel: ContentWizardContextSplitPanel;

    private contextView: ContextView;

    private livePanel?: LiveFormPanel;

    private liveEditPage?: LiveEditPageProxy;

    private pageComponentsView?: PageComponentsView;

    private pageComponentsWizardStepForm?: PageComponentsWizardStepForm;

    private pageComponentsWizardStep?: PageComponentsWizardStep;

    private dataWizardStep?: ContentWizardStep;

    protected wizardActions: ContentWizardActions;

    protected params: ContentWizardPanelParams;

    protected wizardHeader: ContentWizardHeader;

    private parentContent: Content;

    private contentExistsInParentProject: boolean;

    private defaultModels: DefaultModels;

    private site: Site;

    private contentType: ContentType;

    private siteModel: SiteModel;

    private liveEditModel: LiveEditModel;

    private contentWizardStepForm: ContentWizardStepForm;

    private xDataWizardStepForms: XDataWizardStepForms;

    private displayNameResolver: DisplayNameResolver;

    private minimizeEditButton?: DivEl;

    private toggleMinimizeListener?: (event: ActivatedEvent) => void;

    private splitPanel?: SplitPanel;

    private requireValid: boolean;

    private isContentFormValid: boolean;

    private markedAsReady: boolean;

    private contentNamedListeners: ((event: ContentNamedEvent) => void)[];

    private inMobileViewMode: boolean;

    private skipValidation: boolean;

    private currentCompareStatus: CompareStatus;

    private currentPublishStatus: PublishStatus;

    private persistedCompareStatus: CompareStatus;

    private persistedPublishStatus: PublishStatus;

    private peristedLanguage: string;

    private contentAfterLayout: Content;

    private splitPanelThreshold: number = 960;

    private minimized: boolean = false;

    private scrollPosition: number = 0;

    private dataChangedHandler: () => void;

    private dataChangedListeners: (() => void) [];

    private applicationAddedListener: (applicationConfig: ApplicationConfig) => void;

    private applicationRemovedListener: (event: ApplicationRemovedEvent) => void;

    private applicationUninstalledListener: (event: ApplicationEvent) => void;

    private applicationStoppedListener: (event: ApplicationEvent) => void;

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

    private wizardFormUpdatedDuringSave: boolean;

    private applicationLoadCount: number;

    private debouncedEditorReload: (clearInspection: boolean) => void;

    private debouncedAppsChangeHandler: () => void;

    private debouncedEnonicAiDataChangedHandler: () => void;

    private isFirstUpdateAndRenameEventSkiped: boolean;

    private workflowStateManager: WorkflowStateManager;

    public static debug: boolean = false;

    private formsContexts: Map<FormContextName, ContentFormContext> = new Map<FormContextName, ContentFormContext>();

    private contentFetcher: ContentSummaryAndCompareStatusFetcher;

    private isRename: boolean;

    constructor(params: ContentWizardPanelParams, cls?: string) {
        super(params);

        if (cls) {
            this.addClass(cls);
        }

        this.loadData();
        this.initBindings();
    }

    protected initElements() {
        super.initElements();

        this.isContentFormValid = false;
        this.setMarkedAsReady(false);
        this.requireValid = false;
        this.skipValidation = false;
        this.contentNamedListeners = [];
        this.dataChangedListeners = [];
        this.contentUpdateDisabled = false;
        this.applicationLoadCount = 0;
        this.isFirstUpdateAndRenameEventSkiped = false;
        this.displayNameResolver = new DisplayNameResolver();
        this.xDataWizardStepForms = new XDataWizardStepForms();
        this.workflowStateManager = new WorkflowStateManager(this);
        this.debouncedEnonicAiDataChangedHandler = AppHelper.debounce(() => {
            AI.get().setCurrentData({
                fields: this.contentWizardStepForm.getData().toJson(),
                topic: this.getWizardHeader().getDisplayName(),
            });
        }, 300);

        this.debouncedEditorReload = AppHelper.debounce((clearInspection: boolean = true) => {
            const livePanel = this.getLivePanel();

            if (this.isRenderable()) {
                livePanel.skipNextReloadConfirmation(true);
                livePanel.loadPage(clearInspection);
            }
        }, 200);

        this.debouncedAppsChangeHandler = AppHelper.debounce(this.handleAppChange.bind(this), 200);

        this.dataChangedHandler = AppHelper.debounce(() => {
            if (!this.isRendered()) {
                return;
            }

            this.updatePublishStatusOnDataChange();
            this.notifyDataChanged();
        }, 100);

        let applicationKeys: ApplicationKey[] = [];
        const saveOnAppChange = (force: boolean = false) => {
            (force ? Q.resolve(true) : this.checkIfAppsHaveDescriptors(applicationKeys))
                .then((appsHaveDescriptors: boolean) => appsHaveDescriptors ? this.saveChanges() : Q.resolve())
                .finally(() => applicationKeys = []);
        };

        const debouncedSaveOnAppChange = AppHelper.debounce(saveOnAppChange, 300);

        this.applicationAddedListener = (applicationConfig: ApplicationConfig) => {
            this.addXDataStepForms(applicationConfig.getApplicationKey());
            applicationKeys.push(applicationConfig.getApplicationKey());
        };

        ApplicationAddedEvent.on((event: ApplicationAddedEvent) => {
            if (!applicationKeys.some((key: ApplicationKey) => key.equals(event.getApplicationKey()))) {
                applicationKeys.push(event.getApplicationKey());
            }

            debouncedSaveOnAppChange();
        });

        this.applicationRemovedListener = (event: ApplicationRemovedEvent) => {
            this.removeXDataStepForms(event.getApplicationKey()).then((removedXDataCount: number) => {
                applicationKeys.push(event.getApplicationKey());

                if (this.isSaving()) {
                    // Save might already have been initiated by the LiveEdit page on app remove
                    return;
                }

                saveOnAppChange(removedXDataCount > 0);
            }).catch(DefaultErrorHandler.handle);
        };

        this.applicationUninstalledListener = (event: ApplicationEvent) => {
            if (!this.isAppUsedByContent(event.getApplicationKey())) {
                return;
            }

            this.handleMissingOrStoppedApplicationsChange();
        };

        this.applicationStoppedListener = (event: ApplicationEvent) => {
            if (!this.isAppUsedByContent(event.getApplicationKey())) {
                return;
            }

            this.handleMissingOrStoppedApplicationsChange();

            let message = i18n('text.application.not.available', event.getApplicationKey().toString());

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
                        .catch((reason) => { //app was uninstalled
                            showWarning(message);
                        });

                    this.unShown(shownHandler);
                };

                this.onShown(shownHandler);
            }
        };

        this.applicationStartedListener = (event: ApplicationEvent) => {
            if (!this.isAppUsedByContent(event.getApplicationKey())) {
                return;
            }
            this.handleMissingOrStoppedApplicationsChange();
        };

        this.contentFetcher = new ContentSummaryAndCompareStatusFetcher();
    }

    private initBindings() {
        let nextActions = this.getActions();
        let currentKeyBindings = Action.getKeyBindings(nextActions);
        KeyBindings.get().bindKeys(currentKeyBindings);
    }

    protected initEventsListeners() {
        super.initEventsListeners();

        this.onShown(() => {
            if (this.livePanel && !this.livePanel.isRendered()) {
                this.liveMask.show();
            }
        });

        this.listenToContentEvents();
        this.handleSiteConfigApply();
        this.handleBrokenImageInTheWizard();
        this.getWizardHeader().onPropertyChanged(this.dataChangedHandler);
        this.getWizardHeader().onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === 'displayName') {
                this.debouncedEnonicAiDataChangedHandler();
            }
        });

        const saveAction: ContentSaveAction = this.getWizardActions().getSaveAction();

        this.getWizardHeader().onNameCheckIsOn(() => {
            saveAction.setEnabled(false);
            saveAction.setLocked(true);
        });

        this.getWizardHeader().onNameCheckIsOff(() => {
            saveAction.setLocked(false);
            saveAction.setEnabled(this.hasUnsavedChanges());
        });

        this.getWizardHeader().onRenamed(() => {
            this.isRename = true;
            saveAction.setEnabled(true);
            saveAction.execute();
        });

        this.onPageStateChanged(() => {
            this.livePanel?.setSaveEnabled(!ObjectHelper.equals(PageState.getState(), this.getPersistedItem().getPage()));
        });

        AI.get().onResultReceived(({displayName, propertyTree}: EnonicAiAppliedData) => {
            if (displayName != null) {
                this.wizardHeader.setDisplayName(displayName);
            }

            this.updateWizardStepForms(propertyTree, false).then(() => {
                this.debouncedEnonicAiDataChangedHandler();
            });
        });
    }

    toggleMinimize(navigationIndex: number = -1) {
        this.stepsPanel.setListenToScroll(false);

        let scroll = this.stepsPanel.getScroll();
        this.minimized = !this.minimized;
        this.splitPanel.setSplitterIsHidden(this.minimized);

        this.stepNavigator.unNavigationItemActivated(this.toggleMinimizeListener);
        this.formPanel.toggleClass('minimized');
        this.minimizeEditButton.toggleClass('icon-arrow-right', this.minimized);
        this.minimizeEditButton.toggleClass('icon-arrow-left', !this.minimized);

        new MinimizeWizardPanelEvent().fire();

        if (this.minimized) {
            this.stepNavigator.setScrollEnabled(false);

            this.scrollPosition = scroll;
            this.splitPanel.savePanelSizesAndDistribute(SplitPanelSize.PIXELS(40));
            this.splitPanel.hideSplitter();
            this.stepNavigator.onNavigationItemActivated(this.toggleMinimizeListener);
            this.undockPCV();
        } else {
            this.splitPanel.loadPanelSizesAndDistribute();

            if (!this.splitPanel.isSecondPanelHidden()) {
                this.splitPanel.showSplitter();
            }

            this.stepsPanel.setScroll(this.scrollPosition);
            this.stepsPanel.setListenToScroll(true);
            this.stepNavigator.setScrollEnabled(true);
            this.stepNavigator.selectNavigationItem(navigationIndex, false, true);
            this.dockPCV();
        }

        const maximized = !this.minimized;
        if (this.helpTextToggleButton) {
            this.helpTextToggleButton.setVisible(maximized);
        }
        this.stepNavigatorAndToolbarContainer.changeOrientation(maximized);
    }

    protected createWizardActions(): ContentWizardActions {
        const wizardActions: ContentWizardActions = new ContentWizardActions(this);
        wizardActions.getShowLiveEditAction().setEnabled(false);

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
        return new ContentWizardDataLoader().loadData(this.params)
            .then((loader: ContentWizardDataLoader) => {
                if (ContentWizardPanel.debug) {
                    console.debug('ContentWizardPanel.doLoadData: loaded data at ' + new Date().toISOString(), loader);
                }
                if (loader.content) {
                    // in case of new content will be created in super.loadData()
                    this.formState.setIsNew(this.params.displayAsNew);
                    this.setPersistedItem(loader.content);
                    this.setMarkedAsReady(loader.content.getWorkflow().getState() === WorkflowState.READY);

                    if (this.params.displayAsNew) {
                        showFeedback(i18n('notify.content.created'));
                    }
                }

                this.defaultModels = loader.defaultModels;
                this.site = loader.siteContent;
                this.contentType = loader.contentType;
                this.parentContent = loader.parentContent;
                this.contentExistsInParentProject = !!loader.contentExistsInParentProject;
                this.persistedCompareStatus = loader.compareStatus;
                this.persistedPublishStatus = loader.publishStatus;
                this.currentCompareStatus = loader.compareStatus;
                this.currentPublishStatus = loader.publishStatus;
                this.peristedLanguage = loader.content?.getLanguage();

                this.wizardHeader.setPlaceholder(this.contentType?.getDisplayNameLabel());
                this.wizardHeader.setPersistedPath(this.isItemPersisted() ? this.getPersistedItem() : null);

                const existing: Content = this.getPersistedItem();
                if (existing) {
                    this.wizardHeader.setDisplayName(existing.getDisplayName());
                    this.wizardHeader.setName(existing.getName().toString());
                }

                AI.get().setContentType(this.contentType);
                AI.get().updateInstructions(this.getApplicationsConfigs());

                return this.loadAndSetPageState(loader.content?.getPage()?.clone());
            }).then(() => super.doLoadData());
    }

    private loadAndSetPageState(page: Page): Q.Promise<void> {
        const pagePromise: Q.Promise<Page | null> = page ? PageHelper.injectEmptyRegionsIntoPage(page) : Q.resolve(null);

        return pagePromise.then((page: Page | null) => {
            PageState.setState(page);
            return Q.resolve();
        });
    }

    protected createFormIcon(): ThumbnailUploaderEl {
        return new ThumbnailUploaderEl({
            name: 'thumbnail-uploader',
            deferred: true
        });
    }

    public getFormIcon(): ThumbnailUploaderEl {
        return super.getFormIcon() as ThumbnailUploaderEl;
    }

    protected createMainToolbar(): ContentWizardToolbar {
        return new ContentWizardToolbar({
            actions: this.wizardActions,
            workflowStateIconsManager: this.workflowStateManager,
            className: 'content-wizard-toolbar',
            compareVersionsPreHook: () => {
                if (!this.hasUnsavedChanges()) {
                    return Q.resolve();
                }

                return this.saveChangesWithoutValidation();
            }
        });
    }

    public getMainToolbar(): ContentWizardToolbar {
        return super.getMainToolbar() as ContentWizardToolbar;
    }

    protected createWizardHeader(): WizardHeader {
        return new ContentWizardHeader();
    }

    private getWizardHeaderPath(): string {
        if (this.parentContent) {
            return ContentPathPrettifier.prettifyUnnamedPathElements(this.parentContent.getPath()).toString() + '/';
        }

        return '/';
    }

    public getWizardHeader(): ContentWizardHeader {
        return super.getWizardHeader() as ContentWizardHeader;
    }

    public getLivePanel(): LiveFormPanel {
        return this.livePanel;
    }

    protected createWizardAndDetailsSplitPanel(leftPanel: Panel): SplitPanel {
        this.contextView = new ContextView();
        this.contextView.setItem(this.getContent());
        const rightPanel: DockedContextPanel = new DockedContextPanel(this.contextView);

        this.contextSplitPanel = ContentWizardContextSplitPanel.create(leftPanel, rightPanel)
            .setSecondPanelSize(SplitPanelSize.PERCENTS(this.livePanel ? 16 : 38))
            .setContextView(this.contextView)
            .setLiveFormPanel(this.getLivePanel())
            .setWizardFormPanel(this.formPanel)
            .build();
        this.contextSplitPanel.hideSecondPanel();

        if (this.livePanel) {
            this.splitPanel.onPanelResized(() => this.updateStickyToolbar());
            this.contextView.appendContextWindow(this.getLivePanel().getContextWindow());
            this.livePanel.setContextPanelState(this.contextSplitPanel.getState());

            this.contextSplitPanel.onModeChanged((mode: ContextPanelMode) => {
                if (!this.isMinimized()) {
                    const formPanelSizePercents: number = this.contextSplitPanel.isDockedMode() ? 46 : 38;
                    this.splitPanel.setFirstPanelSize(SplitPanelSize.PERCENTS(formPanelSizePercents));
                    this.splitPanel.distribute(true);
                }

                this.livePanel.setContextPanelMode(mode);
            });

            this.contextSplitPanel.onStateChanged((state: ContextPanelState) => {
                this.livePanel.setContextPanelState(state);

                if (this.isMinimized()) {
                    return;
                }

                if (state === ContextPanelState.COLLAPSED) {
                    this.splitPanel.setFirstPanelSize(SplitPanelSize.PERCENTS(38));
                    this.splitPanel.distribute(true);
                } else {
                    const formPanelSizePercents: number = this.contextSplitPanel.isDockedMode() ? 46 : 38;
                    this.splitPanel.setFirstPanelSize(SplitPanelSize.PERCENTS(formPanelSizePercents));
                    this.splitPanel.distribute(true);
                }
            });
        }

        return this.contextSplitPanel;
    }

    private createLivePanel(): LiveFormPanel {
        this.liveEditPage = new LiveEditPageProxy(this.getPersistedItem().getContentId());
        this.pageComponentsView = new PageComponentsView(this.liveEditPage);

        const liveFormPanel: LiveFormPanel = new LiveFormPanel({
            contentWizardPanel: this,
            contentType: this.contentType,
            defaultModels: this.defaultModels,
            content: this.getPersistedItem(),
            liveEditPage: this.liveEditPage,
        } as LiveFormPanelConfig);

        this.toggleMinimizeListener = (event: ActivatedEvent) => {
            this.toggleMinimize(event.getIndex());
        };

        this.liveMask = new LoadMask(liveFormPanel);

        this.wizardActions.getShowLiveEditAction().setEnabled(true);

        liveFormPanel.whenRendered(() => {
            if (WizardPanel.debug) {
                console.debug('WizardPanel: livePanel.onRendered');
            }
            this.liveMask.hide();
            liveFormPanel.removeClass('rendering');
        });

        this.toggleMinimizeListener = (event: ActivatedEvent) => {
            this.toggleMinimize(event.getIndex());
        };

        this.minimizeEditButton = new DivEl('minimize-edit icon-arrow-left');
        this.minimizeEditButton.onClicked(this.toggleMinimize.bind(this, -1));

        return liveFormPanel;
    }

    private isLivePanelAllowed(): Q.Promise<boolean> {
        if (this.contentType.isShortcut()) {
            return Q.resolve(false);
        }

        if (this.isWithinSite()) {
            return Q.resolve(true);
        }

        return this.checkIfRenderable();
    }

    private isWithinSite(): boolean {
        const isSiteOrWithinSite: boolean = !!this.site || this.params.createSite;
        const isPageTemplate: boolean = this.contentType.isPageTemplate();

        return isSiteOrWithinSite || isPageTemplate;
    }

    getWizardActions(): ContentWizardActions {
        return super.getWizardActions() as ContentWizardActions;
    }

    doRenderOnDataLoaded(rendered: boolean): Q.Promise<boolean> {
        this.initListeners();

        return this.isLivePanelAllowed().then((isAllowed: boolean) => {
            if (isAllowed) {
                this.livePanel = this.createLivePanel();
                this.liveMask = new LoadMask(this.livePanel).addClass('live-load-mask') as LoadMask;
            }

            return super.doRenderOnDataLoaded(rendered).then(() => {
                if (ContentWizardPanel.debug) {
                    console.debug('ContentWizardPanel.doRenderOnDataLoaded at ' + new Date().toISOString());
                }

                this.appendChild(this.getContentWizardToolbarPublishControls().getMobilePublishControls());

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
                    if (!this.getPersistedItem()) {
                        return;
                    }

                    const isThisValid: boolean = this.isValid();
                    this.isContentFormValid = isThisValid;
                    this.workflowStateManager.update();
                    this.wizardActions
                        .setContentCanBePublished(this.checkContentCanBePublished())
                        .setIsValid(isThisValid)
                        .refreshState();
                    if (!this.isNew()) {
                        this.displayValidationErrors(!(isThisValid && event.isValid()));
                    }
                });

                thumbnailUploader.setEnabled(!this.contentType.isImage());
                thumbnailUploader.onFileUploaded(this.onFileUploaded.bind(this));
                thumbnailUploader.toggleClass('icon-variant', this.getPersistedItem().isVariant());

                this.workflowStateManager.onStatusChanged((status: WorkflowStateStatus) => {
                    this.wizardActions.setContentCanBeMarkedAsReady(WorkflowStateManager.isInProgress(status)).refreshState();
                    this.setMarkedAsReady(WorkflowStateManager.isReady(status));
                });

                this.getContentWizardToolbarPublishControls().getPublishButton().onPublishRequestActionChanged((added: boolean) => {
                    this.wizardActions.setHasPublishRequest(added);
                    this.wizardActions.refreshState();
                });

                if (this.livePanel) {
                    this.livePanel.addClass('rendering');
                    ResponsiveManager.onAvailableSizeChanged(this.formPanel);
                    this.stepNavigatorAndToolbarContainer.appendChild(this.minimizeEditButton);
                }

                if (this.params.createSite || this.getPersistedItem().isSite()) {
                    thumbnailUploader.addClass('site');
                }

                return rendered;
            });
        });
    }

    protected prepareMainPanel(): Panel {
        const leftPanel: Panel = this.livePanel ? this.createSplitFormAndLivePanel(this.formPanel, this.livePanel) : this.formPanel;
        return this.createWizardAndDetailsSplitPanel(leftPanel);
    }

    private createSplitFormAndLivePanel(firstPanel: Panel, secondPanel: Panel): SplitPanel {
        const builder: SplitPanelBuilder = new SplitPanelBuilder(firstPanel, secondPanel)
            .setFirstPanelMinSize(SplitPanelSize.PIXELS(280))
            .setAlignment(SplitPanelAlignment.VERTICAL);

        if ($(window).width() > this.splitPanelThreshold) {
            builder.setFirstPanelSize(SplitPanelSize.PERCENTS(38));
        }

        this.splitPanel = builder.build();
        this.splitPanel.addClass('wizard-and-preview');

        return this.splitPanel;
    }

    isNew(): boolean {
        return this.formState.isNew();
    }

    private updatePersistedContentIfChanged(newPersistedContent: Content): Q.Promise<void> {
        const viewedContent: Content = this.assembleViewedContent(new ContentBuilder(this.getPersistedItem()), true).build();

        // this update was triggered by our changes, so reset dirty state after save
        if (!viewedContent.equals(newPersistedContent)) {
            return this.checkIfRenderable(newPersistedContent).then(() => {
                this.doUpdateModifiedPersistedContent(viewedContent, newPersistedContent);
            });
        }

        return Q.resolve();
    }

    private doUpdateModifiedPersistedContent(viewedContent: Content, newPersistedContent: Content): void {
        this.setPersistedItem(newPersistedContent);
        const contentClone: Content = newPersistedContent.clone();

        this.initFormContext(contentClone);
        this.updateWizard(contentClone, true);

        const diff = ContentDiffHelper.diff(viewedContent, newPersistedContent);

        if (this.isReloadLiveEditRequired(diff)) {
            this.resetLivePanel(contentClone).then(() => {
                this.contextView.updateWidgetsVisibility();
                this.toggleLiveEdit();
            }).catch(DefaultErrorHandler.handle);
        }

        if (!ObjectHelper.equals(PageState.getState(), contentClone.getPage())) {
            this.loadAndSetPageState(contentClone.getPage()).then(() => {
                this.togglePageComponentsViewOnDemand();

                if (this.isPageComponentsViewRequired()) {
                    this.pageComponentsView.reload();
                }

                this.updateToolbarActions();
            }).catch(DefaultErrorHandler.handle);
        }

        if (!this.isDisplayNameUpdated()) {
            this.getWizardHeader().resetBaseValues();
        }

        this.wizardActions.setDeleteOnlyMode(viewedContent, false);
        this.updateButtonsState();
    }

    private resetLivePanel(contentClone: Content): Q.Promise<void> {
        if (!this.livePanel) {
            return Q.resolve();
        }

        this.getLivePanel().setHasPage(!!contentClone.getPage());
        this.getLivePanel().updateHasControllers();

        if (this.isRenderable()) {
            if (this.getPersistedItem().getPage() || this.isWithinSite()) {
                this.updateLiveEditModel(contentClone);
            }

            return Q.resolve();
        }

        if (this.getPersistedItem().getPage()) {
            this.updateLiveEditModel(contentClone);
            return this.handleNonRenderablePage();
        }

        return this.unloadPage();
    }

    private handleNonRenderablePage(): Q.Promise<void> {
        this.liveEditModel = null;
        return Q.resolve();
    }

    private unloadPage(): Q.Promise<void> {
        this.liveEditModel = null;
        this.livePanel.unloadPage();
        this.removePCV();

        return Q.resolve();
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
                }
            } else {
                if (this.inMobileViewMode && this.isLiveView()) {
                    this.inMobileViewMode = false;
                    this.showLiveEdit();
                }

                this.inMobileViewMode = false;
            }
        }
    }

    saveChanges(): Q.Promise<Content> {
        IsRenderableRequest.clearCache();
        this.livePanel?.skipNextReloadConfirmation(true);
        this.setRequireValid(false);
        this.contentUpdateDisabled = true;
        this.isFirstUpdateAndRenameEventSkiped = false;
        this.contentWizardStepForm?.getFormView()?.clean();
        new BeforeContentSavedEvent().fire();
        this.wizardHeader.toggleEnabled(false);
        const previousPersistedItem = this.getPersistedItem();

        return super.saveChanges().then((content: Content) => {
            if (this.reloadPageEditorOnSave) {
                this.checkIfRenderable(content)
                    .then(() => {
                        const diff = previousPersistedItem ? ContentDiffHelper.diff(previousPersistedItem, content) : null;
                        return diff && this.isReloadLiveEditRequired(diff) ? this.resetLivePanel(content.clone()) : Q.resolve();
                    })
                    .then(() => {
                        this.updateButtonsState();
                        this.contextView.updateWidgetsVisibility();
                        this.toggleLiveEdit();
                    })
                    .catch(DefaultErrorHandler.handle);
            }

            return content.clone();
        }).finally(() => {
            this.contentUpdateDisabled = false;
            this.isRename = false;
            this.updateButtonsState();
            this.wizardHeader.toggleEnabled(true);
        });
    }

    private handleSiteConfigApply() {
        let siteConfigApplyHandler = (event: ContentRequiresSaveEvent) => {
            if (this.isCurrentContentId(event.getContentId()) && this.hasUnsavedChanges()) {
                this.setMarkedAsReady(false);
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
        if (this.canModify) {
            super.giveInitialFocus();
        }
    }

    doLayout(persistedContent: Content): Q.Promise<void> {

        return super.doLayout(persistedContent).then(() => {

            const persistedContentCopy = persistedContent.clone();

            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doLayout at ' + new Date().toISOString(), persistedContent);
            }

            this.updateThumbnailWithContent(persistedContent);

            this.getWizardHeader().setSimplifiedNameGeneration(
                persistedContent.getType().isDescendantOfMedia() || !CONFIG.isTrue('allowPathTransliteration'));

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
                    console.warn('Received Content from server differs from what\'s viewed:');
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
                            .setYesCallback(() => void this.doLayoutPersistedItem(persistedContentCopy))
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

    private checkIfAppsHaveDescriptors(applicationKeys: ApplicationKey[]): Q.Promise<boolean> {
        if (!applicationKeys.length) {
            return Q<boolean>(false);
        }

        const request = new GetPageDescriptorsByApplicationsRequest(applicationKeys);
        return request.sendAndParse().then((descriptors: Descriptor[]) => descriptors.length > 0);
    }

    private handleAppChange(): void {
        IsRenderableRequest.clearCache();
        const wasRenderable = this.isRenderable();

        this.checkIfRenderable().then(() => {
            const isRenderable = this.isRenderable();

            if (wasRenderable && !isRenderable) {
                this.handleStoppedRendering();
            } else if (!wasRenderable && isRenderable) {
                this.handleStartedRendering();
            }

            this.getLivePanel().updateHasControllers();
        }).catch(DefaultErrorHandler.handle);
    }

    private handleStoppedRendering(): void {
        //
    }

    private handleStartedRendering(): void {
        this.debouncedEditorReload(false);
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

    private isAppUsedByContent(applicationKey: ApplicationKey): boolean {
        return this.siteModel.getApplicationKeys().some((appKey: ApplicationKey) => applicationKey.equals(appKey));
    }

    private initListeners() {
        this.onContentNamed(event => {
            // content path has changed so update site as well
            const content = event.getContent();
            if (content.isSite()) {
                this.site = content as Site;
            } else {
                new ContentWizardDataLoader().loadSite(content.getContentId()).then(site => {
                    this.site = site;
                });
            }
        });

        MaskContentWizardPanelEvent.on(event => {
            if (this.getPersistedItem().getContentId().equals(event.getContentId())) {
                this.wizardActions.suspendActions(event.isMask());
            }
        });

        PageState.getEvents().onPageReset(() => {
            this.setMarkedAsReady(false);
            this.saveChanges().catch(DefaultErrorHandler.handle);
        });

        // to be changed: make default models static and remove that call by directly using DefaultModels in PageState
        PageEventsManager.get().onCustomizePageRequested(() => {
            this.getTemplateForCustomize().then((template: PageTemplate) => {
                PageEventsManager.get().notifySetCustomizedPageRequested(template);
            }).catch(DefaultErrorHandler.handle);
        });

        PageState.getEvents().onPageUpdated((event: PageUpdatedEvent) => {
            this.togglePageComponentsViewOnDemand();
            this.setMarkedAsReady(false);

            if (event instanceof PageControllerCustomizedEvent) {
                this.liveEditPage?.setLocked(false);
            } else { // saving page on all page updates except when page is being customized
                this.saveChanges().catch(DefaultErrorHandler.handle);
            }

            if (event instanceof PageControllerUpdatedEvent) {
                this.pageComponentsView.setLocked(false);
                this.pageComponentsView.reload();

                if (!this.isMinimized()) {
                    this.pageComponentsWizardStep.getTabBarItem().select();
                }
            }
        });

        PageState.getEvents().onPageReset(() => {
            this.removePCV();
        });

        InspectEvent.on((event: InspectEvent) => {
            const minimizeWizard = event.isShowPanel() &&
                                   event.getSource() === PageNavigationEventSource.EDITOR &&
                                   !this.isMinimized() &&
                                   this.isRenderable() &&
                                   this.getLivePanel().isShown() &&
                                   !this.contextSplitPanel.isMobileMode() &&
                                   ResponsiveRanges._1380_1620.isFitOrSmaller(this.getEl().getWidthWithBorder());
            if (minimizeWizard) {
                this.toggleMinimize();
            }
        });
    }

    private onFileUploaded(event: UploadedEvent<Content>) {
        let newPersistedContent: Content = event.getUploadItem().getModel();
        this.setPersistedItem(newPersistedContent.clone());
        this.updateXDataStepForms(newPersistedContent);
        this.updateThumbnailWithContent(newPersistedContent);

        this.showFeedbackContentSaved(newPersistedContent);
    }

    private updateWizard(content: Content, unchangedOnly: boolean = true) {
        this.updateThumbnailWithContent(content);
        this.getWizardHeader().updateByContent(content);
        this.updateWizardStepForms(content.getContentData(), unchangedOnly);
        this.updateXDataStepForms(content, unchangedOnly);
        this.resetLastFocusedElement();
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
        this.xDataWizardStepForms.reset();
    }

    private createSteps(): ContentWizardStep[] {
        if (this.livePanel && this.contentType.getContentTypeName().isFragment()) {
            return this.createFragmentSteps();
        }

        if (this.contentType.isPageTemplate()) {
            return this.createPageTemplateSteps();
        }

        const steps: ContentWizardStep[] =
            [this.dataWizardStep = new ContentWizardStep(this.contentType.getDisplayName(), this.contentWizardStepForm)];

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            steps.push(new XDataWizardStep(form));
        });

        if (this.isPageComponentsViewRequired()) {
            steps.push(this.initPageComponentsWizardStep());
        }

        return steps;
    }

    private createFragmentSteps(): ContentWizardStep[] {
        const steps = [this.initPageComponentsWizardStep()];

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            steps.push(new XDataWizardStep(form));
        });

        return steps;
    }

    private createPageTemplateSteps(): ContentWizardStep[] {
        const steps: ContentWizardStep[] = [];

        steps.push(this.initPageComponentsWizardStep());
        steps.push(this.dataWizardStep = new ContentWizardStep('', this.contentWizardStepForm));

        return steps;
    }

    private addAccessibilityToSteps(steps: ContentWizardStep[]): void {
        steps.forEach((step: ContentWizardStep) => this.addAccessibilityToStep(step));
    }

    private addAccessibilityToStep(step: ContentWizardStep): void {
        const stepTabBarItem: ContentTabBarItem = step.getTabBarItem();
        stepTabBarItem.getEl().setTabIndex(0);
        stepTabBarItem.onKeyDown((event: KeyboardEvent): void => {
            if (KeyHelper.isEnterKey(event)) {
                stepTabBarItem.getHTMLElement().click();
            }
        });
    }

    private fetchPersistedContent(): Q.Promise<Content> {
        return new GetContentByIdRequest(this.getPersistedItem().getContentId()).sendAndParse();
    }

    private listenToContentEvents() {

        const serverEvents: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        const deleteHandler = (items: ContentServerChangeItem[]) => {
            if (items.some((item: ContentServerChangeItem) => item.getContentId().equals(this.getPersistedItem()?.getContentId()))) {
                this.contentDeleted = true;
                this.close();
            }
        };

        const publishOrUnpublishHandler = (contents: ContentSummaryAndCompareStatus[]) => {
            contents.forEach(content => {
                if (this.isCurrentContentId(content.getContentId())) {
                    this.setUpdatedContent(content);
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

            this.handlePersistedContentUpdate(updatedContent);
        };

        const sortedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            const currentItem: ContentSummaryAndCompareStatus = data.find((sorted: ContentSummaryAndCompareStatus) => {
                return this.isCurrentContentId(sorted.getContentId());
            });

            if (currentItem) {
                this.wizardActions.setContent(currentItem).refreshState();
                this.contextView.setItem(currentItem);
            }
        };

        const movedHandler = (movedItems: MovedContentItem[]) => {
            this.handleCUD();

            const wasMoved: boolean = movedItems.some((movedItem: MovedContentItem) => {
                return this.persistedItemPathIsDescendantOrEqual(movedItem.oldPath);
            });

            if (wasMoved) {
                updateHandler(movedItems[0].item);
            }
        };

        const contentUpdatedHandler = (data: ContentSummaryAndCompareStatus[]) => {
            this.handleCUD();

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

        const contentPermissionsUpdatedHandler = (contents: ContentSummaryAndCompareStatus[]) => {
            if (this.contentUpdateDisabled || !this.getPersistedItem()) {
                return;
            }

            const thisContentId: ContentId = this.getPersistedItem().getContentId();

            if (!ContentSummaryAndCompareStatus.isInArray(thisContentId, contents)) {
                return;
            }

            this.contentFetcher.fetch(thisContentId)
                .then(updatePermissionsHandler)
                .catch(DefaultErrorHandler.handle);
        };

        const contentRenamedHandler = (contents: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            this.getWizardHeader()?.refreshNameUniqueness();

            contents.forEach((renamedContent: ContentSummaryAndCompareStatus, index: number) => {
                if (this.isCurrentContentId(renamedContent.getContentId())) {
                    this.handlePersistedContentUpdate(renamedContent);
                } else if (this.getPersistedItem().getPath().isDescendantOf(oldPaths[index])) {
                    this.contentFetcher.fetchByContent(this.getPersistedItem()).then((summaryAndStatus) => {
                        this.handlePersistedContentUpdate(summaryAndStatus);
                    });
                }
            });
        };

        const versionChangeHandler = (contentId: string, version: string) => {
            if (this.getPersistedItem()?.getId() === contentId) {
                this.handleCUD();
                this.updateButtonsState();
            }
        };

        const createdHandler = () => {
            this.handleCUD();
            this.getWizardHeader()?.refreshNameUniqueness();
        };

        const otherRepoDelete = (items: ContentServerChangeItem[]): void => {
            if (!this.isItemPersisted() || !this.getPersistedItem().isInherited()) {
                return;
            }

            const contextProject = ProjectContext.get().getProject();

            if (!contextProject.hasParents()) {
                return;
            }

            const thisContentId: ContentId = this.getPersistedItem().getContentId();
            const thisContentIdAsString: string = this.getPersistedItem().getContentId().toString();

            let deletedParent = contextProject.getParents().find(parent => {
                const parentProjectRepo = RepositoryId.fromProjectName(parent).toString();
                return items.some((item: ContentServerChangeItem) => {
                    return item.getContentId().equals(thisContentId) && item.getRepo() === parentProjectRepo;
                });
            });

            if (deletedParent) {
                void new ContentsExistRequest([thisContentIdAsString])
                    .setRequestProjectName(deletedParent)
                    .sendAndParse()
                    .then((result: ContentsExistResult) => {
                        this.contentExistsInParentProject = !!result.getContentsExistMap()[thisContentIdAsString];

                        if (!this.contentExistsInParentProject) {
                            this.wizardActions.refreshState();
                        }
                    }).catch(DefaultErrorHandler.handle);
            }
        };

        const archivedHandler = (items: ContentServerChangeItem[]) => {
            if (!this.getPersistedItem()) {
                return;
            }

            if (items.some((item: ContentServerChangeItem) => item.getContentId().equals(this.getPersistedItem().getContentId()))) {
                this.contentDeleted = true;
                this.close();
            }
        };

        VersionContext.onActiveVersionChanged(versionChangeHandler);

        serverEvents.onContentCreated(createdHandler);
        serverEvents.onContentMoved(movedHandler);
        serverEvents.onContentSorted(sortedHandler);
        serverEvents.onContentUpdated(contentUpdatedHandler);
        serverEvents.onContentPermissionsUpdated(contentPermissionsUpdatedHandler);
        serverEvents.onContentPublished(publishOrUnpublishHandler);
        serverEvents.onContentUnpublished(publishOrUnpublishHandler);
        serverEvents.onContentRenamed(contentRenamedHandler);
        serverEvents.onContentDeletedInOtherRepos(otherRepoDelete);
        serverEvents.onContentArchived(archivedHandler);
        serverEvents.onContentDeleted(deleteHandler);

        this.onClosed(() => {
            VersionContext.unActiveVersionChanged(versionChangeHandler);

            serverEvents.unContentCreated(createdHandler);
            serverEvents.unContentMoved(movedHandler);
            serverEvents.unContentSorted(sortedHandler);
            serverEvents.unContentUpdated(contentUpdatedHandler);
            serverEvents.unContentPermissionsUpdated(contentPermissionsUpdatedHandler);
            serverEvents.unContentPublished(publishOrUnpublishHandler);
            serverEvents.unContentUnpublished(publishOrUnpublishHandler);
            serverEvents.unContentRenamed(contentRenamedHandler);
            serverEvents.unContentDeletedInOtherRepos(otherRepoDelete);
            serverEvents.unContentArchived(archivedHandler);
            serverEvents.unContentDeleted(deleteHandler);
        });

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            if (event.getProjectName() === ProjectContext.get().getProject().getName()) {
                this.contentDeleted = true;
                this.close();
            }
        });
    }

    private setAllowedActionsBasedOnPermissions() {
        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const userCanPublish: boolean = this.isContentPublishableByUser(loginResult);
            const userCanModify: boolean = this.isContentModifiableByUser(loginResult);
            this.wizardActions
                .setUserCanPublish(userCanPublish)
                .setUserCanModify(userCanModify)
                .refreshState();
        }).catch(DefaultErrorHandler.handle);
    }

    private setUpdatedContent(updatedContent: ContentSummaryAndCompareStatus) {
        this.currentCompareStatus = updatedContent.getCompareStatus();
        this.currentPublishStatus = updatedContent.getPublishStatus();
        const isUpdatedAndRenamed = this.isContentUpdatedAndRenamed(updatedContent);
        this.setPersistedContent(updatedContent);
        this.getMainToolbar().setItem(updatedContent);
        this.wizardActions.setContent(updatedContent).refreshState();
        this.workflowStateManager.update();

        if (!isUpdatedAndRenamed || this.isFirstUpdateAndRenameEventSkiped) {
            this.isFirstUpdateAndRenameEventSkiped = false;
        }
    }

    private isContentUpdatedAndRenamed(updatedContent: ContentSummaryAndCompareStatus): boolean {
        // When the content without displayName and name is saved with new
        // names and became valid, the server will generate 2 sequential
        // `NodeServerChangeType.UPDATE` events.
        const noContent = updatedContent == null ||
                          updatedContent.getContentSummary() == null ||
                          this.getPersistedItem() == null;

        if (noContent) {
            return false;
        }

        const oldItem = this.getPersistedItem();
        const wasUnnamed = !oldItem.getDisplayName() && (oldItem.getName() != null && oldItem.getName().isUnnamed());

        const newContent = updatedContent.getContentSummary();
        const hasName = !!newContent.getDisplayName() && (newContent.getName() != null && !newContent.getName().isUnnamed());

        return wasUnnamed && hasName;
    }

    private handlePersistedContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        this.setUpdatedContent(updatedContent);

        this.fetchPersistedContent().then((content: Content) => {
            return this.updatePersistedContentIfChanged(content);
        }).catch(DefaultErrorHandler.handle).done();
    }

    private handleOtherContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        if (updatedContent.getType().isPageTemplate()) {
            this.handleTemplateUpdate(updatedContent);
            return;
        }

        if (this.isParentSiteUpdated(updatedContent)) {
            this.toggleLiveEditIfRenderableChanged().catch(DefaultErrorHandler.handle);
            return;
        }

        this.reloadLiveIfComponentsContainId(updatedContent.getContentId());
    }

    private handleTemplateUpdate(template: ContentSummaryAndCompareStatus): void {
        const isCurrentTemplateUpdated: boolean =
            this.getPersistedItem().getPage()?.getTemplate()?.toString() === template.getContentId().toString();

        if (isCurrentTemplateUpdated) {
            this.toggleLiveEditIfRenderableChanged()
                .then((isRenderableChanged: boolean) => {
                    // if item didn't change renderable/non-renderable state after template update, then reload the editor if renderable
                    if (!isRenderableChanged) {
                        this.debouncedEditorReload(false);
                    }
                }).catch(DefaultErrorHandler.handle);

            return;
        }

        const isPageInAutoRenderingMode: boolean = !this.getPersistedItem().getPage();

        if (isPageInAutoRenderingMode && this.isSameRootWithPersisted(template)) {
            // update default models if page is rendered automatically and updated template might be or become the one rendering
            ContentWizardDataLoader.loadDefaultModels(this.site, this.getPersistedItem().getType()).then((defaultModels: DefaultModels) => {
                const isAutoUpdated: boolean = this.defaultModels.getDefaultPageTemplate()?.getId() === template.getId() ||
                                               defaultModels.getDefaultPageTemplate()?.getId() === template.getId();
                this.defaultModels = defaultModels;

                return isAutoUpdated ? this.toggleLiveEditIfRenderableChanged()
                    .then((isRenderableChanged: boolean) => {
                        // update if template that is auto
                        if (!isRenderableChanged && this.renderable) {
                            this.debouncedEditorReload(false);
                        }
                    }) : Q.resolve();
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private toggleLiveEditIfRenderableChanged(): Q.Promise<boolean> {
        const wasRenderable: boolean = this.isRenderable();

        return this.checkIfRenderable().then(() => {
            if (wasRenderable !== this.isRenderable()) {
                this.resetLivePanel(this.getPersistedItem().clone());
                this.toggleLiveEdit();
                return true;
            }

            return false;
        });
    }

    private reloadLiveIfComponentsContainId(contentId: ContentId): void {
        const form = this.getContentType().getForm();
        const containsIdPromise: Q.Promise<boolean> = ContentHelper.doContentComponentsContainId(this.getPersistedItem(), form, contentId);

        containsIdPromise.then((containsId) => {
            if (containsId) {
                this.debouncedEditorReload(false);
            }
        }).catch(DefaultErrorHandler.handle).done();
    }

    private isSameRootWithPersisted(item: ContentSummaryAndCompareStatus): boolean {
        return item.getPath().getRootElement() === this.getPersistedItem().getPath().getRootElement();
    }

    private isParentSiteUpdated(updatedContent: ContentSummaryAndCompareStatus): boolean {
        return updatedContent.getType().isSite() && this.getPersistedItem().getPath().isDescendantOf(updatedContent.getPath());
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

        return !this.getPersistedItem().getContentId().equals(contentId);
    }

    private updateLiveEditModel(content: Content): void {
        const site: Site = content.isSite() ? content as Site : this.site;

        if (this.siteModel) {
            this.updateSiteModel(site);
        } else {
            this.initSiteModel(site);
        }

        const wasNotRenderable: boolean = !this.liveEditModel;
        this.liveEditModel = this.initLiveEditModel(content);

        const showPanel: boolean = wasNotRenderable && this.isRenderable();
        this.getLivePanel().setModel(this.liveEditModel);
        this.getLivePanel().clearSelectionAndInspect(showPanel, false);
        this.debouncedEditorReload(false);
    }

    private updatePersistedContent(persistedContent: Content) {
        return this.contentFetcher.fetchByContent(persistedContent).then((summaryAndStatus) => {
            this.currentCompareStatus = summaryAndStatus.getCompareStatus();
            this.currentPublishStatus = summaryAndStatus.getPublishStatus();
            this.setPersistedContent(summaryAndStatus);
            this.getMainToolbar().setItem(summaryAndStatus);
            this.wizardActions.setContent(summaryAndStatus).refreshState();
            this.getWizardHeader().toggleNameGeneration(this.currentCompareStatus === CompareStatus.NEW);
            this.workflowStateManager.update();
            this.setAllowedActionsBasedOnPermissions();
        });
    }

    private isContentPublishableByUser(loginResult: LoginResult): boolean {
        return PermissionHelper.hasPermission(Permission.PUBLISH, loginResult, this.getPersistedItem().getPermissions());
    }

    private isContentModifiableByUser(loginResult: LoginResult): boolean {
        return PermissionHelper.hasPermission(Permission.MODIFY, loginResult, this.getPersistedItem().getPermissions());
    }

    saveChangesWithoutValidation(reloadPageEditor?: boolean): Q.Promise<void> {
        this.skipValidation = true;
        this.reloadPageEditorOnSave = reloadPageEditor;

        return this.saveChanges().then(() => {
            this.skipValidation = false;
            this.reloadPageEditorOnSave = true;
        });
    }

    private updateThumbnailWithContent(content: Content) {
        const thumbnailUploader: ThumbnailUploaderEl = this.getFormIcon();
        thumbnailUploader.toggleClass('has-origin-project', !!content.getOriginProject());
        const id: string = content.getContentId().toString();

        thumbnailUploader
            .setParams({id})
            .setEnabled(!content.isImage())
            .setValue(new ContentIconUrlResolver().setContent(content).resolve());
        this.workflowStateManager.update();
    }

    private initLiveEditor(content: Content): Q.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.initLiveEditor at ' + new Date().toISOString());
        }

        this.updateMissingOrStoppedApplications().catch(DefaultErrorHandler.handle);

        if (!this.getLivePanel()) {
            return Q(null);
        }

        this.setupWizardLiveEdit();
        this.getLivePanel().setHasPage(!!this.getPersistedItem().getPage());
        this.getLivePanel().updateHasControllers();
        this.toggleLiveEdit();

        if (this.isRenderable() && !this.isWithinSite()) {
            this.debouncedEditorReload(false);
            return Q.resolve();
        }

        this.updateLiveEditModel(content);
        return Q.resolve();
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

    private isSplitEditModeActive(): boolean {
        return ResponsiveRanges._960_1200.isFitOrBigger(this.getEl().getWidth()) &&
               this.isEditorEnabled() && this.shouldOpenEditorByDefault();
    }

    private setupWizardLiveEdit() {
        const isEditorEnabled: boolean = this.isEditorEnabled();

        this.toggleClass('rendered', isEditorEnabled);

        this.wizardActions.getShowLiveEditAction().setEnabled(isEditorEnabled);

        this.getCycleViewModeButton().setVisible(isEditorEnabled);

        if (isEditorEnabled) {
            this.formMask.show();
        }
    }

    private toggleLiveEdit(): void {
        if (!this.livePanel) {
            return;
        }

        if (this.isSplitEditModeActive()) {
            this.livePanel.hasControllers().then((hasControllers: boolean) => {
                if (hasControllers) {
                    this.showLiveEdit();
                } else {
                    this.showForm();
                }
            }).catch(DefaultErrorHandler.handle);
        } else {
            this.showForm();
        }
    }

    private initSiteModelListeners() {
        if (this.siteModel) {
            this.siteModel.onApplicationAdded(this.applicationAddedListener);
            this.siteModel.onApplicationRemoved(this.applicationRemovedListener);
            this.siteModel.onApplicationUnavailable(this.applicationStoppedListener);
            this.siteModel.onApplicationStarted(this.applicationStartedListener);
            this.siteModel.onApplicationUninstalled(this.applicationUninstalledListener);
        }
    }

    private unbindSiteModelListeners() {
        if (this.siteModel) {
            this.siteModel.unApplicationAdded(this.applicationAddedListener);
            this.siteModel.unApplicationRemoved(this.applicationRemovedListener);
            this.siteModel.unApplicationUnavailable(this.applicationStoppedListener);
            this.siteModel.unApplicationStarted(this.applicationStartedListener);
            this.siteModel.unApplicationUninstalled(this.applicationUninstalledListener);
        }
    }

    // Remember that content has been cloned here and it is not the persistedItem any more
    private doLayoutPersistedItem(content: Content): Q.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.doLayoutPersistedItem at ' + new Date().toISOString());
        }

        this.toggleClass('rendered', false);

        this.initFormContext(content);

        return this.updateButtonsState().then(() => {
            return this.initLiveEditor(content).then(() => {
                this.contextView.updateWidgetsVisibility();

                return this.createWizardStepForms().then(() => {
                    const steps: ContentWizardStep[] = this.createSteps();
                    this.addAccessibilityToSteps(steps);
                    this.setSteps(steps);

                    if (this.contentType.isPageTemplate()) {
                        this.stepNavigator.removeNavigationItem(this.dataWizardStep.getTabBarItem());
                    }

                    return this.layoutWizardStepForms(content).then(() => {
                        if (this.params.localized) {
                            this.onRendered(() => {
                                NotifyManager.get().showFeedback(i18n('notify.content.localized'));
                                this.renderAndOpenTranslatorDialog();
                            });
                        }

                        this.contentAfterLayout = this.assembleViewedContent(this.getPersistedItem().newBuilder(), true).build();

                        this.xDataWizardStepForms.resetState();

                        this.contentWizardStepForm.getFormView().addClass('panel-may-display-validation-errors');
                        this.contentWizardStepForm.validate();
                        this.xDataWizardStepForms.validate();

                        if (this.isNew()) {
                            this.contentWizardStepForm.getFormView().highlightInputsOnValidityChange(true);
                        } else {
                            this.displayValidationErrors(!this.isValid());
                        }

                        this.enableDisplayNameScriptExecution(this.contentWizardStepForm.getFormView());

                        if (!this.siteModel && content.isSite()) {
                            this.initSiteModel(content as Site);
                        }

                        this.wizardActions.initUnsavedChangesListeners();

                        const debouncedUpdate: () => void = AppHelper.debounce(this.updatePublishStatusOnDataChange.bind(this), 100);

                        this.onPageStateChanged(debouncedUpdate);

                        return Q(null);
                    });
                });
            });
        });
    }

    private createWizardStepForms(): Q.Promise<void> {
        this.contentWizardStepForm = new ContentWizardStepForm();

        if (this.isPageComponentsViewRequired() || this.contentType.isPageTemplate()) {
            this.pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
        }

        return this.fetchContentXData().then(this.createXDataWizardStepForms.bind(this));
    }

    private createXDataWizardStepForms(xDatas: XData[]): XDataWizardStepForm[] {
        const added: XDataWizardStepForm[] = [];

        xDatas.forEach((xData: XData) => {
            const stepForm: XDataWizardStepForm = new XDataWizardStepForm(xData);
            stepForm.onEnableChanged(this.dataChangedHandler);
            stepForm.onEnableChanged(() => this.getStepNavigatorContainer().checkAndMinimize());
            this.xDataWizardStepForms.add(stepForm);
            added.push(stepForm);
        });

        return added;
    }

    private fetchMissingOrStoppedAppKeys(): Q.Promise<ApplicationKey[]> {
        const applicationKeys: ApplicationKey[] = this.site?.getApplicationKeys() || [];

        if (applicationKeys.length === 0) {
            return Q.resolve([]);
        }

        return new GetApplicationsRequest(applicationKeys).sendAndParse().then((applications: Application[]) => {
            const stoppedApps: Application[] = [];
            const missingOrStoppedAppKeys: ApplicationKey[] = applicationKeys.filter((key: ApplicationKey) => {
                const app: Application = applications.find((a: Application) => a.getApplicationKey().equals(key));
                if (app?.isStopped()) {
                    stoppedApps.push(app);
                }
                return !app || app.getState() === Application.STATE_STOPPED;
            });

            this.formsContexts.forEach((context: ContentFormContext) => context.setStoppedApplications(stoppedApps));

            return missingOrStoppedAppKeys;
        });
    }

    private layoutWizardStepForms(content: Content): Q.Promise<void> {
        const contentData = content.getContentData();
        contentData.onChanged(this.dataChangedHandler);
        contentData.onChanged(this.debouncedEnonicAiDataChangedHandler);

        const formViewLayoutPromises: Q.Promise<void>[] = [];
        formViewLayoutPromises.push(
            this.contentWizardStepForm.layout(this.formsContexts.get('content'), contentData, this.contentType.getForm()));
        // Must pass FormView from contentWizardStepForm displayNameResolver,
        // since a new is created for each call to renderExisting
        this.displayNameResolver.setFormView(this.contentWizardStepForm.getFormView());

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            const promise: Q.Promise<void> = this.layoutXDataWizardStepForm(content, form);

            form.getData().onChanged(this.dataChangedHandler);

            formViewLayoutPromises.push(promise);
        });

        if (this.isPageComponentsViewRequired()) {
            this.pageComponentsWizardStepForm?.layout(this.pageComponentsView);
            this.pageComponentsView.reload();
        }

        return Q.all(formViewLayoutPromises).thenResolve(null);
    }

    private updateSiteModel(site: Site): void {
        this.unbindSiteModelListeners();
        this.siteModel.update(site);
        this.site = site;
        this.initSiteModelListeners();
        AI.get().updateInstructions(this.getApplicationsConfigs());
    }

    private initSiteModel(site: Site): SiteModel {
        this.siteModel = new SiteModel(site);

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

        this.siteModel.onSiteModelUpdated(() => {
            if (this.wizardFormUpdatedDuringSave) {
                this.formMask.show();
                handler();
            }
        });

        this.initSiteModelListeners();

        return this.siteModel;
    }

    private getXDatasToRemove(xDatas: XData[]): XData[] {
        return this.getXDataWizardSteps().filter(
            (step: XDataWizardStep) => !xDatas.some((xData: XData) => xData.getXDataName().equals(step.getXDataName()))).map(
            (step: XDataWizardStep) => step.getStepForm().getXData());
    }

    private getXDataWizardSteps(): XDataWizardStep[] {
        return this.getSteps().filter(step => {
            if (ObjectHelper.iFrameSafeInstanceOf(step, XDataWizardStep)) {
                return true;
            }

            return false;
        }) as XDataWizardStep[];
    }

    private getXDatasToAdd(xDatas: XData[]): XData[] {
        return xDatas.filter((xData: XData) => !this.xDataWizardStepForms.contains(xData.getXDataName().toString()));
    }

    private addXDataSteps(xDatas: XData[]): Q.Promise<void> {
        const content: Content = this.getPersistedItem().clone();
        const formViewLayoutPromises: Q.Promise<void>[] = [];

        const formsAdded: XDataWizardStepForm[] = this.createXDataWizardStepForms(xDatas);
        formsAdded.forEach((form: XDataWizardStepForm) => {
            this.addStep(new XDataWizardStep(form), false);
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

        return xDataStepForm.layout(this.formsContexts.get('xdata'), data, xDataForm).then(() => {
            this.syncPersistedItemWithXData(xDataStepForm.getXDataName(), data);
            return Q(null);
        });
    }

    private initLiveEditModel(content: Content): LiveEditModel {
        return LiveEditModel.create()
            .setContent(content)
            .setContentFormContext(this.formsContexts.get('live'))
            .setSiteModel(this.siteModel)
            .setDefaultTemplate(this.defaultModels)
            .build();
    }

    persistNewItem(): Q.Promise<Content> {
        return new PersistNewContentRoutine(this).setCreateContentRequestProducer(this.produceCreateContentRequest).execute().then(
            (context: RoutineContext) => {
                showFeedback(i18n('notify.content.created'));
                return context.content;
            });
    }

    postPersistNewItem(persistedContent: Content): Q.Promise<Content> {
        return Q(persistedContent);
    }

    private produceCreateContentRequest(): Q.Promise<CreateContentRequest> {
        return this.contentType.getContentTypeName().isMedia() ? Q(null) : Q.resolve(this.doCreateContentRequest());
    }

    private doCreateContentRequest(): CreateContentRequest {
        const parentPath: ContentPath = this.parentContent != null ? this.parentContent.getPath() : ContentPath.getRoot();
        return ContentHelper.makeNewContentRequest(this.contentType.getContentTypeName())
            .setParent(parentPath)
            .setRequireValid(this.requireValid);
    }

    updatePersistedItem(): Q.Promise<Content> {
        const persistedContent: Content = this.getPersistedItem();
        const viewedContent: Content = this.assembleViewedContent(persistedContent.newBuilder(), true, this.isRename).build();
        const isInherited: boolean = persistedContent.isDataInherited();

        const updateContentRoutine: UpdatePersistedContentRoutine = new UpdatePersistedContentRoutine(this, persistedContent, viewedContent)
            .setRequireValid(this.requireValid)
            .setWorkflowState(this.markedAsReady ? WorkflowState.READY : WorkflowState.IN_PROGRESS);

        return updateContentRoutine.execute().then((context: RoutineContext) => {
            const content: Content = context.content;
            this.wizardFormUpdatedDuringSave = context.dataUpdated;

            if (persistedContent.getName().isUnnamed() && !content.getName().isUnnamed()) {
                this.notifyContentNamed(content);
            }

            if (context.dataUpdated || context.pageUpdated) {
                this.showFeedbackContentSaved(content, isInherited);
            }

            return content;
        });
    }

    postUpdatePersistedItem(persistedItem: Content): Q.Promise<Content> {
        this.initFormContext(persistedItem);
        this.contentWizardStepForm.validate();
        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => form.isEnabled() ? null : form.resetData());
        this.xDataWizardStepForms.validate();
        this.displayValidationErrors(!this.isValid());

        if (!this.isRename) {
            this.resetWizard();
        }

        return Q.resolve(persistedItem);
    }

    private showFeedbackContentSaved(content: Content, wasInherited: boolean = false) {
        const name: ContentName = content.getName();
        let message: string;

        if (wasInherited) {
            message = i18n('notify.content.localized');
        } else if (name.isUnnamed()) {
            message = i18n('notify.item.savedUnnamed');
        } else if (this.isRename) {
            message = i18n('notify.wizard.contentRenamed', name);
        } else if (this.markedAsReady) {
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

        return this.hasContentChanged();
    }

    private enableDisplayNameScriptExecution(formView: FormView) {
        if (this.displayNameResolver.hasExpression()) {
            formView.onKeyUp((event: KeyboardEvent) => {
                this.getWizardHeader().setGeneratedDisplayName(this.displayNameResolver.execute());
            });
        }
    }

    private addXDataStepForms(applicationKey: ApplicationKey): Q.Promise<void> {

        this.applicationLoadCount++;
        this.formMask.show();

        return new GetApplicationXDataRequest(this.getPersistedItem().getType(), applicationKey).sendAndParse().then(
            (xDatas: XData[]) => {
                const xDatasToAdd: XData[] = xDatas.filter((xData: XData) => !this.xDataWizardStepForms.contains(xData.getName()));

                const layoutPromises = [];

                const formsAdded: XDataWizardStepForm[] = this.createXDataWizardStepForms(xDatasToAdd);
                formsAdded.forEach((form: XDataWizardStepForm) => {
                    this.addStep(new XDataWizardStep(form), false);

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

            }).catch((reason) => {
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

        return xDataStepForm.layout(this.formsContexts.get('xdata'), data, xDataForm);
    }

    private removeXDataStepForms(applicationKey: ApplicationKey): Q.Promise<number> {
        this.missingOrStoppedAppKeys = [];
        this.applicationLoadCount++;
        this.formMask.show();

        return new GetApplicationXDataRequest(this.getPersistedItem().getType(), applicationKey).sendAndParse().then(
            (xDatasToRemove: XData[]) => {
                this.formMask.show();
                this.removeXDataSteps(xDatasToRemove);
                return xDatasToRemove.length;
            }).finally(() => {
            if (--this.applicationLoadCount === 0) {
                this.formMask.hide();
            }
        });
    }

    private assembleViewedPage(): Page {
        return PageState.getState();
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

    setMarkedAsReady(value: boolean) {
        this.markedAsReady = value;
    }

    isMarkedAsReady(): boolean {
        return this.markedAsReady;
    }

    showForm(): void {
        this.wizardActions.getShowFormAction().execute();
    }

    showLiveEdit(): void {
        this.wizardActions.getShowLiveEditAction().execute();
    }

    private isSplitView(): boolean {
        return this.splitPanel && this.splitPanel.hasClass('toggle-split');
    }

    private isLiveView(): boolean {
        return this.splitPanel && this.splitPanel.hasClass('toggle-live');
    }

    hasContentChanged(): boolean {
        const contentBuilder: ContentBuilder = this.getPersistedItem().newBuilderWithoutProperties();
        const viewedContent = this.assembleViewedContent(contentBuilder).build();

        return !viewedContent.equals(this.contentAfterLayout);
    }

    assembleViewedContent(viewedContentBuilder: ContentBuilder, cleanFormRedundantData: boolean = false,
                          isRename?: boolean): ContentBuilder {
        viewedContentBuilder.setName(this.resolveContentNameForUpdateRequest());

        if (isRename) {
            return viewedContentBuilder;
        }

        viewedContentBuilder.setDisplayName(this.getWizardHeader().getDisplayName());

        if (this.contentWizardStepForm) {
            if (!cleanFormRedundantData) {
                viewedContentBuilder.setData(this.contentWizardStepForm.getData());
            } else {
                const data: PropertyTree = new PropertyTree(this.contentWizardStepForm.getData().getRoot()); // copy
                viewedContentBuilder.setData(data);
            }
        }

        const extraData: ExtraData[] = [];

        this.xDataWizardStepForms.forEach((form: XDataWizardStepForm) => {
            extraData.push(new ExtraData(new XDataName(form.getXDataNameAsString()), form.getData().copy()));
        });

        viewedContentBuilder.setExtraData(extraData);

        viewedContentBuilder.setPage(this.assembleViewedPage()?.clone());

        return viewedContentBuilder;
    }

    private displayValidationErrors(value: boolean) {
        this.contentWizardStepForm.displayValidationErrors(value);
        this.xDataWizardStepForms.displayValidationErrors(value);
    }

    getContentWizardToolbarPublishControls(): ContentWizardToolbarPublishControls {
        return this.getMainToolbar().getContentWizardToolbarPublishControls();
    }

    getCycleViewModeButton(): ContentActionCycleButton {
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
        return ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(this.getPersistedItem(), this.currentCompareStatus,
            this.currentPublishStatus);
    }

    getCompareStatus(): CompareStatus {
        return this.currentCompareStatus;
    }

    getPublishStatus(): PublishStatus {
        return this.currentPublishStatus;
    }

    private notifyContentNamed(content: Content) {
        this.contentNamedListeners.forEach((listener: (event: ContentNamedEvent) => void) => {
            listener.call(this, new ContentNamedEvent(this, content));
        });
    }

    private initFormContext(persistedItem: Content) {
        const content: Content = persistedItem.clone();

        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.initFormContext');
        }

        if (this.formsContexts.size === 0) {
            this.initFormsContexts(content);
        }

        this.formsContexts.forEach((formContext: ContentFormContext) => {
            formContext
                .setSite(this.site)
                .setPersistedContent(content);
            formContext.setFormState(this.formState);
            formContext.setShowEmptyFormItemSetOccurrences(this.isItemPersisted());
            formContext.setLanguage(content.getLanguage());
            formContext.setValidationErrors(content.getValidationErrors().filter(ValidationErrorHelper.isCustomError));
        });
    }

    setEnabled(value: boolean) {
        super.setEnabled(value);

        this.getEl().toggleClass('no-modify-permissions', !value);
        this.getLivePanel()?.setEnabled(value);
        this.pageComponentsView?.setEnabled(value);
    }

    isReadOnly(): boolean {
        return !this.canModify;
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

            form.getData().unChanged(this.dataChangedHandler);

            const data: PropertyTree = extraData ? extraData.getData() : new PropertyTree();
            data.onChanged(this.dataChangedHandler);

            form.resetState(data);

            if (form.isEnabled()) {
                form.update(data, unchangedOnly);
            } else {
                form.resetData();
            }

            const viewedData: PropertyTree = form.getData().copy();

            if (!form.isOptional() || !extraData || extraData.getData().getRoot().getSize() > 0) {
                this.syncPersistedItemWithXData(xDataName, form.isEnabled() ? viewedData : new PropertyTree());
            }

        });
    }

    private updateWizardStepForms(propertyTree: PropertyTree, unchangedOnly: boolean = true): Q.Promise<void> {
        this.contentWizardStepForm.getData().unChanged(this.dataChangedHandler);
        this.contentWizardStepForm.getData().unChanged(this.debouncedEnonicAiDataChangedHandler);

        propertyTree.onChanged(this.dataChangedHandler);
        propertyTree.onChanged(this.debouncedEnonicAiDataChangedHandler);

        return this.contentWizardStepForm.update(propertyTree, unchangedOnly).then(() => {
            setTimeout(this.contentWizardStepForm.validate.bind(this.contentWizardStepForm), 100);
        });
    }

    private checkIfRenderable(item?: ContentSummary): Q.Promise<boolean> {
        return new IsRenderableRequest(item || this.getPersistedItem(), RenderingMode.EDIT).sendAndParse().then((statusCode: number) => {
            const renderable = statusCode === StatusCode.OK;
            this.renderable = renderable;
            this.contextView?.setIsPageRenderable(renderable);
            this.livePanel?.setIsRenderable(renderable);

            return renderable;
        });
    }

    public isContentDeleted(): boolean {
        return this.contentDeleted;
    }

    private shouldOpenEditorByDefault(): boolean {
        const isTemplate: boolean = this.contentType.getContentTypeName().isPageTemplate();
        const isSite: boolean = this.contentType.getContentTypeName().isSite();

        return this.isRenderable() || isSite || isTemplate;
    }

    private isEditorEnabled(): boolean {
        return !!this.site || (this.shouldOpenEditorByDefault() && !ArrayHelper.contains(ContentWizardPanel.EDITOR_DISABLED_TYPES,
            this.contentType.getContentTypeName()));
    }

    private updateButtonsState(): Q.Promise<void> {
        // this.wizardActions.getSaveAction().setEnabled(this.name());

        return this.checkIfRenderable().then(() => {
            this.wizardActions.getPreviewAction().setEnabled(this.isRenderable());

            return this.wizardActions.refreshPendingDeleteDecorations().then(() => {
                this.contextView.updateWidgetsVisibility();
            });
        });
    }

    private updatePublishStatusOnDataChange() {
        if (this.isContentFormValid) {
            const hasUnsavedChanges: boolean = this.hasUnsavedChanges();
            if (!hasUnsavedChanges) {
                // WARN: intended to restore status to persisted value if data is changed to original values,
                // but if invoked after save this will revert status to persisted one as well
                this.currentCompareStatus = this.persistedCompareStatus;
                this.currentPublishStatus = this.persistedPublishStatus;

            } else {
                if (this.wizardActions.isOnline()) {
                    this.currentCompareStatus = CompareStatus.NEWER;
                }
            }
            this.getMainToolbar().setItem(this.getContent());
            this.wizardActions.setContent(this.getContent()).refreshState();
            this.workflowStateManager.update();
        }
    }

    getLiveMask(): LoadMask {
        return this.liveMask;
    }

    onFormPanelAdded() {
        super.onFormPanelAdded(!this.isSplitEditModeActive());
    }

    onPageStateChanged(listener: () => void) {
        PageState.getEvents().onPageReset(listener);
        PageState.getEvents().onPageUpdated(listener);
        PageState.getEvents().onPageConfigUpdated(listener);
        PageState.getEvents().onComponentUpdated(listener);
        PageState.getEvents().onComponentAdded(listener);
        PageState.getEvents().onComponentRemoved(listener);
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

    private updateUrlAction() {
        const action: string = UrlAction.EDIT;
        Router.get().setPath(UrlHelper.createContentEditUrl(this.getPersistedItem().getId(), action));
        window.name = `${action}:${ProjectContext.get().getProject().getName()}:${this.getPersistedItem().getId()}`;
    }

    protected setPersistedItem(newPersistedItem: Content): void {
        super.setPersistedItem(newPersistedItem);
        this.contentAfterLayout = this.getPersistedItem();

        this.wizardHeader?.setPersistedPath(newPersistedItem);
        AI.get().setContent(newPersistedItem);
    }

    isHeaderValidForSaving(): boolean {
        return !this.getWizardHeader() || this.getWizardHeader().isValidForSaving();
    }

    private setPersistedContent(content: ContentSummaryAndCompareStatus) {
        ContentContext.get().setContent(content);
        this.persistedPublishStatus = content.getPublishStatus();
        this.persistedCompareStatus = content.getCompareStatus();
        this.peristedLanguage = content.getLanguage();

        this.wizardHeader?.setOnline(!content.isNew());
        this.wizardHeader?.setPath(this.getWizardHeaderPath());
        this.wizardHeader?.setDir(Locale.supportsRtl(content.getLanguage()) ? LangDirection.RTL : LangDirection.AUTO);
        this.contextView?.setItem(content).then(() => this.contextView.updateWidgetsVisibility());
    }

    protected checkIfEditIsAllowed(): Q.Promise<boolean> {
        if (this.getPersistedItem().isDataInherited()) {
            return Q.resolve(false);
        }

        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const hasModifyPermissions: boolean =
                ContentHelper.isAnyPrincipalAllowed(this.getPersistedItem().getPermissions(), loginResult.getPrincipals(),
                    Permission.MODIFY);

            if (!hasModifyPermissions) {
                NotifyManager.get().showFeedback(i18n('notify.item.readonly'));
            }

            return hasModifyPermissions && !this.getPersistedItem().isDataInherited();
        });
    }

    protected handleCanModify(canModify: boolean): void {
        super.handleCanModify(canModify);

        this.updateUrlAction();
    }

    private handleCUD() {
        IsRenderableRequest.clearCache();
    }

    isContentExistsInParentProject(): boolean {
        return !!this.contentExistsInParentProject;
    }

    isMinimized(): boolean {
        return this.minimized;
    }

    isRenderable(): boolean {
        return this.renderable;
    }

    protected calcNavigationWidth(): number {
        if (this.minimized) {
            return this.splitPanel.getEl().getHeight() + this.stepNavigatorAndToolbarContainer.getEl().getPaddingLeft();
        }

        return super.calcNavigationWidth();
    }

    isInMobileViewMode(): boolean {
        return this.inMobileViewMode;
    }

    getSplitPanel(): SplitPanel {
        return this.splitPanel;
    }

    isTranslatable(): boolean {
        return this.isContentExistsInParentProject() && this.getContent().hasOriginProject() &&
               !!ProjectContext.get().getProject().getLanguage();
    }

    private isPageComponentsViewRequired(): boolean {
        return this.livePanel && (PageState.getState()?.hasController() || PageState.getState()?.isFragment());
    }

    private togglePageComponentsViewOnDemand() {
        if (this.isPageComponentsViewRequired()) {
            this.addPCV();
        } else {
            this.removePCV();
        }
    }

    private addPCV(): void {
        if (!this.pageComponentsWizardStepForm) {
            this.pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            this.pageComponentsWizardStep = this.initPageComponentsWizardStep();
        }

        if (!this.pageComponentsView.isAdded()) {
            this.pageComponentsWizardStepForm.layout(this.pageComponentsView);
        }

        if (!this.getSteps().some((step: WizardStep) => step === this.pageComponentsWizardStep)) {
            this.addStep(this.pageComponentsWizardStep, false);
            // bug in lib-admin-ui WizardPanel addStep method: it doesn't add step to steps array
            this.getSteps().push(this.pageComponentsWizardStep);

            if (this.isMinimized()) {
                this.undockPCV();
            }
        }
    }

    private removePCV(): void {
        if (this.pageComponentsWizardStepForm) {
            this.pageComponentsView.dock();

            if (this.contentType.isPageTemplate()) {
                this.pageComponentsWizardStepForm.removeChild(this.pageComponentsView);
            } else {
                this.removeStepWithForm(this.pageComponentsWizardStepForm);
            }
        }
    }

    private undockPCV(): void {
        if (this.isPageComponentsViewRequired()) {
            this.pageComponentsView?.undock();
        }
    }

    private dockPCV(): void {
        if (this.isPageComponentsViewRequired()) {
            this.pageComponentsView?.dock();
        }
    }

    private getInitialPageWizardStepName(): string {
        if (this.contentType.getContentTypeName().isFragment()) {
            return i18n('field.fragment');
        }

        if (this.contentType.isPageTemplate()) {
            return this.contentType.getDisplayName();
        }

        return i18n('field.page');
    }

    private initPageComponentsWizardStep(): PageComponentsWizardStep {
        if (!this.pageComponentsWizardStepForm) {
            throw new Error('PageComponentsWizardStepForm is not initialized');
        }

        this.pageComponentsWizardStep =
            new PageComponentsWizardStep(this.getInitialPageWizardStepName(), this.pageComponentsWizardStepForm);

        return this.pageComponentsWizardStep;
    }

    private getTemplateForCustomize(): Q.Promise<PageTemplate> {
        const currentTemplateKey = PageState.getState()?.getTemplate();

        if (currentTemplateKey && !currentTemplateKey.equals(this.defaultModels.getDefaultPageTemplate()?.getKey())) {
            return new GetPageTemplateByKeyRequest(currentTemplateKey).sendAndParse();
        }

        return Q.resolve(this.defaultModels.getDefaultPageTemplate());
    }

    protected createWizardStepsPanel(): WizardStepsPanel {
        return new ContentWizardStepsPanel(this.stepNavigator, this.formPanel);
    }

    private updateMissingOrStoppedApplications(): Q.Promise<void> {
        return this.fetchMissingOrStoppedAppKeys().then((missingApps: ApplicationKey[]) => {
            this.missingOrStoppedAppKeys = missingApps;
            this.getLivePanel()?.setHasMissingApps(this.missingOrStoppedAppKeys.length > 0);
        });
    }

    private handleMissingOrStoppedApplicationsChange(): void {
        const currentAppsCount = this.missingOrStoppedAppKeys?.length ?? 0;

        this.updateMissingOrStoppedApplications().then(() => {
            const fetchedAppCount = this.missingOrStoppedAppKeys.length;

            if (currentAppsCount !== fetchedAppCount) { // can also sort arrays and check array equality
                this.debouncedAppsChangeHandler();
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private isReloadLiveEditRequired(diff: ContentDiff): boolean {
        return !!diff.data || !!diff.pageObj || !!diff.extraData || !!diff.path || !!diff.displayName || !!diff.name || !!diff.inherit;
    }

    private getApplicationsConfigs(): ApplicationConfig[] {
        return [...(this.site?.getSiteConfigs() ?? []), ...ProjectContext.get().getProject().getSiteConfigs()];
    }

    private initFormsContexts(content: Content): void {
        const type: ContentTypeName = this.contentType?.getContentTypeName() || content.getType();

        const contentFormContext = ContentFormContext.create()
            .setContentTypeName(type)
            .setAiEditable(true)
            .setValidationErrors(content.getValidationErrors().filter(ValidationErrorHelper.isCustomError))
            .build();

        const xDataFormContext = ContentFormContext.create()
            .setContentTypeName(type)
            .setAiEditable(false)
            .setValidationErrors(content.getValidationErrors().filter(ValidationErrorHelper.isCustomError))
            .build();

        const liveFormContext = ContentFormContext.create()
            .setContentTypeName(type)
            .setAiEditable(false)
            .setValidationErrors(content.getValidationErrors().filter(ValidationErrorHelper.isCustomError))
            .build();

        this.formsContexts.set('content', contentFormContext);
        this.formsContexts.set('xdata', xDataFormContext);
        this.formsContexts.set('live', liveFormContext);
    }

    renderAndOpenTranslatorDialog(): void {
        if (!this.isTranslatable()) {
            return;
        }

        const aiTranslatorContainer = new DivEl('ai-translator-container');
        Body.get().appendChild(aiTranslatorContainer);
        AI.get().renderTranslator(aiTranslatorContainer.getHTMLElement());

        AI.get().whenReady(() => {
            new AiTranslatorOpenDialogEvent().fire();
        });
    }
}
