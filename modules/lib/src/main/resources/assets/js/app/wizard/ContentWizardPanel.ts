import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { showFeedback, showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { NotifyManager } from '@enonic/lib-admin-ui/notify/NotifyManager';
import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { Action } from '@enonic/lib-admin-ui/ui/Action';
import { KeyBindings } from '@enonic/lib-admin-ui/ui/KeyBindings';
import { LoadMask } from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import { Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { ResponsiveManager } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import { LiveEditModel } from '../../page-editor/LiveEditModel';
import { cleanupWizardMixinsService, initWizardMixinsService } from '../../v6/pages/wizard/model/wizardMixins.service';
import {
    applyOwnContentUpdate,
    cleanupWizardContentSyncService,
    initWizardContentSyncService,
} from '../../v6/pages/wizard/model/wizardContentSync.service';
import { setWizardContent } from '../../v6/entities/content';
import { fromLegacyApplicationConfig } from '../../v6/shared/lib/cms/application/applicationConfig';
import { setContextOpen } from '../../v6/widgets/context-panel/model/contextWidgets.store';
import { getActiveProject, getActiveProjectName } from '../../v6/entities/project';
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
import {
    openPluginDialog,
    setAiContent,
    setAiContentType,
    setAiLanguage,
    updateAiAppConfigs,
    whenAiReady,
} from '../../v6/features/ai';
import { ContentWizardToolbarElement } from '../../v6/pages/wizard/ui/ContentWizardToolbar';
import { setWizardToolbarItem, startWizardToolbar } from '../../v6/pages/wizard/model/wizardToolbar.service';
import { type CompareStatus } from '../content/CompareStatus';
import { type Content } from '../content/Content';
import { type ContentId } from '../content/ContentId';
import { ContentPath } from '../content/ContentPath';
import { ContentSummaryAndCompareStatus } from '../content/ContentSummaryAndCompareStatus';
import { type PageTemplate } from '../content/PageTemplate';
import { type Site } from '../content/Site';
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
import { GetPageTemplateByKeyRequest } from '../resource/GetPageTemplateByKeyRequest';
import { Router } from '../Router';
import { SiteModel } from '../site/SiteModel';
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
import { openWizardLiveEdit, startWizardLayout } from '../../v6/pages/wizard/model/wizardLayout.service';
import {
    loadDefaultModels,
    loadNearestSite,
    loadWizardData,
    type WizardLoadedData,
} from '../../v6/pages/wizard/model/wizardLoad.service';
import {
    createWizardContent,
    resolveSavedMessage,
    updateWizardContent,
} from '../../v6/pages/wizard/model/wizardSave.service';
import { type WizardSaveOptions } from '../../v6/pages/wizard/model/wizardController';
import { type DefaultModels } from './page/DefaultModels';
import { LiveEditPageProxy } from './page/LiveEditPageProxy';
import { LiveFormPanel, type LiveFormPanelConfig } from './page/LiveFormPanel';
import { PageState } from './page/PageState';
import { PageEventsManager } from './PageEventsManager';

//
// What lib-admin-ui `WizardPanel` did for the content wizard is inlined here: waiting
// for the data and for the panel to be shown before rendering, the load masks, the
// persisted and the edited content, and the close listeners.
//
export class ContentWizardPanel extends Panel {
    private livePanel?: LiveFormPanel;

    private liveEditPage?: LiveEditPageProxy;

    private readonly params: ContentWizardPanelParams;

    private wizardActions: ContentWizardActions;

    private mainToolbar: ContentWizardToolbarElement;

    private formPanel: Panel;

    private leftPanelAndToolbar: Panel;

    private formMask?: LoadMask;

    private liveMask?: LoadMask;

    private persistedItem: Content;

    private currentItem: Content;

    private newContent: boolean = true;

    private canModify: boolean = false;

    private dataLoaded: boolean = false;

    private closedListeners: (() => void)[] = [];

    private dataLoadedListeners: ((content: Content) => void)[] = [];

    private parentContent: Content;

    private contentExistsInParentProject: boolean;

    private defaultModels: DefaultModels;

    private site: Site;

    private contentType: ContentType;

    private siteModel: SiteModel;

    private liveEditModel: LiveEditModel;

    private currentCompareStatus: CompareStatus;

    private currentPublishStatus: PublishStatus;

    private persistedCompareStatus: CompareStatus;

    private wizardLayout: WizardLayoutElement;

    private contentUpdateDisabled: boolean;

    private contentDeleted: boolean;

    private debouncedEditorReload: (
        clearInspection?: boolean,
        toggleLiveEdit?: boolean,
        skipConfirmation?: boolean,
    ) => void;

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

        initWizardMixinsService();
        initWizardContentSyncService();
        this.onClosed(() => {
            cleanupWizardMixinsService();
            cleanupWizardContentSyncService();
        });

        this.loadData();
        this.initBindings();
    }

    private initElements() {
        this.wizardActions = new ContentWizardActions(this);
        // ! `panel-strip-scrollable` is what makes the form scroll.
        this.formPanel = new Panel('form-panel rendering panel-strip-scrollable');
        this.leftPanelAndToolbar = new Panel();

        this.contentUpdateDisabled = false;

        this.debouncedEditorReload = AppHelper.debounce(
            (clearInspection: boolean, toggleLiveEdit: boolean, skipConfirmation: boolean) => {
                this.isRenderable().then((wasRenderable: boolean) => {
                    this.livePanel.skipNextReloadConfirmation(skipConfirmation);

                    this.livePanel
                        .loadPage(clearInspection)
                        .then((isRenderable) => {
                            if (wasRenderable !== isRenderable) {
                                return this.refreshLivePanel(this.getCurrentItem());
                            }
                        })
                        .then(() => {
                            if (toggleLiveEdit) {
                                openWizardLiveEdit();
                            }
                        });
                });
            },
            200,
        );

        this.contentFetcher = new ContentSummaryAndCompareStatusFetcher();
    }

    // Only Preview and Close are left here; the v6 wizard shell binds the shortcuts of the other actions.
    private initBindings() {
        const nextActions = this.wizardActions.getActions();
        const currentKeyBindings = Action.getKeyBindings(nextActions);
        KeyBindings.get().bindKeys(currentKeyBindings);
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
            if (this.liveMask?.isVisible()) {
                this.liveMask.hide();
            }
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

                    this.defaultModels = loaded.defaultModels;
                    this.site = loaded.site;
                    this.contentType = loaded.contentType;
                    this.parentContent = loaded.parentContent;
                    this.contentExistsInParentProject = loaded.existsInParentProject;
                    this.persistedCompareStatus = loaded.compareStatus;
                    this.currentCompareStatus = loaded.compareStatus;
                    this.currentPublishStatus = loaded.publishStatus;

                    setAiContentType(this.contentType);
                    this.updateAiAppConfigs();
                })
                // an unnamed, empty content is created before a new wizard renders
                .then(() => this.getPersistedItem() ?? this.saveChanges())
                .then((loadedContent: Content) => {
                    // persisted item is always present now
                    // for existing content it was loaded
                    // for new content it was just created
                    const currentItem: Content = this.getCurrentItem();
                    this.initOrUpdateSiteModel(currentItem.isSite() ? (currentItem as Site) : this.site);
                    this.liveEditModel = this.initLiveEditModel(currentItem);

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
        const toolbar = new ContentWizardToolbarElement({ previewAction: this.wizardActions.getPreviewAction() });
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

                    if (!shown && this.liveMask?.isVisible()) {
                        this.liveMask.hide();
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
        this.liveEditPage = new LiveEditPageProxy(this.liveEditModel);

        const liveFormPanel: LiveFormPanel = new LiveFormPanel({
            contentWizardPanel: this,
            contentType: this.contentType,
            liveEditPage: this.liveEditPage,
            liveEditModel: this.liveEditModel,
        } as LiveFormPanelConfig);

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
        // Scope the load mask to the frame contents (image editor + iframe wrapper) so
        // the preview toolbar above them stays interactive while the preview is loading.
        this.liveMask = new LoadMask(this.livePanel.getFrameContainer().getContents()).addClass(
            'live-load-mask',
        ) as LoadMask;

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

    saveChanges(options: WizardSaveOptions = {}): Q.Promise<Content> {
        const { clearInspection = false, reloadPageEditor = true, renamed = false } = options;
        // save happens right after data loaded with new content
        // so layout is not done yet and livePanel is not present yet
        this.livePanel?.skipNextReloadConfirmation(true);

        this.contentUpdateDisabled = true;
        new BeforeContentSavedEvent().fire();
        const previousPersistedItem = this.getPersistedItem();

        return Q(
            previousPersistedItem ? this.updatePersistedContent(previousPersistedItem, renamed) : this.createContent(),
        )
            .then(() => {
                const currentContent = this.getCurrentItem();

                if (ContentWizardPanel.debug) {
                    console.debug('ContentWizardPanel.saveChanges for: ' + currentContent.getPath().toString());
                }

                return Q.Promise<Content>((resolve, reject) => {
                    if (!currentContent.equals(previousPersistedItem)) {
                        // needed before loadPage in case content was moved
                        // because content path is used to load the page
                        this.updateLiveEditModel(currentContent);

                        setWizardContent(this.getContent().getContentSummary());

                        if (reloadPageEditor && this.livePanel) {
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
            this.handleContentNamed(content);
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

    private isCurrentTemplateId(id: ContentId): boolean {
        return (
            this.getPersistedItem() &&
            id &&
            this.getPersistedItem().getPage()?.getTemplate()?.toString() === id.toString()
        );
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
                this.saveChanges({ clearInspection: true }).catch(DefaultErrorHandler.handle);
            } else {
                void this.getLivePanel()?.loadPage(true);
            }
        });

        // to be changed: make default models static and remove that call by directly using DefaultModels in PageState
        PageEventsManager.get().onCustomizePageRequested(() => {
            this.getTemplateForCustomize()
                .then((template: PageTemplate) => {
                    if (template) {
                        PageEventsManager.get().notifySetCustomizedPageRequested(template);
                    }
                })
                .catch(DefaultErrorHandler.handle);
        });

        PageEventsManager.get().onPageReloadRequested(() => {
            this.getLivePanel()?.loadPage(false);
        });

        let firstLoad = true;
        ViewExtensionEvent.on((event: ViewExtensionEvent) => {
            this.getLivePanel()
                ?.loadPage()
                .then(() => {
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
            otherContentUpdated: (summary) => {
                this.handleOtherContentUpdate(summary);

                if (this.isParentSiteModified(summary.getContentId())) {
                    Q(loadNearestSite(summary.getContentId()))
                        .then(this.updateSiteModel.bind(this))
                        .catch(DefaultErrorHandler.handle)
                        .done();
                }
            },
            templatesDeleted: (ids) => this.handleTemplateDelete(ids),
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
                .catch(DefaultErrorHandler.handle)
                .done();
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
            Q(loadDefaultModels(this.site, this.getPersistedItem().getType()))
                .then((defaultModels: DefaultModels) => {
                    const isAutoUpdated: boolean =
                        this.defaultModels.getDefaultPageTemplate()?.getId() === template.getId() ||
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
                })
                .catch(DefaultErrorHandler.handle);
        }
    }

    /*
     * Callback on page template deleted server event, for a template under the
     * same root as the current content. The deleted template may be the selected
     * one, or the one an automatically rendered page resolves to, so the default
     * models are reloaded and the editor follows when either is affected.
     * */
    private handleTemplateDelete(deletedIds: ContentId[]): void {
        const isCurrentTemplate: boolean = deletedIds.some((id: ContentId) => this.isCurrentTemplateId(id));
        const previousTemplateId: string = this.defaultModels?.getDefaultPageTemplate()?.getId() ?? null;

        Q(loadDefaultModels(this.site, this.getPersistedItem().getType()))
            .then((defaultModels: DefaultModels) => {
                const templateId: string = defaultModels?.getDefaultPageTemplate()?.getId() ?? null;
                const hasDefaultChanged: boolean = templateId !== previousTemplateId;

                if (hasDefaultChanged) {
                    this.defaultModels = defaultModels;

                    // defaultModels is part of liveEditModel so need to update it
                    const modelTemplateId: string =
                        this.liveEditModel?.getDefaultModels()?.getDefaultPageTemplate()?.getId() ?? null;

                    if (this.liveEditModel && modelTemplateId !== templateId) {
                        this.updateLiveEditModel(this.getPersistedItem());
                    }
                }

                if (isCurrentTemplate || hasDefaultChanged) {
                    this.debouncedEditorReload(false, true, true);
                }
            })
            .catch((error: unknown) => {
                if (isCurrentTemplate) {
                    this.debouncedEditorReload(false, true, true);
                }

                DefaultErrorHandler.handle(error);
            });
    }

    private isSameRootWithPersisted(item: ContentSummaryAndCompareStatus): boolean {
        return item.getPath().getRootElement() === this.getPersistedItem().getPath().getRootElement();
    }

    private isParentSiteUpdated(updatedContent: ContentSummaryAndCompareStatus): boolean {
        return (
            updatedContent.getType().isSite() &&
            this.getPersistedItem().getPath().isDescendantOf(updatedContent.getPath())
        );
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

        this.initOrUpdateSiteModel(content.isSite() ? (content as Site) : this.site);
        this.liveEditModel = this.initLiveEditModel(content);
        this.livePanel?.setModel(this.liveEditModel);
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

    private updateSiteModel(site: Site): void {
        this.siteModel.update(site);
        this.site = site;
        this.updateAiAppConfigs();
    }

    private initOrUpdateSiteModel(site: Site): void {
        if (!site) return;

        if (this.siteModel) {
            this.updateSiteModel(site);
        } else {
            this.siteModel = new SiteModel(site);
        }
    }

    private initLiveEditModel(content: Content): LiveEditModel {
        return LiveEditModel.create()
            .setContent(content)
            .setCompareStatus(this.currentCompareStatus)
            .setSiteModel(this.siteModel)
            .setDefaultTemplate(this.defaultModels)
            .build();
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

    private handleContentNamed(content: Content): void {
        // Content path has changed so update site as well.
        if (content.isSite()) {
            this.site = content as Site;
            return;
        }

        loadNearestSite(content.getContentId())
            .then((site) => {
                this.site = site;
            })
            .catch(DefaultErrorHandler.handle);
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

    private getTemplateForCustomize(): Q.Promise<PageTemplate> {
        const page = PageState.getState();

        // A page with its own controller is already detached from any template.
        if (page?.hasController()) {
            return Q.resolve(null);
        }

        const currentTemplateKey = page?.getTemplate();

        if (currentTemplateKey && !currentTemplateKey.equals(this.defaultModels?.getDefaultPageTemplate()?.getKey())) {
            return new GetPageTemplateByKeyRequest(currentTemplateKey).sendAndParse();
        }

        return Q.resolve(this.defaultModels?.getDefaultPageTemplate());
    }

    private updateAiAppConfigs(): void {
        updateAiAppConfigs(
            this.site?.getSiteConfigs().map(fromLegacyApplicationConfig),
            getActiveProject().getSiteConfigs().map(fromLegacyApplicationConfig),
        );
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
