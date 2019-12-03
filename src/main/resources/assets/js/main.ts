import i18n = api.util.i18n;
import ContentTypeName = api.schema.content.ContentTypeName;
import ContentIconUrlResolver = api.content.util.ContentIconUrlResolver;
import ImgEl = api.dom.ImgEl;
import ConnectionDetector = api.system.ConnectionDetector;

// This is added for backwards compatibility of those widgets that use
// window['HTMLImports'].whenReady(...) to embed their contents.
// In 3.0 we should remove this import, remove the dependency from package.json,
// fix the widgets that are using window['HTMLImports'] object
// and update the docs on widgets to suggest a different way for embedding.
import '@webcomponents/html-imports';
import {Router} from './app/Router';
import {ContentDeletePromptEvent} from './app/browse/ContentDeletePromptEvent';
import {ContentPublishPromptEvent} from './app/browse/ContentPublishPromptEvent';
import {ContentUnpublishPromptEvent} from './app/browse/ContentUnpublishPromptEvent';
import {ShowNewContentDialogEvent} from './app/browse/ShowNewContentDialogEvent';
import {ContentWizardPanelParams} from './app/wizard/ContentWizardPanelParams';
import {ContentEventsListener} from './app/ContentEventsListener';
import {ContentEventsProcessor} from './app/ContentEventsProcessor';
import {IssueServerEventsHandler} from './app/issue/event/IssueServerEventsHandler';
import {CreateIssuePromptEvent} from './app/browse/CreateIssuePromptEvent';
import {IssueDialogsManager} from './app/issue/IssueDialogsManager';
import {ShowIssuesDialogEvent} from './app/browse/ShowIssuesDialogEvent';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from './app/browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './app/browse/ToggleSearchPanelWithDependenciesEvent';
import {ContentDuplicatePromptEvent} from './app/browse/ContentDuplicatePromptEvent';
import {ShowIssuesDialogButton} from './app/issue/view/ShowIssuesDialogButton';
import {GetContentTypeByNameRequest} from './app/resource/GetContentTypeByNameRequest';
import {ShowDependenciesEvent} from './app/browse/ShowDependenciesEvent';
import {GetContentByIdRequest} from './app/resource/GetContentByIdRequest';
import {GetContentByPathRequest} from './app/resource/GetContentByPathRequest';
import {ContentServerEventsHandler} from './app/event/ContentServerEventsHandler';
import {AggregatedServerEventsListener} from './app/event/AggregatedServerEventsListener';
import {EditContentEvent} from './app/event/EditContentEvent';
import {Content} from './app/content/Content';
import {ContentSummaryAndCompareStatus} from './app/content/ContentSummaryAndCompareStatus';
import {ContentUpdatedEvent} from './app/event/ContentUpdatedEvent';
import {RequestContentPublishPromptEvent} from './app/browse/RequestContentPublishPromptEvent';

declare const CONFIG;

const body = api.dom.Body.get();

// Dynamically import and execute all input types, since they are used
// on-demand, when parsing XML schemas and has not real usage in app
declare var require: { context: (directory: string, useSubdirectories: boolean, filter: RegExp) => void };
const importAll = r => r.keys().forEach(r);
importAll(require.context('./app/inputtype', true, /^(?!\.[\/\\]ui).*/));

function getApplication(): api.app.Application {
    const application = new api.app.Application(
        'content-studio',
        i18n('app.name'),
        i18n('app.abbr'),
        CONFIG.appIconUrl,
        `${i18n('app.name')} v${CONFIG.appVersion}`
    );
    application.setPath(api.rest.Path.fromString(Router.getPath()));
    application.setWindow(window);

    return application;
}

function startLostConnectionDetector(): ConnectionDetector {
    let readonlyMessageId;

    const connectionDetector =
        ConnectionDetector.get()
        .setAuthenticated(true)
        .setSessionExpireRedirectUrl(api.util.UriHelper.getToolUri(''))
        .setNotificationMessage(i18n('notify.connection.loss'));

    connectionDetector.onReadonlyStatusChanged((readonly: boolean) => {
        if (readonly && !readonlyMessageId) {
            readonlyMessageId = api.notify.showWarning(i18n('notify.repo.readonly'), false);
        } else if (readonlyMessageId) {
            api.notify.NotifyManager.get().hide(readonlyMessageId);
            readonlyMessageId = null;
        }
    });
    connectionDetector.startPolling(true);

    return connectionDetector;
}

function initApplicationEventListener() {

    let messageId;

    api.application.ApplicationEvent.on((event: api.application.ApplicationEvent) => {
        if (api.application.ApplicationEventType.STOPPED === event.getEventType() || api.application.ApplicationEventType.UNINSTALLED ===
            event.getEventType()) {
            if (CONFIG.appId === event.getApplicationKey().toString()) {
                api.notify.NotifyManager.get().hide(messageId);
                messageId = api.notify.showError(i18n('notify.no_connection'), false);
            }
        }
        if (api.application.ApplicationEventType.STARTED === event.getEventType() || api.application.ApplicationEventType.INSTALLED) {
            api.notify.NotifyManager.get().hide(messageId);
        }
    });
}

function initToolTip() {
    const ID = api.StyleHelper.getCls('tooltip', api.StyleHelper.COMMON_PREFIX);
    const CLS_ON = 'tooltip_ON';
    const FOLLOW = true;
    const DATA = '_tooltip';
    const OFFSET_X = 0;
    const OFFSET_Y = 20;

    let pageX = 0;
    let pageY = 0;
    let isVisibleCheckInterval;

    const showAt = function (e: any) {
        const top = pageY + OFFSET_Y;
        let left = pageX + OFFSET_X;

        const tooltipText = api.util.StringHelper.escapeHtml(wemjq(e.currentTarget || e.target).data(DATA));
        if (!tooltipText) { //if no text then probably hovering over children of original element that has title attr
            return;
        }

        const tooltipWidth = tooltipText.length * 7.5;
        const windowWidth = wemjq(window).width();
        if (left + tooltipWidth >= windowWidth) {
            left = windowWidth - tooltipWidth;
        }
        wemjq(`#${ID}`).remove();
        wemjq(`<div id='${ID}' />`).html(tooltipText).css({
            position: 'absolute', top, left
        }).appendTo('body').show();
    };

    const addTooltip = (e: JQueryEventObject) => {
        wemjq(e.target).data(DATA, wemjq(e.target).attr('title'));
        wemjq(e.target).removeAttr('title').addClass(CLS_ON);
        if (e.pageX) {
            pageX = e.pageX;
        }
        if (e.pageY) {
            pageY = e.pageY;
        }
        showAt(e);
        onRemovedOrHidden(e.target);
    };

    const removeTooltip = (e: { target: Element }) => {
        if (wemjq(e.target).data(DATA)) {
            wemjq(e.target).attr('title', wemjq(e.target).data(DATA));
        }
        wemjq(e.target).removeClass(CLS_ON);
        wemjq('#' + ID).remove();
        unRemovedOrHidden();
        clearInterval(isVisibleCheckInterval);
    };

    wemjq(document).on('mouseenter', '*[title]:not([title=""]):not([disabled]):visible', addTooltip);
    wemjq(document).on('mouseleave click', `.${CLS_ON}`, removeTooltip);
    if (FOLLOW) {
        wemjq(document).on('mousemove', `.${CLS_ON}`, showAt);
    }

    let element: api.dom.Element;
    const removeHandler = (event: api.dom.ElementRemovedEvent) => {
        const target = event.getElement().getHTMLElement();
        removeTooltip({target});
    };

    const onRemovedOrHidden = (target: Element) => {
        element = api.dom.ElementRegistry.getElementById(target.id);
        if (element) {
            element.onRemoved(removeHandler);
            element.onHidden(removeHandler);
        } else { // seems to be an element without id, thus special handling needed
            isVisibleCheckInterval = setInterval(() => {
                if (!isVisible(target)) {
                    removeTooltip({target});
                    clearInterval(isVisibleCheckInterval);
                }
            }, 500);
        }
    };
    const unRemovedOrHidden = () => {
        if (element) {
            element.unRemoved(removeHandler);
            element.unHidden(removeHandler);
        }
    };
}

function isVisible(target: Element) {
    return wemjq(target).is(':visible');
}

function updateTabTitle(title: string) {
    wemjq('title').html(`${title} / ${i18n('app.name')}`);
}

function shouldUpdateFavicon(contentTypeName: ContentTypeName): boolean {
    // Chrome currently doesn't support SVG favicons which are served for not image contents
    return contentTypeName.isImage() || navigator.userAgent.search('Chrome') === -1;
}

const faviconCache: { [url: string]: Element } = {};

const iconUrlResolver = new ContentIconUrlResolver();

let dataPreloaded: boolean;

function clearFavicon() {
    // save current favicon hrefs
    wemjq('link[rel*=icon][sizes]').each((index, link) => {
        let href = link.getAttribute('href');
        faviconCache[href] = link;
        link.setAttribute('href', ImgEl.PLACEHOLDER);
    });
}

function updateFavicon(content: Content) {
    let resolver = iconUrlResolver.setContent(content).setCrop(false);
    let shouldUpdate = shouldUpdateFavicon(content.getType());
    for (let href in faviconCache) {
        if (faviconCache.hasOwnProperty(href)) {
            let link = faviconCache[href];
            if (shouldUpdate) {
                let sizes = link.getAttribute('sizes').split('x');
                if (sizes.length > 0) {
                    try {
                        resolver.setSize(parseInt(sizes[0], 10));
                    } catch (e) { /* empty */ }
                }
                link.setAttribute('href', resolver.resolve());
            } else {
                link.setAttribute('href', href);
            }
            delete faviconCache[href];
        }
    }
}

const refreshTab = function (content: Content) {
    updateFavicon(content);
    updateTabTitle(content.getDisplayName());
};

function preLoadApplication() {
    let application: api.app.Application = getApplication();
    let wizardParams = ContentWizardPanelParams.fromApp(application);
    if (wizardParams) {
        clearFavicon();

        if (!body.isRendered() && !body.isRendering()) {
            dataPreloaded = true;
            // body is not rendered if the tab is in background
            if (wizardParams.contentId) {
                new GetContentByIdRequest(wizardParams.contentId).sendAndParse().then((content: Content) => {
                    refreshTab(content);

                    if (shouldUpdateFavicon(content.getType())) {
                        refreshTabOnContentUpdate(content);
                    }

                });
            } else {
                new GetContentTypeByNameRequest(wizardParams.contentTypeName).sendAndParse().then((contentType) => {
                    updateTabTitle(api.content.ContentUnnamed.prettifyUnnamed(contentType.getDisplayName()));
                });
            }
        }
    }
}

function startApplication() {

    const application: api.app.Application = getApplication();

    const serverEventsListener = new AggregatedServerEventsListener([application]);
    serverEventsListener.start();

    initApplicationEventListener();

    const connectionDetector = startLostConnectionDetector();

    const wizardParams = ContentWizardPanelParams.fromApp(application);
    if (wizardParams) {
        startContentWizard(wizardParams, connectionDetector);
    } else {
        startContentApplication(application);
    }

    initToolTip();

    api.util.AppHelper.preventDragRedirect();

    import('./app/duplicate/ContentDuplicateDialog').then(def => {
        const contentDuplicateDialog = new def.ContentDuplicateDialog();
        ContentDuplicatePromptEvent.on((event) => {
            contentDuplicateDialog
                .setContentToDuplicate(event.getModels())
                .setYesCallback(event.getYesCallback())
                .setNoCallback(event.getNoCallback())
                .setOpenTabAfterDuplicate(event.getOpenActionAfterDuplicate())
                .open();
        });
    });

    import('./app/remove/ContentDeleteDialog').then(def => {
        const contentDeleteDialog = new def.ContentDeleteDialog();
        ContentDeletePromptEvent.on((event) => {
            contentDeleteDialog
                .setContentToDelete(event.getModels())
                .setYesCallback(event.getYesCallback())
                .setNoCallback(event.getNoCallback())
                .open();
        });
    });

    import('./app/publish/ContentPublishDialog').then(def => {
        const contentPublishDialog = def.ContentPublishDialog.get();
        ContentPublishPromptEvent.on((event) => {
            contentPublishDialog
                .setContentToPublish(event.getModels())
                .setIncludeChildItems(event.isIncludeChildItems(), event.getExceptedContentIds())
                .setMessage(event.getMessage())
                .setExcludedIds(event.getExcludedIds())
                .open();
        });
    });


    import('./app/publish/ContentUnpublishDialog').then(def => {
        const contentUnpublishDialog = new def.ContentUnpublishDialog();
        ContentUnpublishPromptEvent.on((event) => {
            contentUnpublishDialog
                .setContentToUnpublish(event.getModels())
                .open();
        });
    });

    RequestContentPublishPromptEvent.on(
        (event) => IssueDialogsManager.get().openCreateRequestDialog(event.getModels(), event.isIncludeChildItems()));

    CreateIssuePromptEvent.on((event) => IssueDialogsManager.get().openCreateDialog(event.getModels()));

    ShowIssuesDialogEvent.on((event: ShowIssuesDialogEvent) =>
        IssueDialogsManager.get().openListDialog(event.getAssignedToMe()));

    ShowDependenciesEvent.on(ContentEventsProcessor.handleShowDependencies);

    import('./app/wizard/EditPermissionsDialog').then(def => {
        // tslint:disable-next-line:no-unused-expression
        new def.EditPermissionsDialog();
    });

    application.setLoaded(true);

    ContentServerEventsHandler.getInstance().start();
    IssueServerEventsHandler.getInstance().start();
}

const refreshTabOnContentUpdate = (content: Content) => {
    ContentUpdatedEvent.on((event: ContentUpdatedEvent) => {
        if (event.getContentId().equals(content.getContentId())) {
            clearFavicon();
            refreshTab(content);
        }
    });
};

function startContentWizard(wizardParams: ContentWizardPanelParams, connectionDetector: ConnectionDetector) {

    import('./app/wizard/ContentWizardPanel').then(def => {

        let wizard = new def.ContentWizardPanel(wizardParams);

        wizard.onDataLoaded((content: Content) => {
            let contentType = wizard.getContentType();
            if (!wizardParams.contentId || !dataPreloaded) {
                // update favicon for new wizard after content has been created or in case data hasn't been preloaded
                updateFavicon(content);

                if (shouldUpdateFavicon(content.getType())) {
                    refreshTabOnContentUpdate(content);
                }

            }
            if (!dataPreloaded) {
                updateTabTitle(content.getDisplayName() || api.content.ContentUnnamed.prettifyUnnamed(contentType.getDisplayName()));
            }
        });
        wizard.onWizardHeaderCreated(() => {
            // header will be ready after rendering is complete
            wizard.getWizardHeader().onPropertyChanged((event: api.PropertyChangedEvent) => {
                if (event.getPropertyName() === 'displayName') {
                    let contentType = wizard.getContentType();
                    let name = <string>event.getNewValue() || api.content.ContentUnnamed.prettifyUnnamed(contentType.getDisplayName());

                    updateTabTitle(name);
                }
            });
        });

        api.dom.WindowDOM.get().onBeforeUnload(event => {
            if (wizard.isContentDeleted() || !connectionDetector.isConnected() || !connectionDetector.isAuthenticated()) {
                return;
            }
            if (wizard.hasUnsavedChanges() && wizard.hasModifyPermissions()) {
                let message = i18n('dialog.wizard.unsavedChanges');
                // Hack for IE. returnValue is boolean
                const e: any = event || window.event || {returnValue: ''};
                e['returnValue'] = message;
                return message;
            }
        });

        wizard.onClosed(event => window.close());

        // TODO: Remove hack, that connects content events in `FormView`
        api.content.event.FormEditEvent.on((event) => {
            const model = ContentSummaryAndCompareStatus.fromContentSummary(event.getModels());
            new EditContentEvent([model]).fire();
        });
        EditContentEvent.on(ContentEventsProcessor.handleEdit);

        api.dom.Body.get().addClass('wizard-page').appendChild(wizard);
    });
}

function startContentApplication(application: api.app.Application) {

    import('./app/ContentAppPanel').then(cdef => {

        const appBar = new api.app.bar.AppBar(application);

        const appPanel = new cdef.ContentAppPanel(application.getPath());
        const buttonWrapper = new api.dom.DivEl('show-issues-button-wrapper');

        buttonWrapper.appendChild(new ShowIssuesDialogButton());
        appBar.appendChild(buttonWrapper);

        initSearchPanelListener(appPanel);

        const clientEventsListener = new ContentEventsListener();
        clientEventsListener.start();

        appBar.onAdded(() => body.appendChild(appPanel));
        body.appendChild(appBar);

        import('./app/create/NewContentDialog').then(def => {

            const newContentDialog = new def.NewContentDialog();
            ShowNewContentDialogEvent.on((event) => {

                let parentContent: api.content.ContentSummary = event.getParentContent()
                                                                ? event.getParentContent().getContentSummary() : null;

                if (parentContent != null) {
                    new GetContentByIdRequest(parentContent.getContentId()).sendAndParse().then(
                        (newParentContent: Content) => {

                            // TODO: remove pyramid of doom
                            if (parentContent.hasParent() && parentContent.getType().isTemplateFolder()) {
                                new GetContentByPathRequest(parentContent.getPath().getParentPath()).sendAndParse().then(
                                    (grandParent: Content) => {

                                        newContentDialog.setParentContent(newParentContent);
                                        newContentDialog.open();
                                    }).catch((reason: any) => {
                                    api.DefaultErrorHandler.handle(reason);
                                }).done();
                            } else {
                                newContentDialog.setParentContent(newParentContent);
                                newContentDialog.open();
                            }
                        }).catch((reason: any) => {
                        api.DefaultErrorHandler.handle(reason);
                    }).done();
                } else {
                    newContentDialog.setParentContent(null);
                    newContentDialog.open();
                }
            });
        });

        import('./app/issue/view/IssueListDialog').then(def => {
            // tslint:disable-next-line:no-unused-expression
            def.IssueListDialog.get();
        });

        import('./app/browse/SortContentDialog').then(def => {
            // tslint:disable-next-line:no-unused-expression
            new def.SortContentDialog();
        });

        import('./app/move/MoveContentDialog').then(def => {
            // tslint:disable-next-line:no-unused-expression
            new def.MoveContentDialog();
        });

    });
}

function initSearchPanelListener(panel: any) {
    ToggleSearchPanelWithDependenciesGlobalEvent.on((event) => {
        if (!panel.getBrowsePanel().getTreeGrid().isEmpty()) {
            new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
        } else {

            const handler = () => {
                new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
                panel.getBrowsePanel().getTreeGrid().unLoaded(handler);
            };

            panel.getBrowsePanel().getTreeGrid().onLoaded(handler);
        }
    });
}

(async () => {
    await api.util.i18nInit(CONFIG.i18nUrl);

    preLoadApplication();

    const renderListener = () => {
        startApplication();
        body.unRendered(renderListener);
    };
    if (body.isRendered()) {
        renderListener();
    } else {
        body.onRendered(renderListener);
    }
})();
