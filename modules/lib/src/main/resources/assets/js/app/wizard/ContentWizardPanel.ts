import {MinimizeWizardPanelEvent} from '@enonic/lib-admin-ui/app/wizard/MinimizeWizardPanelEvent';
import {type WizardHeader} from '@enonic/lib-admin-ui/app/wizard/WizardHeader';
import {WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {type WizardStepsPanel} from '@enonic/lib-admin-ui/app/wizard/WizardStepsPanel';
import {type ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {type Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {type SplitPanel, SplitPanelAlignment, SplitPanelBuilder} from '@enonic/lib-admin-ui/ui/panel/SplitPanel';
import {SplitPanelSize} from '@enonic/lib-admin-ui/ui/panel/SplitPanelSize';
import {type ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {type Toolbar, type ToolbarConfig} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {type UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ValidityChangedEvent} from '@enonic/lib-admin-ui/ValidityChangedEvent';
import Q from 'q';
import {LiveEditModel} from '../../page-editor/LiveEditModel';
import {compareContent} from '../../v6/features/api/compare';
import {cleanupWizardMixinsService, initWizardMixinsService} from '../../v6/features/services/wizardMixins.service';
import {setWizardContent} from '../../v6/features/store/context/contextContent.store';
import {$isContextOpen, setContextOpen} from '../../v6/features/store/contextWidgets.store';
import {
    $displayNameInputFocusRequested,
    $isContentFormExpanded,
    $wizardHasChanges,
    $wizardIsMarkedAsReady,
    clearDisplayNameInputFocusRequest,
    initializeWizardContentState,
    requestDisplayNameInputFocus,
    resetWizardContent,
    setContentFormExpanded,
    setContentType as setWizardContentType,
    setDraftPage,
    setPersistedContent as setWizardPersistedContent,
    setWizardMarkedAsReady,
    setWizardReadOnly,
} from '../../v6/features/store/wizardContent.store';
import {escalateVisibility, initializeValidation, setServerValidationErrors} from '../../v6/features/store/wizardValidation.store';
import {calcSecondaryStatus, calcTreePublishStatus} from '../../v6/features/utils/cms/content/status';
import {type PreviewToolbarElement} from '../../v6/features/views/browse/layout/preview/PreviewToolbar';
import {ContentWizardTabsToolbarElement} from '../../v6/features/views/wizard/content-wizard-tabs/ContentWizardTabsToolbarElement';
import {Permission} from '../access/Permission';
import {AI} from '../ai/AI';
import {AiTranslatorOpenDialogEvent} from '../ai/event/outgoing/AiTranslatorOpenDialogEvent';
import {ContentWizardToolbar} from '../browse/ContentWizardToolbar';
import {type MovedContentItem} from '../browse/MovedContentItem';
import {type CompareStatus} from '../content/CompareStatus';
import {type Content} from '../content/Content';
import {ContentIconUrlResolver} from '../content/ContentIconUrlResolver';
import {type ContentId} from '../content/ContentId';
import {type ContentName} from '../content/ContentName';
import {ContentPath} from '../content/ContentPath';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {type PageTemplate} from '../content/PageTemplate';
import {type Site} from '../content/Site';
import {BeforeContentSavedEvent} from '../event/BeforeContentSavedEvent';
import {ContentLanguageUpdatedEvent} from '../event/ContentLanguageUpdatedEvent';
import {type ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ViewExtensionEvent} from '../event/ViewExtensionEvent';
import {type ContentType} from '../inputtype/schema/ContentType';
import {ImageErrorEvent} from '../inputtype/ui/selector/image/ImageErrorEvent';
import {PageControllerCustomizedEvent} from '../page/event/PageControllerCustomizedEvent';
import {PageControllerUpdatedEvent} from '../page/event/PageControllerUpdatedEvent';
import {type PageUpdatedEvent} from '../page/event/PageUpdatedEvent';
import {type Page} from '../page/Page';
import {ProjectContext} from '../project/ProjectContext';
import {type PublishStatus} from '../publish/PublishStatus';
import {RepositoryId} from '../repository/RepositoryId';
import {ContentsExistRequest} from '../resource/ContentsExistRequest';
import {type ContentsExistResult} from '../resource/ContentsExistResult';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {type CreateContentRequest} from '../resource/CreateContentRequest';
import {GetPageTemplateByKeyRequest} from '../resource/GetPageTemplateByKeyRequest';
import {Router} from '../Router';
import {ProjectDeletedEvent} from '../settings/event/ProjectDeletedEvent';
import {type SiteModel} from '../site/SiteModel';
import {UrlAction} from '../UrlAction';
import {ContentHelper} from '../util/ContentHelper';
import {PageHelper} from '../util/PageHelper';
import {UrlHelper} from '../util/UrlHelper';
import {NonMobileContextPanelToggleButton} from '../view/context/button/NonMobileContextPanelToggleButton';
import {ContextPanelState} from '../view/context/ContextPanelState';
import {type ContextPanelMode} from '../view/context/ContextSplitPanel';
import {ContextView} from '../view/context/ContextView';
import {DockedContextPanel} from '../view/context/DockedContextPanel';
import {AccessControlHelper} from './AccessControlHelper';
import {ContentWizardActions} from './action/ContentWizardActions';
import {ContentContext} from './ContentContext';
import {ContentWizardContextSplitPanel} from './ContentWizardContextSplitPanel';
import {ContentWizardDataLoader} from './ContentWizardDataLoader';
import {ContentWizardHeader} from './ContentWizardHeader';
import {type ContentWizardPanelParams} from './ContentWizardPanelParams';
import {ContentWizardStepsPanel} from './ContentWizardStepsPanel';
import {type ContentWizardToolbarPublishControls} from './ContentWizardToolbarPublishControls';
import {DisplayNameResolver} from './DisplayNameResolver';
import {type RoutineContext} from './Flow';
import {MaskContentWizardPanelEvent} from './MaskContentWizardPanelEvent';
import {type DefaultModels} from './page/DefaultModels';
import {LiveEditPageProxy} from './page/LiveEditPageProxy';
import {LiveFormPanel, type LiveFormPanelConfig} from './page/LiveFormPanel';
import {PageState} from './page/PageState';
import {PageStateEvent} from '../../page-editor/event/incoming/common/PageStateEvent';
import {PageEventsManager} from './PageEventsManager';
import {PersistNewContentRoutine} from './PersistNewContentRoutine';
import {ThumbnailUploaderEl} from './ThumbnailUploaderEl';
import {UpdatePersistedContentWithStoreRoutine} from './UpdatePersistedContentWithStoreRoutine';

export class ContentWizardPanel
    extends WizardPanel<Content> {

    private contextSplitPanel: ContentWizardContextSplitPanel;

    private contextView: ContextView;

    private livePanel?: LiveFormPanel;

    private liveEditPage?: LiveEditPageProxy;

    declare protected wizardActions: ContentWizardActions;

    declare protected params: ContentWizardPanelParams;

    declare protected wizardHeader: ContentWizardHeader;

    private parentContent: Content;

    private contentExistsInParentProject: boolean;

    private defaultModels: DefaultModels;

    private site: Site;

    private contentType: ContentType;

    private siteModel: SiteModel;

    private liveEditModel: LiveEditModel;

    private displayNameResolver: DisplayNameResolver;

    private splitPanel?: SplitPanel;

    private requireValid: boolean;

    private isContentFormValid: boolean;

    private inMobileViewMode: boolean;

    private currentCompareStatus: CompareStatus;

    private currentPublishStatus: PublishStatus;

    private persistedCompareStatus: CompareStatus;

    private splitPanelThreshold: number = 960;

    private minimized: boolean = false;

    private minimizedFromFormOnly: boolean = false;

    private isTogglingMinimize: boolean = false;

    private contentUpdateDisabled: boolean;

    private contentDeleted: boolean;

    private reloadPageEditorOnSave: boolean = true;

    private debouncedEditorReload: (clearInspection?: boolean, toggleLiveEdit?: boolean, skipConfirmation?: boolean) => void;

    private isFirstUpdateAndRenameEventSkiped: boolean;

    public static debug: boolean = false;

    private contentFetcher: ContentSummaryAndCompareStatusFetcher;

    private isRename: boolean;

    private contentFormExpandedUnsubscribe?: () => void;

    constructor(params: ContentWizardPanelParams, cls?: string) {
        super(params);

        if (cls) {
            this.addClass(cls);
        }

        initWizardMixinsService();
        this.onClosed(() => cleanupWizardMixinsService());

        this.loadData();
        this.initBindings();
    }

    protected initElements() {
        super.initElements();

        this.isContentFormValid = false;
        this.requireValid = false;
        this.contentUpdateDisabled = false;
        this.isFirstUpdateAndRenameEventSkiped = false;
        this.displayNameResolver = new DisplayNameResolver();

        this.debouncedEditorReload = AppHelper.debounce((clearInspection: boolean, toggleLiveEdit: boolean, skipConfirmation: boolean) => {
            this.isRenderable().then((wasRenderable: boolean) => {

                this.livePanel.skipNextReloadConfirmation(skipConfirmation);

                this.livePanel.loadPage(clearInspection)
                    .then((isRenderable) => {
                        if (wasRenderable !== isRenderable) {
                            return this.refreshLivePanel(this.getCurrentItem());
                        }
                    })
                    .then(() => {
                        if (toggleLiveEdit) {
                            return this.toggleLiveEdit();
                        }
                    });
            });
        }, 200);

        this.contentFetcher = new ContentSummaryAndCompareStatusFetcher();
    }

    private initBindings() {
        const nextActions = this.getActions();
        const currentKeyBindings = Action.getKeyBindings(nextActions);
        KeyBindings.get().bindKeys(currentKeyBindings);
    }

    protected initEventsListeners() {
        super.initEventsListeners();

        this.listenToContentEvents();
        this.handleBrokenImageInTheWizard();

        ContentLanguageUpdatedEvent.on((event: ContentLanguageUpdatedEvent) => {
            this.renderAndOpenTranslatorDialog(event.getLanguage());
        });
    }

    toggleMinimize() {
        this.minimized = !this.minimized;
        this.splitPanel.setSplitterIsHidden(this.minimized);
        this.formPanel.toggleClass('minimized');

        new MinimizeWizardPanelEvent().fire();

        this.isTogglingMinimize = true;

        if (this.minimized) {
            this.formPanel.addClass('border-r border-bdr-soft');

            this.minimizedFromFormOnly = this.splitPanel.hasClass('toggle-form');
            if (this.minimizedFromFormOnly) {
                this.splitPanel.removeClass('toggle-form').addClass('toggle-split');
                this.splitPanel.showSecondPanel();
            }

            this.splitPanel.savePanelSizesAndDistribute(SplitPanelSize.PIXELS(60));
            this.splitPanel.hideSplitter();
        } else {
            if (this.minimizedFromFormOnly) {
                this.splitPanel.removeClass('toggle-split').addClass('toggle-form');
                this.splitPanel.hideSecondPanel();
                this.minimizedFromFormOnly = false;
            }

            this.splitPanel.loadPanelSizesAndDistribute();
            this.formPanel.removeClass('border-r border-bdr-soft');

            if (!this.splitPanel.isSecondPanelHidden()) {
                this.splitPanel.showSplitter();
            }
        }

        const maximized = !this.minimized;
        if (this.helpTextToggleButton) {
            this.helpTextToggleButton.setVisible(maximized);
        }

        setContentFormExpanded(!this.minimized);

        // Reset after a tick so the debounced resize handler from distribute() is suppressed
        setTimeout(() => {
            this.isTogglingMinimize = false;
        });
    }

    protected createWizardActions(): ContentWizardActions {
        const wizardActions: ContentWizardActions = new ContentWizardActions(this);

        const publishActionHandler = () => {
            if (this.hasUnsavedChanges()) {
                escalateVisibility('all');
            }
        };

        wizardActions.getPublishAction().onExecuted(publishActionHandler);
        wizardActions.getUnpublishAction().onExecuted(publishActionHandler);
        wizardActions.getPublishTreeAction().onExecuted(publishActionHandler);

        return wizardActions;
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
                this.currentCompareStatus = loader.compareStatus;
                this.currentPublishStatus = loader.publishStatus;

                AI.get().setContentType(this.contentType);
                AI.get().updateInstructions(this.getApplicationsConfigs());
                AI.get().setCompareStatus(this.persistedCompareStatus);
            })
            .then(() => super.doLoadData())
            .finally(() => {
                // persisted item is always present now
                // for existing content it was loaded
                // for new content it was saved in super.doLoadData()
                const currentItem: Content = this.getCurrentItem();
                this.liveEditModel = this.initLiveEditModel(currentItem);

                return this.loadAndSetPageState(currentItem.getPage()?.clone());
            });
    }

    private loadAndSetPageState(page: Page): Q.Promise<void> {
        const pagePromise: Q.Promise<Page | null> = page ? PageHelper.injectEmptyRegionsIntoPage(page) : Q.resolve(null);

        return pagePromise.then((page: Page | null) => {
            PageState.setState(page);
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

    protected createMainToolbar(): Toolbar<ToolbarConfig> {
        return new ContentWizardToolbar({
            actions: this.wizardActions,
            onContentRenameConfirmed: () => {
                this.isRename = true;
            },
        }) as unknown as Toolbar<ToolbarConfig>;
    }

    public getContentWizardToolbar(): ContentWizardToolbar {
        return super.getMainToolbar() as unknown as ContentWizardToolbar;
    }

    private getWidgetToolbar(): PreviewToolbarElement {
        return this.getLivePanel().getFrameContainer().getToolbar();
    }

    protected createWizardHeader(): WizardHeader {
        return new ContentWizardHeader();
    }

    public getLivePanel(): LiveFormPanel {
        return this.livePanel;
    }

    protected createWizardAndDetailsSplitPanel(leftPanel: Panel): SplitPanel {
        this.contextView = new ContextView(!!this.livePanel);

        this.contextView.setItem(this.getContent());
        setWizardContent(this.getContent().getContentSummary());

        const rightPanel: DockedContextPanel = new DockedContextPanel(this.contextView);
        const contextToggleButton = new NonMobileContextPanelToggleButton();

        this.contextSplitPanel = ContentWizardContextSplitPanel.create(leftPanel, rightPanel)
            .setSecondPanelSize(SplitPanelSize.PERCENTS(this.livePanel ? 16 : 38))
            .setContextView(this.contextView)
            .setLiveFormPanel(this.getLivePanel())
            .setWizardFormPanel(this.formPanel)
            .setToggleButton(contextToggleButton)
            .build();

        this.contextSplitPanel.hideSecondPanel();

        // Backward compatibility with legacy context panel while React toggle controls store state.
        setContextOpen(this.contextSplitPanel.getState() === ContextPanelState.EXPANDED);

        this.contextSplitPanel.onStateChanged((state: ContextPanelState) => {
            setContextOpen(state === ContextPanelState.EXPANDED);
        });

        $isContextOpen.subscribe((isOpen: boolean, wasOpen: boolean) => {
            if (isOpen === wasOpen) {
                return;
            }

            if (isOpen) {
                this.contextSplitPanel.showContextPanel();
            } else {
                this.contextSplitPanel.hideContextPanel();
            }
        });

        if (this.livePanel) {
            this.splitPanel.onPanelResized(() => this.updateStickyToolbar());
            this.livePanel.setToggleContextPanelHandler(() => {
               this.contextSplitPanel.toggleContextPanel();
            });

            this.contextSplitPanel.onModeChanged((mode: ContextPanelMode) => {
                if (!this.isMinimized()) {
                    const formPanelSizePercents: number = this.contextSplitPanel.isDockedMode() ? 46 : 38;
                    this.splitPanel.setFirstPanelSize(SplitPanelSize.PERCENTS(formPanelSizePercents));
                    this.splitPanel.distribute(true);
                }
            });

            setContextOpen(this.contextSplitPanel.getState() === ContextPanelState.EXPANDED);

            this.contextSplitPanel.onStateChanged((state: ContextPanelState) => {
                setContextOpen(state === ContextPanelState.EXPANDED);
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

        this.contentFormExpandedUnsubscribe = $isContentFormExpanded.listen((isExpanded) => {
            if (isExpanded === this.minimized) {
                this.toggleMinimize();
            }
        });

        return this.contextSplitPanel;
    }

    private createLivePanel(): LiveFormPanel {
        this.liveEditPage = new LiveEditPageProxy(this.liveEditModel);

        const liveFormPanel: LiveFormPanel = new LiveFormPanel({
            contentWizardPanel: this,
            contentType: this.contentType,
            liveEditPage: this.liveEditPage,
            liveEditModel: this.liveEditModel,
        } as LiveFormPanelConfig);

        this.wizardActions.getShowLiveEditAction().setEnabled(true);

        liveFormPanel.whenRendered(() => {
            if (ContentWizardPanel.debug) {
                console.debug('WizardPanel: livePanel.onRendered');
            }

            liveFormPanel.removeClass('rendering');
        });

        liveFormPanel.onRenderableChanged((renderable: boolean) => {
            PageEventsManager.get().notifyRenderableChanged(renderable);
        });

        return liveFormPanel;
    }

    private isWithinSite(): boolean {
        const isSiteOrWithinSite: boolean = !!this.site || this.params.createSite;
        const isPageTemplate: boolean = this.getContentTypeName().isPageTemplate() ?? false;

        return isSiteOrWithinSite || isPageTemplate;
    }

    getWizardActions(): ContentWizardActions {
        return super.getWizardActions() as ContentWizardActions;
    }

    doRenderOnDataLoaded(rendered: boolean): Q.Promise<boolean> {
        this.initListeners();

        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.doRenderOnDataLoaded at ' + new Date().toISOString());
        }

        // always create live panel because
        // JSON widget is always able to render content
        this.livePanel = this.createLivePanel();
        this.liveMask = new LoadMask(this.livePanel).addClass('live-load-mask') as LoadMask;

        return super.doRenderOnDataLoaded(rendered).then(() => {
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doRenderOnDataLoaded continue at ' + new Date().toISOString());
            }

            this.getContentWizardToolbar().setItem(this.getContent());
            this.appendChild(this.getContentWizardToolbarPublishControls().getMobilePublishControls());

            if (this.contentType?.hasDisplayNameExpression()) {
                this.displayNameResolver.setExpression(this.contentType.getDisplayNameExpression());
            }

            this.addClass('content-wizard-panel');

            this.inMobileViewMode = false;

            ResponsiveManager.onAvailableSizeChanged(this, this.availableSizeChangedHandler.bind(this));

            this.onRemoved(() => {
                ResponsiveManager.unAvailableSizeChanged(this);
                this.wizardActions.cleanupUnsavedChangesListeners();
                this.contentFormExpandedUnsubscribe?.();
                this.contentFormExpandedUnsubscribe = undefined;
                resetWizardContent();
            });

            const thumbnailUploader: ThumbnailUploaderEl = this.getFormIcon();

            this.onValidityChanged((event: ValidityChangedEvent) => {
                const isThisValid: boolean = this.isValid();
                this.isContentFormValid = isThisValid;

                if (!this.getPersistedItem()) {
                    return;
                }

                this.wizardActions
                    .setContentCanBePublished(this.checkContentCanBePublished())
                    .setIsValid(isThisValid)
                    .refreshState();
            });

            thumbnailUploader.setEnabled(this.contentType ? !this.contentType?.isImage() : false);
            thumbnailUploader.onFileUploaded(this.onFileUploaded.bind(this));
            thumbnailUploader.toggleClass('icon-variant', this.getPersistedItem().isVariant());

            this.getContentWizardToolbarPublishControls().getPublishButton().onPublishRequestActionChanged((added: boolean) => {
                this.wizardActions.setHasPublishRequest(added);
                this.wizardActions.refreshState();
            });

            if (this.livePanel) {
                this.livePanel.addClass('rendering');
                ResponsiveManager.onAvailableSizeChanged(this.formPanel);
            }

            if (this.params.createSite || this.getPersistedItem().isSite()) {
                thumbnailUploader.addClass('site');
            }

            this.stepNavigatorAndToolbarContainer?.getParentElement()?.remove(); // removing legacy nav bar

            return rendered;
        });
    }

    protected prepareMainPanel(): Panel {
        this.formPanel.addClass('content-wizard-form-panel px-5 py-3');

        if (this.getPersistedItem()) {
            initializeWizardContentState(
                this.getPersistedItem(),
                this.contentType ?? null,
                [],
            );
            initializeValidation(this.isNew());
            setServerValidationErrors(this.getPersistedItem().getValidationErrors());
        } else if (this.contentType) {
            setWizardContentType(this.contentType);
        }

        setWizardReadOnly(this.isReadOnly());
        if ($displayNameInputFocusRequested.get()) {
            clearDisplayNameInputFocusRequest();
        }

        this.formPanel.prependChild(new ContentWizardTabsToolbarElement());

        this.onPageStateChanged(() => this.updateTabsElement());

        const leftPanel: Panel = this.createSplitFormAndLivePanel(this.formPanel, this.livePanel);
        return this.createWizardAndDetailsSplitPanel(leftPanel);
    }

    private createSplitFormAndLivePanel(firstPanel: Panel, secondPanel: Panel): SplitPanel {
        const builder: SplitPanelBuilder = new SplitPanelBuilder(firstPanel, secondPanel)
            .setFirstPanelMinSize(SplitPanelSize.PIXELS(280))
            .setSplitterThickness(1)
            .setAlignment(SplitPanelAlignment.VERTICAL);

        if ($(window).width() > this.splitPanelThreshold) {
            builder.setFirstPanelSize(SplitPanelSize.PERCENTS(38));
        }

        this.splitPanel = builder.build();

        //TODO: add option to render panel hidden to the builder
        this.splitPanel.hideSecondPanel();
        this.splitPanel.addClass('wizard-and-preview');

        return this.splitPanel;
    }

    isNew(): boolean {
        return this.formState.isNew();
    }

    private refreshLivePanel(content: Content): Q.Promise<void> {

        return this.isRenderable().then((renderable: boolean) => {
            if (renderable) {
                if (this.getPersistedItem().getPage() || this.isWithinSite()) {
                    this.updateLiveEditModel(content);
                }

                return Q();
            }

            if (this.getPersistedItem().getPage()) {
                this.updateLiveEditModel(content);
                return Q();
            }

            this.livePanel.unloadPage();

            return Q();
        });
    }

    private availableSizeChangedHandler(item: ResponsiveItem) {
        if (this.isTogglingMinimize) return;

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

    saveChanges(clearInspection: boolean = false): Q.Promise<Content> {

        // save happens right after data loaded with new content
        // so layout is not done yet and livePanel is not present yet
        this.livePanel?.skipNextReloadConfirmation(true);

        this.setRequireValid(false);
        this.contentUpdateDisabled = true;
        this.isFirstUpdateAndRenameEventSkiped = false;
        new BeforeContentSavedEvent().fire();
        const previousPersistedItem = this.getPersistedItem();

        return super.saveChanges().then(() => {
            const currentContent = this.getCurrentItem();

            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.saveChanges for: ' + currentContent.getPath().toString());
            }

            return Q.Promise<Content>((resolve, reject) => {

                if (!currentContent.equals(previousPersistedItem)) {

                    // needed before loadPage in case content was moved
                    // because content path is used to load the page
                    this.updateLiveEditModel(currentContent);

                    this.contextView?.setItem(this.getContent());

                    if (this.reloadPageEditorOnSave && this.livePanel) {

                        this.livePanel.loadPage(clearInspection).then(() => {

                            this.refreshLivePanel(currentContent).then(() => {
                                resolve(currentContent);
                            });
                        });

                    } else {
                        resolve(currentContent);
                    }

                } else {
                    resolve(currentContent);
                }

            });
        }).finally(() => {
            this.contentUpdateDisabled = false;
            this.isRename = false;
            if (this.isRendered()) {
                this.updateButtonsState();
            }
        });
    }

    private handleBrokenImageInTheWizard() {
        const brokenImageHandler = (event: ImageErrorEvent) => {
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
        if (!this.canModify) {
            clearDisplayNameInputFocusRequest();
            return;
        }

        this.whenRendered(() => {
            clearDisplayNameInputFocusRequest();

            if ($isContentFormExpanded.get()) {
                requestDisplayNameInputFocus();
            }

            this.startRememberFocus();
        });
    }


    doLayout(persistedContent: Content): Q.Promise<void> {
        return super.doLayout(persistedContent).then(() => {
            this.updateThumbnailWithContent(persistedContent);
            this.updateTabsElement();

            if (this.params.localized) {
                this.onRendered(() => {
                    NotifyManager.get().showFeedback(i18n('notify.content.localized'));
                    this.renderAndOpenTranslatorDialog();
                });
            }

            AI.get().setContentHeader(this.wizardHeader);
            return this.fetchContentSummaryAndUpdate(persistedContent);
        });
    }

    close(checkCanClose: boolean = false) {
        const liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {
            liveFormPanel.skipNextReloadConfirmation(true);
        }
        super.close(checkCanClose);
    }

    public checkContentCanBePublished(): boolean {
        return this.isContentFormValid && this.contentType != null;
    }

    private isCurrentContentId(id: ContentId): boolean {
        return this.getPersistedItem() && id && this.getPersistedItem().getContentId().equals(id);
    }

    private isCurrentTemplateId(id: ContentId): boolean {
        return this.getPersistedItem() && id && this.getPersistedItem().getPage()?.getTemplate()?.toString() === id.toString();
    }

    private persistedItemPathIsDescendantOrEqual(path: ContentPath): boolean {
        return this.getPersistedItem().getPath().isDescendantOf(path) || this.getPersistedItem().getPath().equals(path);
    }

    private initListeners() {
        MaskContentWizardPanelEvent.on(event => {
            if (this.getPersistedItem().getContentId().equals(event.getContentId())) {
                this.wizardActions.suspendActions(event.isMask());
            }
        });

        PageState.getEvents().onPageReset(() => {
            this.setMarkedAsReady(false);
            this.saveChanges(true).catch(DefaultErrorHandler.handle);
        });

        // to be changed: make default models static and remove that call by directly using DefaultModels in PageState
        PageEventsManager.get().onCustomizePageRequested(() => {
            this.getTemplateForCustomize().then((template: PageTemplate) => {
                PageEventsManager.get().notifySetCustomizedPageRequested(template);
            }).catch(DefaultErrorHandler.handle);
        });

        PageEventsManager.get().onPageReloadRequested(() => {
            this.getLivePanel()?.loadPage(false);
        });

        let firstLoad = true;
        ViewExtensionEvent.on((event: ViewExtensionEvent) => {
            this.getLivePanel()?.loadPage().then((renderable) => {
                if (firstLoad) {
                    if (ContentWizardPanel.debug) {
                        console.debug('ContentWizardPanel.ViewWidgetEvent: first page load');
                    }
                    firstLoad = false;
                    this.toggleLiveEdit();
                    this.updateButtonsState();
                    this.toggleClass('rendered', true);
                }
            });
        });

        PageState.getEvents().onPageUpdated((event: PageUpdatedEvent) => {
            this.setMarkedAsReady(false);

            if (event instanceof PageControllerCustomizedEvent) {
                this.unLockPage();
            } else { // saving page on all page updates except when page is being customized
                this.saveChanges().catch(DefaultErrorHandler.handle);
            }

            if (event instanceof PageControllerUpdatedEvent) {
                if (this.liveEditPage?.isLocked()) {
                    this.unLockPage();
                }
            }
        });
    }

    private onFileUploaded(event: UploadedEvent<Content>) {
        const newPersistedContent: Content = event.getUploadItem().getModel();
        this.setPersistedItem(newPersistedContent.clone());
        this.updateThumbnailWithContent(newPersistedContent);

        this.showFeedbackContentSaved(newPersistedContent);
    }

    private listenToContentEvents() {

        const serverEvents: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        const deleteHandler = (items: ContentServerChangeItem[]) => {

            for (const item of items) {
                if (this.isCurrentContentId(item.getContentId())) {
                    this.contentDeleted = true;
                    this.close();
                    break;
                } else if (this.isCurrentTemplateId(item.getContentId())) {
                    // if template is deleted, just reload the page
                    this.debouncedEditorReload(false, true, false);
                }
            }
        };

        const publishOrUnpublishHandler = (contents: ContentSummaryAndCompareStatus[]) => {
            contents.forEach(content => {
                if (this.isCurrentContentId(content.getContentId())) {
                    this.updateWithContentSummary(content);
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
            const wasMoved: boolean = movedItems.some((movedItem: MovedContentItem) => {
                return this.isCurrentContentId(movedItem.item.getContentId()) || this.persistedItemPathIsDescendantOrEqual(movedItem.oldPath);
            });

            if (wasMoved) {
                updateHandler(movedItems[0].item);
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

        const contentPermissionsUpdatedHandler = (contentIds: ContentId[]) => {
            if (this.contentUpdateDisabled || !this.getPersistedItem()) {
                return;
            }

            const thisContentId: ContentId = this.getPersistedItem().getContentId();

            if (!contentIds.some((id: ContentId) => id.equals(thisContentId))) {
                return;
            }

            this.contentFetcher.fetch(thisContentId)
                .then(updatePermissionsHandler)
                .catch(DefaultErrorHandler.handle);
        };

        const contentRenamedHandler = (contents: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
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

            const deletedParent = contextProject.getParents().find(parent => {
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
                        this.contentExistsInParentProject = !!result.getContentsExistMap().get(thisContentIdAsString);

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
        const userCanPublish: boolean = this.isContentPublishableByUser();
        const userCanModify: boolean = this.isContentModifiableByUser();
        this.wizardActions
            .setUserCanPublish(userCanPublish)
            .setUserCanModify(userCanModify)
            .refreshState();
    }

    private updateWithContentSummary(updatedContent: ContentSummaryAndCompareStatus) {
        this.currentCompareStatus = updatedContent.getCompareStatus();
        this.currentPublishStatus = updatedContent.getPublishStatus();
        this.setPersistedContent(updatedContent);
        this.getContentWizardToolbar().setItem(updatedContent);
        this.getWidgetToolbar().setItem(updatedContent);
        this.wizardActions.setContent(updatedContent).refreshState();
        this.fetchCompareAndRefreshActions();

        const isUpdatedAndRenamed = this.isContentUpdatedAndRenamed(updatedContent);
        if (!isUpdatedAndRenamed || this.isFirstUpdateAndRenameEventSkiped) {
            this.isFirstUpdateAndRenameEventSkiped = false;
        }

        this.setAllowedActionsBasedOnPermissions();
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

    /*
    * Callback on content updated server event
    * */
    private handlePersistedContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.handlePersistedContentUpdate for: ' + updatedContent.getPath().toString());
        }
        this.updateWithContentSummary(updatedContent);
    }

    private handleOtherContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        if (updatedContent.getType().isPageTemplate()) {
            this.handleTemplateUpdate(updatedContent);
            return;
        }

        if (this.isParentSiteUpdated(updatedContent)) {
            this.debouncedEditorReload(false, true, false);
            return;
        }

        const form = this.contentType?.getForm();

        if (form) {
            ContentHelper.doContentComponentsContainId(this.getPersistedItem(), form, updatedContent.getContentId())
                .then((containsId) => {
                    if (containsId) {
                        this.debouncedEditorReload();
                    }
                })
                .catch(DefaultErrorHandler.handle).done();
        }
    }

    private handleTemplateUpdate(template: ContentSummaryAndCompareStatus): void {
        if (this.isCurrentTemplateId(template.getContentId())) {
            this.debouncedEditorReload(false, true, true);
            return;
        }

        const isPageInAutoRenderingMode: boolean = !this.getPersistedItem().getPage();

        if (isPageInAutoRenderingMode && this.isSameRootWithPersisted(template)) {
            // update default models if page is rendered automatically and updated template might be or become the one rendering
            ContentWizardDataLoader.loadDefaultModels(this.site, this.getPersistedItem().getType()).then((defaultModels: DefaultModels) => {
                const isAutoUpdated: boolean = this.defaultModels.getDefaultPageTemplate()?.getId() === template.getId() ||
                                               defaultModels.getDefaultPageTemplate()?.getId() === template.getId();
                this.defaultModels = defaultModels;

                if (this.liveEditModel) {
                    // defaultModels is part of liveEditModel so need to update it
                    this.updateLiveEditModel(this.getPersistedItem());
                }

                if (isAutoUpdated) {
                    this.debouncedEditorReload(false, true, true);
                    return;
                }

            }).catch(DefaultErrorHandler.handle);
        }
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
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.updateLiveEditModel for: ' + content.getPath().toString());
        }

        // ! Sync PageState with the persisted page after save. Otherwise the
        // ! onContentUpdated path sees viewedContent ≠ contentAfterLayout and
        // ! triggers a full iframe reload via debouncedEditorReload.
        // ! PageStateEvent mirrors the new state into the iframe; setState
        // ! alone fires no event.
        const incomingPage = content.getPage();
        const stalePage = PageState.getState();
        if (stalePage !== incomingPage) {
            PageState.setState(incomingPage ? incomingPage.clone() : null);
            new PageStateEvent(PageState.getState()?.toJson() ?? null).fire();
        }

        this.liveEditModel = this.initLiveEditModel(content);
        this.livePanel?.setModel(this.liveEditModel);
    }

    private fetchContentSummaryAndUpdate(persistedContent: Content) {
        return this.contentFetcher.fetchByContent(persistedContent)
            .then((summaryAndStatus) => {
                this.updateWithContentSummary(summaryAndStatus);
            });
    }

    private isContentPublishableByUser(): boolean {
        return AccessControlHelper.hasPermission(Permission.PUBLISH, this.getPersistedItem().getPermissions());
    }

    private isContentModifiableByUser(): boolean {
        return AccessControlHelper.hasPermission(Permission.MODIFY, this.getPersistedItem().getPermissions());
    }

    saveChangesWithoutValidation(reloadPageEditor?: boolean): Q.Promise<Content> {
        this.reloadPageEditorOnSave = reloadPageEditor;

        return this.saveChanges().then((content: Content) => {
            this.reloadPageEditorOnSave = true;
            return content;
        });
    }

    private updateThumbnailWithContent(content: Content) {
        const thumbnailUploader: ThumbnailUploaderEl = this.getFormIcon();
        thumbnailUploader.toggleClass('has-origin-project', !!content.getOriginProject());
        const id: string = content.getContentId().toString();
        thumbnailUploader
            .setParams({id})
            .setEnabled(this.contentType ? !content.isImage() : false)
            .setValue(new ContentIconUrlResolver().setContent(content).resolve());
    }

    private toggleLiveEdit(): Q.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.toggleLiveEdit at ' + new Date().toISOString());
        }
        return Q.allSettled([this.shouldAndCanOpenEditorByDefault(), this.hasControllers()])
            .then(([canOpenEditor, hasControllers]) => {
                if (canOpenEditor.value || hasControllers.value) {
                    this.showLiveEdit();
                } else {
                    this.showForm();
                }
            })
            .catch(DefaultErrorHandler.handle);
    }

    private updateSiteModel(site: Site): void {
        this.siteModel.update(site);
        this.site = site;
        AI.get().updateInstructions(this.getApplicationsConfigs());
    }

    private initLiveEditModel(content: Content): LiveEditModel {
        return LiveEditModel.create()
            .setContent(content)
            .setCompareStatus(this.currentCompareStatus)
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

    private produceCreateContentRequest(): Q.Promise<CreateContentRequest | null> {
        return this.getContentTypeName().isMedia() ? Q(null) : Q(this.doCreateContentRequest());
    }

    private doCreateContentRequest(): CreateContentRequest {
        const parentPath: ContentPath = this.parentContent != null ? this.parentContent.getPath() : ContentPath.getRoot();
        return ContentHelper.makeNewContentRequest(this.getContentTypeName())
            .setParent(parentPath)
            .setRequireValid(this.requireValid);
    }

    updatePersistedItem(): Q.Promise<Content> {
        const persistedContent: Content = this.getPersistedItem();
        const isInherited: boolean = persistedContent.isDataInherited();
        const updateContentRoutine = new UpdatePersistedContentWithStoreRoutine(this, persistedContent);
        updateContentRoutine.setRequireValid(this.requireValid);

        return updateContentRoutine.execute().then((context: RoutineContext) => {
            const content: Content = context.content;

            if (persistedContent.getName().isUnnamed() && !content.getName().isUnnamed()) {
                this.handleContentNamed(content);
            }

            if (context.dataUpdated || context.pageUpdated || context.workflowUpdated) {
                this.showFeedbackContentSaved(content, isInherited);
            }

            return content;
        });
    }

    /*
    * Callback after local save of content
    * */
    postUpdatePersistedItem(persistedItem: Content): Q.Promise<Content> {
        // set the new property set to the form so that we receive change events
        // should happen before resetWizard which clears dirty state on inputs
        escalateVisibility('all');
        setServerValidationErrors(this.getCurrentItem().getValidationErrors());

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
        } else if (content.isReady()) {
            message = i18n('notify.item.markedAsReady', name);
        } else {
            message = i18n('notify.item.saved', name);
        }

        showFeedback(message);
    }

    hasUnsavedChanges(): boolean {
        if (!this.isRendered()) {
            return false;
        }

        const persistedContent: Content = this.getPersistedItem();

        if (persistedContent == null) {
            return true;
        }

        return $wizardHasChanges.get();
    }

    setRequireValid(requireValid: boolean) {
        this.requireValid = requireValid;
    }

    setMarkedAsReady(value: boolean) {
        setWizardMarkedAsReady(value);
    }

    isMarkedAsReady(): boolean {
        return $wizardIsMarkedAsReady.get();
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

    getContentWizardToolbarPublishControls(): ContentWizardToolbarPublishControls {
        return this.getContentWizardToolbar().getContentWizardToolbarPublishControls();
    }

    getContent(): ContentSummaryAndCompareStatus {
        return ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(this.getPersistedItem(), this.currentCompareStatus,
            this.currentPublishStatus);
    }

    private handleContentNamed(content: Content): void {
        // Content path has changed so update site as well.
        if (content.isSite()) {
            this.site = content as Site;
            return;
        }

        new ContentWizardDataLoader().loadSite(content.getContentId()).then(site => {
            this.site = site;
        });
    }

    setEnabled(value: boolean) {
        super.setEnabled(value);

        this.getEl().toggleClass('no-modify-permissions', !value);
        this.getLivePanel()?.setEnabled(value);
    }

    unLockPage(): void {
        this.liveEditPage?.setLocked(false);
    }

    isReadOnly(): boolean {
        return !this.canModify;
    }

    public isContentDeleted(): boolean {
        return this.contentDeleted;
    }

    private getContentTypeName() : ContentTypeName {
        return this.contentType ? this.contentType.getContentTypeName() : this.getCurrentItem().getType();
    }

    private shouldOpenEditorByDefault(): Q.Promise<boolean> {
        return Q.resolve(this.contentType && !ContentTypeName.IMAGE.equals(this.contentType.getContentTypeName()));
    }

    private shouldAndCanOpenEditorByDefault(): Q.Promise<boolean> {
        if (!ResponsiveRanges._960_1200.isFitOrBigger(this.getEl().getWidth())) {
            return Q.resolve(false);
        }

        return this.shouldOpenEditorByDefault();
    }

    private updateButtonsState(): Q.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.updateButtonsState');
        }

        return this.wizardActions.refreshActions();
    }

    private fetchCompareAndRefreshActions(): void {
        const content = this.getPersistedItem();
        if (!content) return;

        const contentId = content.getContentId().toString();
        const publishStatus = calcTreePublishStatus(content);
        const secondaryStatus = calcSecondaryStatus(publishStatus, content);

        if (secondaryStatus === 'modified') {
            compareContent([contentId]).then(result => {
                const compareResult = result.get(contentId);
                this.wizardActions.setCompareResult(compareResult).refreshState();
            }).catch(DefaultErrorHandler.handle);
        }
    }

    getLiveMask(): LoadMask {
        return this.liveMask;
    }

    private updateTabsElement(): void {
        setDraftPage(PageState.getState());
    }

    onPageStateChanged(listener: () => void) {
        PageState.getEvents().onPageReset(listener);
        PageState.getEvents().onPageUpdated(listener);
        PageState.getEvents().onPageConfigUpdated(listener);
        PageState.getEvents().onComponentUpdated(listener);
        PageState.getEvents().onComponentAdded(listener);
        PageState.getEvents().onComponentRemoved(listener);
    }

    private updateUrlAction() {
        const action: string = UrlAction.EDIT;
        Router.get().setPath(UrlHelper.createContentEditUrl(this.getPersistedItem().getId(), action));
        window.name = `${action}:${ProjectContext.get().getProject().getName()}:${this.getPersistedItem().getId()}`;
    }

    protected setPersistedItem(newPersistedItem: Content): void {
        super.setPersistedItem(newPersistedItem);

        setWizardPersistedContent(newPersistedItem);

        AI.get().setContent(newPersistedItem);
    }

    protected convertToCurrentItem(content: Content): Content {
        return content ? content.clone() : null;
    }

    private setPersistedContent(content: ContentSummaryAndCompareStatus) {
        ContentContext.get().setContent(content);
        this.persistedCompareStatus = content.getCompareStatus();

        AI.get().setCompareStatus(this.persistedCompareStatus);

        this.contextView?.setItem(content);
    }

    protected checkIfEditIsAllowed(): Q.Promise<boolean> {
        if (this.getPersistedItem().isDataInherited()) {
            return Q.resolve(false);
        }

        const hasModifyPermissions: boolean =
            ContentHelper.isAnyPrincipalAllowed(this.getPersistedItem().getPermissions(), AuthHelper.getPrincipalsKeys(),
                Permission.MODIFY);

        if (!hasModifyPermissions) {
            NotifyManager.get().showFeedback(i18n('notify.item.readonly'));
        }

        return Q.resolve(hasModifyPermissions && !this.getPersistedItem().isDataInherited());
    }

    protected handleCanModify(canModify: boolean): void {
        super.handleCanModify(canModify);

        setWizardReadOnly(!canModify);
        this.updateUrlAction();
    }

    isContentExistsInParentProject(): boolean {
        return !!this.contentExistsInParentProject;
    }

    isMinimized(): boolean {
        return this.minimized;
    }

    isRenderable(): Q.Promise<boolean> {
        if (!this.livePanel) {
            // may happen if invoked before rendered
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.isRenderable before rendered');
            }
            return Q.resolve(false);
        }
        return this.livePanel.isRenderable().then((renderable: boolean) => {
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.isRenderable', renderable);
            }
            return renderable;
        });
    }

    hasControllers(): Q.Promise<boolean> {
        if (!this.livePanel) {
            // may happen if invoked before rendered
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.hasControllers before rendered');
            }
            return Q.resolve(false);
        }
        return this.livePanel.hasControllers().then((hasControllers: boolean) => {
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.hasControllers', hasControllers);
            }
            return hasControllers ?? false;
        });
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

    private getApplicationsConfigs(): ApplicationConfig[] {
        return [...(this.site?.getSiteConfigs() ?? []), ...ProjectContext.get().getProject().getSiteConfigs()];
    }

    renderAndOpenTranslatorDialog(language?: string): void {
        if ((!language && !this.isTranslatable()) || !AI.get().hasTranslator()) {
            return;
        }

        if (language) {
            AI.get().setLanguage(language);
        }

        const isAlreadyRendered = document.querySelector('.ai-translator-container');
        if (!isAlreadyRendered) {
            const aiTranslatorContainer = new DivEl('ai-translator-container');
            Body.get().appendChild(aiTranslatorContainer);
            AI.get().renderTranslator(aiTranslatorContainer.getHTMLElement());
        }

        AI.get().whenReady(() => {
            new AiTranslatorOpenDialogEvent().fire();
        });
    }
}
