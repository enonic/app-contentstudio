import * as $ from 'jquery';
// Polyfills added for compatibility with IE11
import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';
import 'mutation-observer';
import {Element} from 'lib-admin-ui/dom/Element';
import {showError, showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {Router} from './app/Router';
import {ContentDeletePromptEvent} from './app/browse/ContentDeletePromptEvent';
import {ContentPublishPromptEvent} from './app/browse/ContentPublishPromptEvent';
import {ContentUnpublishPromptEvent} from './app/browse/ContentUnpublishPromptEvent';
import {ShowNewContentDialogEvent} from './app/browse/ShowNewContentDialogEvent';
import {ContentWizardPanelParams} from './app/wizard/ContentWizardPanelParams';
import {ContentEventsProcessor} from './app/ContentEventsProcessor';
import {IssueServerEventsHandler} from './app/issue/event/IssueServerEventsHandler';
import {CreateIssuePromptEvent} from './app/browse/CreateIssuePromptEvent';
import {IssueDialogsManager} from './app/issue/IssueDialogsManager';
import {ShowIssuesDialogEvent} from './app/browse/ShowIssuesDialogEvent';
import {ContentDuplicatePromptEvent} from './app/browse/ContentDuplicatePromptEvent';
import {GetContentTypeByNameRequest} from './app/resource/GetContentTypeByNameRequest';
import {ShowDependenciesEvent} from './app/browse/ShowDependenciesEvent';
import {GetContentByIdRequest} from './app/resource/GetContentByIdRequest';
import {GetContentByPathRequest} from './app/resource/GetContentByPathRequest';
import {ContentServerEventsHandler} from './app/event/ContentServerEventsHandler';
import {EditContentEvent} from './app/event/EditContentEvent';
import {Content} from './app/content/Content';
import {ContentSummaryAndCompareStatus} from './app/content/ContentSummaryAndCompareStatus';
import {ContentUpdatedEvent} from './app/event/ContentUpdatedEvent';
import {RequestContentPublishPromptEvent} from './app/browse/RequestContentPublishPromptEvent';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {ConnectionDetector} from 'lib-admin-ui/system/ConnectionDetector';
import {Body} from 'lib-admin-ui/dom/Body';
import {Application} from 'lib-admin-ui/app/Application';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {ElementRemovedEvent} from 'lib-admin-ui/dom/ElementRemovedEvent';
import {ElementRegistry} from 'lib-admin-ui/dom/ElementRegistry';
import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {FormEditEvent} from 'lib-admin-ui/content/event/FormEditEvent';
import {WindowDOM} from 'lib-admin-ui/dom/WindowDOM';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {PropertyChangedEvent} from 'lib-admin-ui/PropertyChangedEvent';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {AppWrapper} from './app/AppWrapper';
import {ContentAppHelper} from './app/wizard/ContentAppHelper';
import {ProjectContext} from './app/project/ProjectContext';
import {AggregatedServerEventsListener} from './app/event/AggregatedServerEventsListener';
import {ProjectListRequest} from './app/settings/resource/ProjectListRequest';
import * as Q from 'q';
import {Project} from './app/settings/data/project/Project';
// End of Polyfills

declare const CONFIG;

// Dynamically import and execute all input types, since they are used
// on-demand, when parsing XML schemas and has not real usage in app
declare var require: { context: (directory: string, useSubdirectories: boolean, filter: RegExp) => void };
const importAll = r => r.keys().forEach(r);
importAll(require.context('./app/inputtype', true, /^(?!\.[\/\\]ui).*/));

const body = Body.get();

function getApplication(): Application {
    const application = new Application(
        'content-studio',
        i18n('app.name'),
        i18n('app.abbr'),
        CONFIG.appIconUrl,
        `${i18n('app.name')} v${CONFIG.appVersion}`
    );
    application.setPath(Router.getPath());
    application.setWindow(window);

    return application;
}

function startLostConnectionDetector(): ConnectionDetector {
    let readonlyMessageId;

    const connectionDetector =
        ConnectionDetector.get()
            .setAuthenticated(true)
            .setSessionExpireRedirectUrl(UriHelper.getToolUri(''))
            .setNotificationMessage(i18n('notify.connection.loss'));

    connectionDetector.onReadonlyStatusChanged((readonly: boolean) => {
        if (readonly && !readonlyMessageId) {
            readonlyMessageId = showWarning(i18n('notify.repo.readonly'), false);
        } else if (readonlyMessageId) {
            NotifyManager.get().hide(readonlyMessageId);
            readonlyMessageId = null;
        }
    });
    connectionDetector.startPolling(true);

    return connectionDetector;
}

function initApplicationEventListener() {

    let messageId;

    ApplicationEvent.on((event: ApplicationEvent) => {
        if (ApplicationEventType.STOPPED === event.getEventType() || ApplicationEventType.UNINSTALLED ===
            event.getEventType()) {
            if (CONFIG.appId === event.getApplicationKey().toString()) {
                NotifyManager.get().hide(messageId);
                messageId = showError(i18n('notify.no_connection'), false);
            }
        }
        if (ApplicationEventType.STARTED === event.getEventType() || ApplicationEventType.INSTALLED) {
            NotifyManager.get().hide(messageId);
        }
    });
}

function initToolTip() {
    const ID = StyleHelper.getCls('tooltip', StyleHelper.COMMON_PREFIX);
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

        const tooltipText = StringHelper.escapeHtml($(e.currentTarget || e.target).data(DATA));
        if (!tooltipText) { //if no text then probably hovering over children of original element that has title attr
            return;
        }

        const tooltipWidth = tooltipText.length * 7.5;
        const windowWidth = $(window).width();
        if (left + tooltipWidth >= windowWidth) {
            left = windowWidth - tooltipWidth;
        }
        $(`#${ID}`).remove();
        $(`<div id='${ID}' />`).text(tooltipText).css({
            position: 'absolute', top, left
        }).appendTo('body').show();
    };

    const addTooltip = (e: JQueryEventObject) => {
        $(e.target).data(DATA, $(e.target).attr('title'));
        $(e.target).removeAttr('title').addClass(CLS_ON);
        if (e.pageX) {
            pageX = e.pageX;
        }
        if (e.pageY) {
            pageY = e.pageY;
        }
        showAt(e);
        onRemovedOrHidden(<HTMLElement>e.target);
    };

    const removeTooltip = (e: { target: HTMLElement }) => {
        if ($(e.target).data(DATA)) {
            $(e.target).attr('title', $(e.target).data(DATA));
        }
        $(e.target).removeClass(CLS_ON);
        $('#' + ID).remove();
        unRemovedOrHidden();
        clearInterval(isVisibleCheckInterval);
    };

    $(document).on('mouseenter', '*[title]:not([title=""]):not([disabled]):visible', addTooltip);
    $(document).on('mouseleave click', `.${CLS_ON}`, removeTooltip);
    if (FOLLOW) {
        $(document).on('mousemove', `.${CLS_ON}`, showAt);
    }

    let element: Element;
    const removeHandler = (event: ElementRemovedEvent) => {
        const target = event.getElement().getHTMLElement();
        removeTooltip({target});
    };

    const onRemovedOrHidden = (target: HTMLElement) => {
        element = ElementRegistry.getElementById(target.id);
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

function isVisible(target: HTMLElement) {
    return $(target).is(':visible');
}

function updateTabTitle(title: string) {
    $('title').text(`${title} / ${i18n('app.name')}`);
}

function shouldUpdateFavicon(contentTypeName: ContentTypeName): boolean {
    // Chrome currently doesn't support SVG favicons which are served for not image contents
    return contentTypeName.isImage() || navigator.userAgent.search('Chrome') === -1;
}

const faviconCache: { [url: string]: HTMLElement } = {};

const iconUrlResolver = new ContentIconUrlResolver();

let dataPreloaded: boolean;

function clearFavicon() {
    // save current favicon hrefs
    $('link[rel*=icon][sizes]').each((index, link: HTMLElement) => {
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
    const application: Application = getApplication();
    if (ContentAppHelper.isContentWizard(application)) {
        clearFavicon();
        const wizardParams: ContentWizardPanelParams = ContentAppHelper.createWizardParamsFromApp(application);

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
                    updateTabTitle(ContentUnnamed.prettifyUnnamed(contentType.getDisplayName()));
                });
            }
        }
    }
}

function startApplication() {
    const application: Application = getApplication();

    const serverEventsListener: AggregatedServerEventsListener = new AggregatedServerEventsListener([application]);
    serverEventsListener.start();

    initApplicationEventListener();
    initProjectContext(application)
        .catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
            NotifyManager.get().showWarning(i18n('notify.settings.project.initFailed'));
        })
        .finally(() => {
            if (ContentAppHelper.isContentWizard(application)) {
                startContentWizard(ContentAppHelper.createWizardParamsFromApp(application));
            } else {
                startContentApplication(application);
            }
        });

    initToolTip();

    AppHelper.preventDragRedirect();

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

function startContentWizard(wizardParams: ContentWizardPanelParams) {
    const connectionDetector = startLostConnectionDetector();

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
                updateTabTitle(content.getDisplayName() || ContentUnnamed.prettifyUnnamed(contentType.getDisplayName()));
            }
        });
        wizard.onWizardHeaderCreated(() => {
            // header will be ready after rendering is complete
            wizard.getWizardHeader().onPropertyChanged((event: PropertyChangedEvent) => {
                if (event.getPropertyName() === 'displayName') {
                    let contentType = wizard.getContentType();
                    let name = <string>event.getNewValue() || ContentUnnamed.prettifyUnnamed(contentType.getDisplayName());

                    updateTabTitle(name);
                }
            });
        });

        WindowDOM.get().onBeforeUnload(event => {
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
        FormEditEvent.on((event) => {
            const model = ContentSummaryAndCompareStatus.fromContentSummary(event.getModels());
            new EditContentEvent([model]).fire();
        });
        EditContentEvent.on(ContentEventsProcessor.handleEdit);

        Body.get().addClass('wizard-page').appendChild(wizard);
    });
}

function startContentApplication(application: Application) {

    import('./app/ContentAppPanel').then(cdef => {
        const commonWrapper = new AppWrapper(application);
        body.appendChild(commonWrapper);

        import('./app/create/NewContentDialog').then(def => {

            const newContentDialog = new def.NewContentDialog();
            ShowNewContentDialogEvent.on((event) => {

                let parentContent: ContentSummary = event.getParentContent()
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
                                    DefaultErrorHandler.handle(reason);
                                }).done();
                            } else {
                                newContentDialog.setParentContent(newParentContent);
                                newContentDialog.open();
                            }
                        }).catch((reason: any) => {
                        DefaultErrorHandler.handle(reason);
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

function initProjectContext(application: Application): Q.Promise<void> {
    const projectName: string = application.getPath().getElement(0);

    return new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
        const isProjectExisting: boolean = projects.some((project: Project) => project.getName() === projectName);
        if (isProjectExisting) {
            ProjectContext.get().setProject(projectName);
            return Q(null);
        }

        if (projects.length > 0) {
            ProjectContext.get().setProject(projects[0].getName());
            NotifyManager.get().showWarning(i18n('notify.settings.project.notExists', projectName));
        }

        return Q(null);
    });
}

(async () => {
    await i18nInit(CONFIG.i18nUrl);

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
