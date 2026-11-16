import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { showFeedback, showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { NotifyManager } from '@enonic/lib-admin-ui/notify/NotifyManager';
import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { LoadMask } from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import { Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { ResponsiveManager } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import { cleanupWizardMixinsService, initWizardMixinsService } from '../../v6/pages/wizard/model/wizardMixins.service';
import {
    applyOwnContentUpdate,
    cleanupWizardContentSyncService,
    initWizardContentSyncService,
} from '../../v6/pages/wizard/model/wizardContentSync.service';
import { setWizardContent } from '../../v6/entities/content';
import { setContextOpen } from '../../v6/widgets/context-panel/model/contextWidgets.store';
import { getActiveProjectName } from '../../v6/entities/project';
import {
    $displayNameInputFocusRequested,
    $isContentFormExpanded,
    $wizardHasChanges,
    clearDisplayNameInputFocusRequest,
    initializeWizardContentState,
    requestDisplayNameInputFocus,
    resetWizardContent,
    setDraftPage,
    setContentType as setWizardContentType,
    setWizardMarkedAsReady,
    setPersistedContent as setWizardPersistedContent,
    setWizardReadOnly,
} from '../../v6/pages/wizard/model/wizardContent.store';
import {
    $generalServerErrorMessages,
    escalateVisibility,
    initializeValidation,
    setServerValidationErrors,
} from '../../v6/pages/wizard/model/wizardValidation.store';
import { type PreviewToolbarElement } from '../../v6/widgets/preview-panel/ui/PreviewToolbar';
import { ContentWizardTabsToolbarElement } from '../../v6/pages/wizard/ui/content-wizard-tabs/ContentWizardTabsToolbarElement';
import { Permission } from '../access/Permission';
import { openPluginDialog, setAiContent, setAiContentType, setAiLanguage, whenAiReady } from '../../v6/features/ai';
import { ContentWizardToolbarElement } from '../../v6/pages/wizard/ui/ContentWizardToolbar';
import { setWizardToolbarItem, startWizardToolbar } from '../../v6/pages/wizard/model/wizardToolbar.service';
import { type CompareStatus } from '../content/CompareStatus';
import { type Content } from '../content/Content';
import { type ContentId } from '../content/ContentId';
import { ContentPath } from '../content/ContentPath';
import { ContentSummaryAndCompareStatus } from '../content/ContentSummaryAndCompareStatus';
import { type PageTemplate } from '../content/PageTemplate';
import { BeforeContentSavedEvent } from '../event/BeforeContentSavedEvent';
import { ContentLanguageUpdatedEvent } from '../event/ContentLanguageUpdatedEvent';
import { ContentSettingsUpdatedEvent } from '../event/ContentSettingsUpdatedEvent';
import { ContentRequiresSaveEvent } from '../event/ContentRequiresSaveEvent';
import { ViewExtensionEvent } from '../event/ViewExtensionEvent';
import { type ContentType } from '../inputtype/schema/ContentType';
import { ImageErrorEvent } from '../inputtype/ui/selector/image/ImageErrorEvent';
import { PageControllerCustomizedEvent } from '../page/event/PageControllerCustomizedEvent';
import { type PageUpdatedEvent } from '../page/event/PageUpdatedEvent';
import { type Page } from '../page/Page';
import { type PublishStatus } from '../publish/PublishStatus';
import { ContentSummaryAndCompareStatusFetcher } from '../resource/ContentSummaryAndCompareStatusFetcher';
import { Router } from '../Router';
import { UrlAction } from '../UrlAction';
import { ContentHelper } from '../util/ContentHelper';
import { PageHelper } from '../util/PageHelper';
import { UrlHelper } from '../util/UrlHelper';
import { PageEditorContextController } from '../view/context/PageEditorContextController';
import { AccessControlHelper } from './AccessControlHelper';
import { ContentWizardActions } from './action/ContentWizardActions';
import { WizardLayoutElement } from '../../v6/pages/wizard/ui/layout/WizardLayout';
import { ContentContext } from './ContentContext';
import { type ContentWizardPanelParams } from './ContentWizardPanelParams';
import { startWizardServerEvents } from '../../v6/pages/wizard/model/wizardServerEvents.service';
import {
    attachWizardPageEditorView,
    getWizardLiveEditModel,
    getWizardTemplateForCustomize,
    handleWizardContentNamed,
    handleWizardOtherContentUpdated,
    handleWizardTemplatesDeleted,
    initWizardPageModel,
    loadWizardPage,
    reloadWizardPageEditorAfterSave,
    startWizardPageEditor,
    updateWizardPageModel,
} from '../../v6/pages/wizard/model/wizardPageEditor.service';
import { startWizardLayout } from '../../v6/pages/wizard/model/wizardLayout.service';
import { loadWizardData, type WizardLoadedData } from '../../v6/pages/wizard/model/wizardLoad.service';
import {
    createWizardContent,
    resolveSavedMessage,
    updateWizardContent,
} from '../../v6/pages/wizard/model/wizardSave.service';
import { type WizardSaveOptions } from '../../v6/pages/wizard/model/wizardController';
import { LiveFormPanel } from './page/LiveFormPanel';
import { PageState } from './page/PageState';
import { PageEventsManager } from './PageEventsManager';

//
// What lib-admin-ui `WizardPanel` did for the content wizard is inlined here: waiting
// for the data and for the panel to be shown before rendering, the load masks, the
// persisted and the edited content, and the close listeners.
//
export class ContentWizardPanel extends Panel {
    private livePanel?: LiveFormPanel;

    private readonly params: ContentWizardPanelParams;

    private wizardActions: ContentWizardActions;

    private mainToolbar: ContentWizardToolbarElement;

    private formPanel: Panel;

    private leftPanelAndToolbar: Panel;

    private formMask?: LoadMask;

    private persistedItem: Content;

    private currentItem: Content;

    private newContent: boolean = true;

    private canModify: boolean = false;

    private dataLoaded: boolean = false;

    private closedListeners: (() => void)[] = [];

    private dataLoadedListeners: ((content: Content) => void)[] = [];

    private parentContent: Content;

    private contentExistsInParentProject: boolean;

    private contentType: ContentType;

    private currentCompareStatus: CompareStatus;

    private currentPublishStatus: PublishStatus;

    private persistedCompareStatus: CompareStatus;

    private wizardLayout: WizardLayoutElement;

    private contentUpdateDisabled: boolean;

    private contentDeleted: boolean;

    public static debug: boolean = false;

    private contentFetcher: ContentSummaryAndCompareStatusFetcher;

    constructor(params: ContentWizardPanelParams, cls?: string) {
        super('wizard-panel');

        this.params = params;
        this.initElements();
        this.initEventsListeners();
        this.mainToolbar = this.createMainToolbar();

        this.getEl().setAttribute('role', 'main');

        if (cls) {
            this.addClass(cls);
        }

        const stopPageEditor = startWizardPageEditor({
            getPersistedContent: () => this.getPersistedItem() ?? undefined,
            getCompareStatus: () => this.currentCompareStatus,
            getContentType: () => this.contentType,
            createsSite: params.createSite,
        });
        this.onClosed(stopPageEditor);

        initWizardMixinsService();
        initWizardContentSyncService();
        this.onClosed(() => {
            cleanupWizardMixinsService();
            cleanupWizardContentSyncService();
        });

        this.loadData();
    }

    private initElements() {
        this.wizardActions = new ContentWizardActions(this);
        // ! `panel-strip-scrollable` is what makes the form scroll.
        this.formPanel = new Panel('form-panel rendering panel-strip-scrollable');
        this.leftPanelAndToolbar = new Panel();

        this.contentUpdateDisabled = false;

        this.contentFetcher = new ContentSummaryAndCompareStatusFetcher();
    }

    private initEventsListeners() {
        this.onShown(() => {
            if (!this.formPanel.isRendered()) {
                this.formMask?.show();
            }
        });

        this.onHidden(() => {
            if (this.formMask?.isVisible()) {
                this.formMask.hide();
            }
            this.livePanel?.hideLoadMask();
        });

        this.formPanel.onAdded(() => {
            this.formMask = new LoadMask(this.formPanel);
            this.formMask.show();
        });

        this.formPanel.onRendered(() => {
            this.formMask?.hide();
            this.formPanel.removeClass('rendering');
            this.mainToolbar.removeClass('rendering');

            this.checkIfEditIsAllowed()
                .then((editIsAllowed: boolean) => editIsAllowed && this.giveInitialFocus())
                .catch(DefaultErrorHandler.handle);

            if (this.getPersistedItem()) {
                this.wizardActions.refreshState();
            }
        });

        ResponsiveManager.onAvailableSizeChanged(this.formPanel);

        this.listenToContentEvents();
        this.handleContentRequiresSaveEvent();
        this.handleBrokenImageInTheWizard();

        ContentLanguageUpdatedEvent.on((event: ContentLanguageUpdatedEvent) => {
            this.openTranslatorDialog(event.getLanguage());
        });

        const contentSettingsUpdatedHandler = (event: ContentSettingsUpdatedEvent) => {
            this.handleContentSettingsUpdated(event.getContent());
        };

        ContentSettingsUpdatedEvent.on(contentSettingsUpdatedHandler);
        this.onClosed(() => {
            ContentSettingsUpdatedEvent.un(contentSettingsUpdatedHandler);
        });
    }

    private handleContentSettingsUpdated(content: Content): void {
        if (!this.isCurrentContentId(content.getContentId())) {
            return;
        }

        const wasDataInherited: boolean = this.getPersistedItem().isDataInherited();

        this.storePersistedItem(content);
        applyOwnContentUpdate(content);
        setAiContent(content);
        this.updateWithContentSummary(
            ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                content,
                this.persistedCompareStatus,
                this.currentPublishStatus,
            ),
        );

        if (wasDataInherited && !content.isDataInherited()) {
            this.checkIfEditIsAllowed()
                .then((canModify: boolean) => {
                    this.handleCanModify(canModify);
                })
                .catch(DefaultErrorHandler.handle);
        }

        this.wizardActions.refreshActions().catch(DefaultErrorHandler.handle);
    }

    private handleContentRequiresSaveEvent(): void {
        const contentRequiresSaveHandler = (event: ContentRequiresSaveEvent) => {
            if (this.isCurrentContentId(event.getContentId()) && this.hasUnsavedChanges()) {
                setWizardMarkedAsReady(false);
                this.saveChanges();
            }
        };

        ContentRequiresSaveEvent.on(contentRequiresSaveHandler);
        this.onClosed(() => {
            ContentRequiresSaveEvent.un(contentRequiresSaveHandler);
        });
    }

    onDataLoaded(listener: (content: Content) => void): void {
        this.dataLoadedListeners.push(listener);
    }

    onClosed(listener: () => void): void {
        this.closedListeners.push(listener);
    }

    private loadData(): void {
        this.dataLoaded = false;

        this.doLoadData().done(
            (content: Content) => {
                this.dataLoaded = true;
                this.dataLoadedListeners.forEach((listener) => listener(content));
            },
            (reason) => DefaultErrorHandler.handle(reason),
        );
    }

    private doLoadData(): Q.Promise<Content> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.doLoadData at ' + new Date().toISOString());
        }
        return (
            Q(loadWizardData(this.params))
                .then((loaded: WizardLoadedData) => {
                    if (ContentWizardPanel.debug) {
                        console.debug(
                            'ContentWizardPanel.doLoadData: loaded data at ' + new Date().toISOString(),
                            loaded,
                        );
                    }
                    if (loaded.content) {
                        this.newContent = this.params.displayAsNew;
                        this.setPersistedItem(loaded.content);

                        if (this.params.displayAsNew) {
                            showFeedback(i18n('notify.content.created'));
                        }
                    }

                    this.contentType = loaded.contentType;
                    this.parentContent = loaded.parentContent;
                    this.contentExistsInParentProject = loaded.existsInParentProject;
                    this.persistedCompareStatus = loaded.compareStatus;
                    this.currentCompareStatus = loaded.compareStatus;
                    this.currentPublishStatus = loaded.publishStatus;

                    setAiContentType(this.contentType);
                    initWizardPageModel({ site: loaded.site, defaultModels: loaded.defaultModels });
                })
                // an unnamed, empty content is created before a new wizard renders
                .then(() => this.getPersistedItem() ?? this.saveChanges())
                .then((loadedContent: Content) => {
                    // persisted item is always present now
                    // for existing content it was loaded
                    // for new content it was just created
                    const currentItem: Content = this.getCurrentItem();
                    updateWizardPageModel(currentItem);

                    return this.loadAndSetPageState(currentItem.getPage()?.clone()).then(() => loadedContent);
                })
        );
    }

    private loadAndSetPageState(page: Page): Q.Promise<void> {
        const pagePromise: Q.Promise<Page | null> = page
            ? PageHelper.injectEmptyRegionsIntoPage(page)
            : Q.resolve(null);

        return pagePromise.then((page: Page | null) => {
            PageState.setState(page);
        });
    }

    private createMainToolbar(): ContentWizardToolbarElement {
        const toolbar = new ContentWizardToolbarElement();
        toolbar.getHTMLElement().classList.remove('contents');
        toolbar.onRemoved(startWizardToolbar());

        return toolbar;
    }

    private getWidgetToolbar(): PreviewToolbarElement {
        return this.getLivePanel().getFrameContainer().getToolbar();
    }

    public getLivePanel(): LiveFormPanel {
        return this.livePanel;
    }

    private createWizardLayoutPanel(): Panel {
        if (this.livePanel) {
            const pageEditorContextController = new PageEditorContextController();
            this.onRemoved(() => pageEditorContextController.destroy());
        }

        setWizardContent(this.getContent().getContentSummary());

        setContextOpen(false);

        this.wizardLayout = new WizardLayoutElement({
            formPanel: this.formPanel,
            livePanel: this.livePanel,
        });

        const stopLayout = startWizardLayout(
            {
                applyLiveEdit: (shown) => {
                    this.mainToolbar.toggleClass('live', shown);
                    this.toggleClass('form', !shown);
                    this.toggleClass('wizard-panel--live', shown);

                    if (!shown) {
                        this.livePanel?.hideLoadMask();
                    }
                },
                applyMinimized: (minimized) => {
                    this.formPanel.toggleClass('minimized', minimized);
                    this.formPanel.toggleClass('border-r', minimized);
                    this.formPanel.toggleClass('border-bdr-soft', minimized);
                },
            },
            { hasContentType: !!this.contentType },
        );
        this.onRemoved(stopLayout);

        const wrapper = new Panel('wizard-layout-panel');
        wrapper.setDoOffset(false);
        // Below the 60px toolbar, or the empty strip would swallow toolbar clicks.
        wrapper.addClass('!top-15');
        wrapper.appendChild(this.wizardLayout);
        return wrapper;
    }

    private createLivePanel(): LiveFormPanel {
        const liveFormPanel: LiveFormPanel = new LiveFormPanel({ liveEditModel: getWizardLiveEditModel() });
        attachWizardPageEditorView(liveFormPanel);

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

    getWizardActions(): ContentWizardActions {
        return this.wizardActions;
    }

    // Renders once the data is loaded and the panel is shown.
    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const renderWhenShown = (): Q.Promise<boolean> => {
                const deferred = Q.defer<boolean>();

                const render = (): void => {
                    this.doRenderOnDataLoaded(rendered)
                        .then((nextRendered: boolean) =>
                            this.doLayout(this.getPersistedItem()).then(() => {
                                this.checkIfEditIsAllowed()
                                    .then((canModify: boolean) => this.handleCanModify(canModify))
                                    .catch(DefaultErrorHandler.handle)
                                    .finally(() => deferred.resolve(nextRendered));
                            }),
                        )
                        .catch((reason) => {
                            deferred.reject(reason);
                            DefaultErrorHandler.handle(reason);
                        })
                        .done();
                };

                if (this.isVisible()) {
                    render();
                } else {
                    const shownHandler = (): void => {
                        this.unShown(shownHandler);
                        render();
                    };
                    this.onShown(shownHandler);
                }

                return deferred.promise;
            };

            if (this.dataLoaded) {
                return renderWhenShown();
            }

            const deferred = Q.defer<boolean>();
            this.onDataLoaded(() => {
                renderWhenShown().then(
                    (nextRendered) => deferred.resolve(nextRendered),
                    (reason) => deferred.reject(reason),
                );
            });

            return deferred.promise;
        });
    }

    private updateToolbarActions(): void {
        if (this.newContent) {
            this.wizardActions.enableActionsForNew();
        } else {
            void this.wizardActions.enableActionsForExisting(this.getPersistedItem());
        }
    }

    private assembleElements(): void {
        this.updateToolbarActions();
        this.mainToolbar.addClass('rendering');

        // ! Stands in for the legacy steps panel: its rule in lib-admin-ui gives the form its bottom padding.
        this.formPanel.appendChild(new DivEl('panel panel-strip wizard-steps-panel'));

        this.leftPanelAndToolbar.prependChild(this.mainToolbar);
        this.leftPanelAndToolbar.appendChild(this.prepareMainPanel());
        this.appendChild(this.leftPanelAndToolbar);
    }

    private doRenderOnDataLoaded(rendered: boolean): Q.Promise<boolean> {
        this.initListeners();

        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.doRenderOnDataLoaded at ' + new Date().toISOString());
        }

        // always create live panel because
        // JSON widget is always able to render content
        this.livePanel = this.createLivePanel();

        this.assembleElements();

        return Q(rendered).then(() => {
            if (ContentWizardPanel.debug) {
                console.debug('ContentWizardPanel.doRenderOnDataLoaded continue at ' + new Date().toISOString());
            }

            setWizardToolbarItem(this.getContent());
            this.wizardActions.setContent(this.getContent()).refreshState();

            this.addClass('content-wizard-panel');

            this.onRemoved(() => {
                this.wizardActions.cleanupUnsavedChangesListeners();
                resetWizardContent();
            });

            if (this.livePanel) {
                this.livePanel.addClass('rendering');
                ResponsiveManager.onAvailableSizeChanged(this.formPanel);
            }

            return rendered;
        });
    }

    private prepareMainPanel(): Panel {
        this.formPanel.addClass('content-wizard-form-panel px-5 py-3');

        if (this.getPersistedItem()) {
            initializeWizardContentState(this.getPersistedItem(), this.contentType ?? null, []);
            initializeValidation(this.isNew());
            setServerValidationErrors(this.getPersistedItem().getValidationErrors());
            this.notifyGeneralValidationErrors();
        } else if (this.contentType) {
            setWizardContentType(this.contentType);
        }

        setWizardReadOnly(this.isReadOnly());
        if ($displayNameInputFocusRequested.get()) {
            clearDisplayNameInputFocusRequest();
        }

        this.formPanel.prependChild(new ContentWizardTabsToolbarElement());

        this.onPageStateChanged(() => this.updateTabsElement());

        return this.createWizardLayoutPanel();
    }

    private notifyGeneralValidationErrors(): void {
        $generalServerErrorMessages.get().forEach((message: string) => showWarning(message));
    }

    isNew(): boolean {
        return this.newContent;
    }

    saveChanges(options: WizardSaveOptions = {}): Q.Promise<Content> {
        const { reloadPageEditor = true, renamed = false } = options;
        // save happens right after data loaded with new content
        // so layout is not done yet and livePanel is not present yet
        this.livePanel?.skipNextReloadConfirmation(true);

        this.contentUpdateDisabled = true;
        new BeforeContentSavedEvent().fire();
        const previousPersistedItem = this.getPersistedItem();

        return Q(
            previousPersistedItem ? this.updatePersistedContent(previousPersistedItem, renamed) : this.createContent(),
        )
            .then(async () => {
                const currentContent = this.getCurrentItem();

                if (!currentContent.equals(previousPersistedItem)) {
                    // needed before the reload in case content was moved
                    // because content path is used to load the page
                    updateWizardPageModel(currentContent);

                    setWizardContent(this.getContent().getContentSummary());

                    if (reloadPageEditor) {
                        await reloadWizardPageEditorAfterSave(currentContent);
                    }
                }

                return currentContent;
            })
            .finally(() => {
                this.contentUpdateDisabled = false;
                if (this.isRendered()) {
                    this.updateButtonsState();
                }
            });
    }

    private async createContent(): Promise<void> {
        const parentPath = this.parentContent != null ? this.parentContent.getPath() : ContentPath.getRoot();
        const content = await createWizardContent(this.getContentTypeName(), parentPath);

        this.setPersistedItem(content);
        // persist new happens before render to init dummy entity and is still considered as new
        if (this.isRendered()) {
            this.newContent = false;
            this.updateToolbarActions();
        }

        showFeedback(i18n('notify.content.created'));
    }

    private async updatePersistedContent(persistedContent: Content, renamed: boolean): Promise<void> {
        const wasInherited = persistedContent.isDataInherited();
        const result = await updateWizardContent(persistedContent);
        const content = result.content;

        if (persistedContent.getName().isUnnamed() && !content.getName().isUnnamed()) {
            handleWizardContentNamed(content);
        }

        if (result.dataUpdated || result.pageUpdated || result.workflowUpdated) {
            showFeedback(resolveSavedMessage(content, { wasInherited, renamed }));
        }

        this.setPersistedItem(content);
        this.newContent = false;
        this.updateToolbarActions();

        escalateVisibility('all');
        // The update is re-validated server-side and carries fresh validationErrors;
        // the in-memory draft has none, which would wipe the errors on save.
        setServerValidationErrors(content.getValidationErrors());
        this.notifyGeneralValidationErrors();
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

    private giveInitialFocus() {
        if (!this.canModify) {
            clearDisplayNameInputFocusRequest();
            return;
        }

        this.whenRendered(() => {
            clearDisplayNameInputFocusRequest();

            if ($isContentFormExpanded.get()) {
                requestDisplayNameInputFocus();
            }
        });
    }

    private doLayout(persistedContent: Content): Q.Promise<void> {
        return Q().then(() => {
            this.updateTabsElement();

            if (this.params.localized) {
                this.onRendered(() => {
                    NotifyManager.get().showFeedback(i18n('notify.content.localized'));
                    this.openTranslatorDialog();
                });
            }

            return this.fetchContentSummaryAndUpdate(persistedContent);
        });
    }

    close(_checkCanClose: boolean = false) {
        const liveFormPanel = this.getLivePanel();
        if (liveFormPanel) {
            liveFormPanel.skipNextReloadConfirmation(true);
        }
        this.closedListeners.forEach((listener) => listener());
    }

    private isCurrentContentId(id: ContentId): boolean {
        return this.getPersistedItem() && id && this.getPersistedItem().getContentId().equals(id);
    }

    private initListeners() {
        PageState.getEvents().onPageReset(() => {
            setWizardMarkedAsReady(false);

            // ! When persisted content already has no page (e.g. after a prior
            // ! reset followed by Customize Page, which mutates only in-memory
            // ! PageState), saveChanges short-circuits and never reloads the
            // ! iframe — leaving the customized page visible. Force a reload
            // ! in that case; otherwise saveChanges handles it.
            if (this.getPersistedItem()?.getPage()) {
                this.saveChanges().catch(DefaultErrorHandler.handle);
            } else {
                void loadWizardPage();
            }
        });

        // to be changed: make default models static and remove that call by directly using DefaultModels in PageState
        PageEventsManager.get().onCustomizePageRequested(() => {
            getWizardTemplateForCustomize()
                .then((template: PageTemplate | null) => {
                    if (template) {
                        PageEventsManager.get().notifySetCustomizedPageRequested(template);
                    }
                })
                .catch(DefaultErrorHandler.handle);
        });

        PageEventsManager.get().onPageReloadRequested(() => {
            void loadWizardPage();
        });

        let firstLoad = true;
        ViewExtensionEvent.on((event: ViewExtensionEvent) => {
            if (!this.livePanel) {
                return;
            }

            void loadWizardPage().then(() => {
                if (firstLoad) {
                    if (ContentWizardPanel.debug) {
                        console.debug('ContentWizardPanel.ViewWidgetEvent: first page load');
                    }
                    firstLoad = false;
                    this.updateButtonsState();
                    this.toggleClass('rendered', true);
                }
            });
        });

        PageState.getEvents().onPageUpdated((event: PageUpdatedEvent) => {
            // ! Sync draft before saveChanges — diff reads $wizardDraftPage,
            // ! the updateTabsElement listener fires later in the chain.
            setDraftPage(PageState.getState());
            setWizardMarkedAsReady(false);

            // saving page on all page updates except when page is being customized
            if (!(event instanceof PageControllerCustomizedEvent)) {
                this.saveChanges().catch(DefaultErrorHandler.handle);
            }
        });
    }

    private listenToContentEvents() {
        const stop = startWizardServerEvents({
            getPersistedContent: () => this.getPersistedItem() ?? undefined,
            isSaving: () => this.contentUpdateDisabled,
            applySummary: (summary) => this.handlePersistedContentUpdate(summary),
            applySorted: (summary) => {
                this.wizardActions.setContent(summary).refreshState();
                setWizardContent(summary.getContentSummary());
            },
            otherContentUpdated: handleWizardOtherContentUpdated,
            templatesDeleted: handleWizardTemplatesDeleted,
            descendantsPublishChanged: () => this.wizardActions.resetUnpublishedChildrenCheck(),
            publishStateChanged: () => this.wizardActions.refreshState(),
            setExistsInParentProject: (exists) => {
                this.contentExistsInParentProject = exists;

                if (!exists) {
                    this.wizardActions.refreshState();
                }
            },
            closeDeleted: () => {
                this.contentDeleted = true;
                this.close();
            },
        });

        this.onClosed(stop);
    }

    private setAllowedActionsBasedOnPermissions() {
        const userCanPublish: boolean = this.isContentPublishableByUser();
        const userCanModify: boolean = this.isContentModifiableByUser();
        this.wizardActions.setUserCanPublish(userCanPublish).setUserCanModify(userCanModify).refreshState();
    }

    private updateWithContentSummary(updatedContent: ContentSummaryAndCompareStatus) {
        this.currentCompareStatus = updatedContent.getCompareStatus();
        this.currentPublishStatus = updatedContent.getPublishStatus();
        this.setPersistedContent(updatedContent);
        setWizardToolbarItem(updatedContent);
        this.getWidgetToolbar().setItem(updatedContent);
        this.wizardActions.setContent(updatedContent).refreshState();

        this.setAllowedActionsBasedOnPermissions();
    }

    /*
     * Callback on content updated server event
     * */
    private handlePersistedContentUpdate(updatedContent: ContentSummaryAndCompareStatus) {
        if (ContentWizardPanel.debug) {
            console.debug(
                'ContentWizardPanel.handlePersistedContentUpdate for: ' + updatedContent.getPath().toString(),
            );
        }
        this.updateWithContentSummary(updatedContent);
    }

    private fetchContentSummaryAndUpdate(persistedContent: Content) {
        return this.contentFetcher.fetchByContent(persistedContent).then((summaryAndStatus) => {
            this.updateWithContentSummary(summaryAndStatus);
        });
    }

    private isContentPublishableByUser(): boolean {
        return AccessControlHelper.hasPermission(Permission.PUBLISH, this.getPersistedItem().getPermissions());
    }

    private isContentModifiableByUser(): boolean {
        return AccessControlHelper.hasPermission(Permission.MODIFY, this.getPersistedItem().getPermissions());
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

    getContent(): ContentSummaryAndCompareStatus {
        return ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
            this.getPersistedItem(),
            this.currentCompareStatus,
            this.currentPublishStatus,
        );
    }

    setEnabled(value: boolean) {
        this.getEl().toggleClass('no-modify-permissions', !value);
        this.getLivePanel()?.setEnabled(value);
    }

    isReadOnly(): boolean {
        return !this.canModify;
    }

    public isContentDeleted(): boolean {
        return this.contentDeleted;
    }

    private getContentTypeName(): ContentTypeName {
        return this.contentType ? this.contentType.getContentTypeName() : this.getCurrentItem().getType();
    }

    private updateButtonsState(): Q.Promise<void> {
        if (ContentWizardPanel.debug) {
            console.debug('ContentWizardPanel.updateButtonsState');
        }

        return this.wizardActions.refreshActions();
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
        window.name = `${action}:${getActiveProjectName()}:${this.getPersistedItem().getId()}`;
    }

    getPersistedItem(): Content {
        return this.persistedItem;
    }

    // The content being edited: a copy of the persisted one.
    private getCurrentItem(): Content {
        return this.currentItem;
    }

    private storePersistedItem(content: Content): void {
        this.persistedItem = content;
        this.currentItem = content ? content.clone() : null;
    }

    private setPersistedItem(newPersistedItem: Content): void {
        this.storePersistedItem(newPersistedItem);

        setWizardPersistedContent(newPersistedItem);

        setAiContent(newPersistedItem);
    }

    public replacePersistedContent(newContent: Content): void {
        this.setPersistedItem(newContent);
    }

    private setPersistedContent(content: ContentSummaryAndCompareStatus) {
        ContentContext.get().setContent(content);
        this.persistedCompareStatus = content.getCompareStatus();

        setWizardContent(content.getContentSummary());
    }

    private checkIfEditIsAllowed(): Q.Promise<boolean> {
        if (this.getPersistedItem().isDataInherited()) {
            return Q.resolve(false);
        }

        const hasModifyPermissions: boolean = ContentHelper.isAnyPrincipalAllowed(
            this.getPersistedItem().getPermissions(),
            AuthHelper.getPrincipalsKeys(),
            Permission.MODIFY,
        );

        if (!hasModifyPermissions) {
            NotifyManager.get().showFeedback(i18n('notify.item.readonly'));
        }

        return Q.resolve(hasModifyPermissions && !this.getPersistedItem().isDataInherited());
    }

    private handleCanModify(canModify: boolean): void {
        this.canModify = canModify;
        this.setEnabled(canModify);

        setWizardReadOnly(!canModify);
        this.updateUrlAction();
    }

    isContentExistsInParentProject(): boolean {
        return !!this.contentExistsInParentProject;
    }

    // Opens the AI Translator dialog via the `dialog:open` plugin command.
    // No-op if the translator plugin is not registered.
    openTranslatorDialog(language?: string): void {
        if (language) {
            setAiLanguage(language);
        }

        whenAiReady(() => {
            openPluginDialog('ai.translator');
        });
    }
}
