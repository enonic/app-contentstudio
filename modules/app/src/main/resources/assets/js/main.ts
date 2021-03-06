import * as $ from 'jquery';
import * as Q from 'q';
// Polyfills added for compatibility with IE11
import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';
import 'mutation-observer';
// End of Polyfills
import {Element} from 'lib-admin-ui/dom/Element';
import {showError, showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {Router} from 'lib-contentstudio/app/Router';
import {ContentDeletePromptEvent} from 'lib-contentstudio/app/browse/ContentDeletePromptEvent';
import {ContentPublishPromptEvent} from 'lib-contentstudio/app/browse/ContentPublishPromptEvent';
import {ContentUnpublishPromptEvent} from 'lib-contentstudio/app/browse/ContentUnpublishPromptEvent';
import {ShowNewContentDialogEvent} from 'lib-contentstudio/app/browse/ShowNewContentDialogEvent';
import {ContentWizardPanelParams} from 'lib-contentstudio/app/wizard/ContentWizardPanelParams';
import {ContentEventsProcessor} from 'lib-contentstudio/app/ContentEventsProcessor';
import {IssueServerEventsHandler} from 'lib-contentstudio/app/issue/event/IssueServerEventsHandler';
import {CreateIssuePromptEvent} from 'lib-contentstudio/app/browse/CreateIssuePromptEvent';
import {IssueDialogsManager} from 'lib-contentstudio/app/issue/IssueDialogsManager';
import {ShowIssuesDialogEvent} from 'lib-contentstudio/app/browse/ShowIssuesDialogEvent';
import {ContentDuplicatePromptEvent} from 'lib-contentstudio/app/browse/ContentDuplicatePromptEvent';
import {GetContentTypeByNameRequest} from 'lib-contentstudio/app/resource/GetContentTypeByNameRequest';
import {ShowDependenciesEvent} from 'lib-contentstudio/app/browse/ShowDependenciesEvent';
import {GetContentByIdRequest} from 'lib-contentstudio/app/resource/GetContentByIdRequest';
import {GetContentByPathRequest} from 'lib-contentstudio/app/resource/GetContentByPathRequest';
import {ContentServerEventsHandler} from 'lib-contentstudio/app/event/ContentServerEventsHandler';
import {EditContentEvent} from 'lib-contentstudio/app/event/EditContentEvent';
import {Content} from 'lib-contentstudio/app/content/Content';
import {ContentUpdatedEvent} from 'lib-contentstudio/app/event/ContentUpdatedEvent';
import {RequestContentPublishPromptEvent} from 'lib-contentstudio/app/browse/RequestContentPublishPromptEvent';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {ConnectionDetector} from 'lib-admin-ui/system/ConnectionDetector';
import {Body} from 'lib-admin-ui/dom/Body';
import {Application} from 'lib-admin-ui/app/Application';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {ElementRemovedEvent} from 'lib-admin-ui/dom/ElementRemovedEvent';
import {ElementRegistry} from 'lib-admin-ui/dom/ElementRegistry';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {WindowDOM} from 'lib-admin-ui/dom/WindowDOM';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {PropertyChangedEvent} from 'lib-admin-ui/PropertyChangedEvent';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {ContentAppHelper} from 'lib-contentstudio/app/wizard/ContentAppHelper';
import {ProjectContext} from 'lib-contentstudio/app/project/ProjectContext';
import {AggregatedServerEventsListener} from 'lib-contentstudio/app/event/AggregatedServerEventsListener';
import {Project} from 'lib-contentstudio/app/settings/data/project/Project';
import {ProjectSelectionDialog} from 'lib-contentstudio/app/settings/dialog/ProjectSelectionDialog';
import {SettingsServerEventsListener} from 'lib-contentstudio/app/settings/event/SettingsServerEventsListener';
import {UrlAction} from 'lib-contentstudio/app/UrlAction';
import {Path} from 'lib-admin-ui/rest/Path';
import {ProjectListWithMissingRequest} from 'lib-contentstudio/app/settings/resource/ProjectListWithMissingRequest';
import {ProjectHelper} from 'lib-contentstudio/app/settings/data/project/ProjectHelper';
import {ContentIconUrlResolver} from 'lib-contentstudio/app/content/ContentIconUrlResolver';
import {ContentSummary} from 'lib-contentstudio/app/content/ContentSummary';
import {NamePrettyfier} from 'lib-admin-ui/NamePrettyfier';

// Dynamically import and execute all input types, since they are used
// on-demand, when parsing XML schemas and has not real usage in app
declare var require: { context: (directory: string, useSubdirectories: boolean, filter: RegExp) => void };
const importAll = r => r.keys().forEach(r);
importAll(require.context('lib-contentstudio/app/inputtype', true, /^(?!\.[\/\\](ui)).*(\.js)$/));

const body = Body.get();

function getApplication(): Application {
    const application = new Application(
        'content-studio',
        i18n('app.name'),
        i18n('app.abbr')
    );
    application.setPath(processApplicationPath());
    application.setWindow(window);

    return application;
}

function processApplicationPath(): Path {
    const path: Path = Router.getPath();

    if (path.getElement(0) !== UrlAction.ISSUE) {
        return path;
    }

    Router.get().setHash(path.toString());

    return Router.getPath();
}

function startLostConnectionDetector(): ConnectionDetector {
    let readonlyMessageId: string;

    const connectionDetector: ConnectionDetector =
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
    let appStatusCheckInterval;

    ApplicationEvent.on((event: ApplicationEvent) => {
        if (ApplicationEventType.STOPPED === event.getEventType() ||
            ApplicationEventType.UNINSTALLED === event.getEventType()) {
            if (appStatusCheckInterval) {
                return;
            }
            appStatusCheckInterval = setInterval(() => {
                if (!messageId && CONFIG.appId === event.getApplicationKey().toString()) {
                    NotifyManager.get().hide(messageId);
                    messageId = showError(i18n('notify.application.notAvailable'), false);
                }
            }, 1000);
        }
        if (ApplicationEventType.STARTED === event.getEventType() || ApplicationEventType.INSTALLED) {
            if (messageId) {
                NotifyManager.get().hide(messageId);
                messageId = null;
            }
            clearInterval(appStatusCheckInterval);
        }
    });
}

function initToolTip() {
    const ID = StyleHelper.getCls('tooltip', StyleHelper.COMMON_PREFIX);
    const CLS_ON = 'tooltip_ON';
    const FOLLOW = false;
    const DATA = '_tooltip';
    const OFFSET_X = 0;
    const OFFSET_Y = 20;

    let pageX = 0;
    let pageY = 0;
    let isVisibleCheckInterval;

    const showAt = function (e: JQuery.MouseEventBase, forceTarget?: HTMLElement) {
        let top = e.clientY + OFFSET_Y;
        let left = e.clientX + OFFSET_X;
        const tooltipHeight = 30;

        const target = forceTarget || e.currentTarget || e.target;
        const tooltipText = $(target).data(DATA);
        if (!tooltipText) { //if no text then probably hovering over children of original element that has title attr
            return;
        }

        const tooltipWidth = tooltipText.length * 7.5;
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();
        if (left + tooltipWidth >= windowWidth) {
            left = windowWidth - tooltipWidth;
        }
        if (top + tooltipHeight >= windowHeight) {
            top = windowHeight - tooltipHeight;
        }
        $(`#${ID}`).remove();
        $(`<div id='${ID}' />`).text(tooltipText).css({
            position: 'absolute', top, left, whiteSpace: 'nowrap'
        }).appendTo('body').show();
    };

    const addTooltip = (e: JQuery.MouseEventBase, forceTarget?: HTMLElement) => {
        const target = forceTarget || e.currentTarget || e.target;
        $(target).data(DATA, $(target).attr('title'));
        $(target).removeAttr('title').addClass(CLS_ON);
        if (e.clientX) {
            pageX = e.clientX;
        }
        if (e.clientY) {
            pageY = e.clientY;
        }
        showAt(e, target);
        onRemovedOrHidden(<HTMLElement>target);
        $(target).on('click', removeTooltipOnClick);
    };

    const removeTooltipOnClick = (e: JQuery.MouseEventBase) => {
        setTimeout(() => removeTooltip(e), 100);
    };

    const removeTooltip = (e: any) => {
        const tooltip = $('#' + ID);
        if (!tooltip.length) {
            return;
        }
        const target = e.currentTarget || e.target;
        $(target).off('click', removeTooltipOnClick);

        const oldTitle = $(target).data(DATA);
        const newTitle = $(target).attr('title');
        if (newTitle) {
            $(target).attr('title', newTitle);
        } else if (oldTitle) {
            $(target).attr('title', oldTitle);
        }

        $(target).removeClass(CLS_ON);
        tooltip.remove();
        unRemovedOrHidden();
        clearInterval(isVisibleCheckInterval);
        if (newTitle) {
            addTooltip(e, target);
        }
    };

    $(document).on('mouseenter', '*[title]:not([title=""]):not([disabled]):visible', addTooltip);
    $(document).on('mouseleave', `.${CLS_ON}`, removeTooltip);
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
            const projectName: string = application.getPath().getElement(0);
            // body is not rendered if the tab is in background
            if (wizardParams.contentId) {
                new GetContentByIdRequest(wizardParams.contentId).setRequestProjectName(projectName).sendAndParse().then(
                    (content: Content) => {
                        refreshTab(content);

                        if (shouldUpdateFavicon(content.getType())) {
                            refreshTabOnContentUpdate(content);
                        }

                    });
            } else {
                new GetContentTypeByNameRequest(wizardParams.contentTypeName).setRequestProjectName(projectName).sendAndParse().then(
                    (contentType) => {
                        updateTabTitle(NamePrettyfier.prettifyUnnamed(contentType.getDisplayName()));
                    });
            }
        }
    }
}

function startServerEventListeners(application: Application) {
    const serverEventsListener: AggregatedServerEventsListener = new AggregatedServerEventsListener([application]);
    let wsConnectionErrorId: string;

    serverEventsListener.onConnectionError(() => {
        if (!wsConnectionErrorId) {
            const pollHandler: () => void = () => {
                if (ConnectionDetector.get().isConnected()) {
                    wsConnectionErrorId = showError(i18n('notify.websockets.error'), false);
                }

                ConnectionDetector.get().unPoll(pollHandler);
            };

            ConnectionDetector.get().onPoll(pollHandler);
        }
    });

    serverEventsListener.onConnectionRestored(() => {
        if (wsConnectionErrorId) {
            NotifyManager.get().hide(wsConnectionErrorId);
            wsConnectionErrorId = null;
        }
    });

    serverEventsListener.start();

    // tslint:disable-next-line:no-unused-expression
    new SettingsServerEventsListener([application]);
}

async function startApplication() {
    const application: Application = getApplication();
    const connectionDetector = startLostConnectionDetector();

    startServerEventListeners(application);

    initApplicationEventListener();
    initProjectContext(application)
        .catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
            NotifyManager.get().showWarning(i18n('notify.settings.project.initFailed'));
        })
        .finally(() => {
            if (ContentAppHelper.isContentWizard(application)) {
                startContentWizard(ContentAppHelper.createWizardParamsFromApp(application), connectionDetector);
            } else {
                startContentBrowser(application);
            }
        });

    initToolTip();

    AppHelper.preventDragRedirect();

    const ContentDuplicateDialog = (await import('lib-contentstudio/app/duplicate/ContentDuplicateDialog')).ContentDuplicateDialog;

    const contentDuplicateDialog = new ContentDuplicateDialog();
    ContentDuplicatePromptEvent.on((event) => {
        contentDuplicateDialog
            .setContentToDuplicate(event.getModels())
            .setYesCallback(event.getYesCallback())
            .setNoCallback(event.getNoCallback())
            .setOpenTabAfterDuplicate(event.getOpenActionAfterDuplicate())
            .open();
    });

    const ContentDeleteDialog = (await import('lib-contentstudio/app/remove/ContentDeleteDialog')).ContentDeleteDialog;
    const contentDeleteDialog = new ContentDeleteDialog();
    ContentDeletePromptEvent.on((event) => {
        contentDeleteDialog
            .setContentToDelete(event.getModels())
            .setYesCallback(event.getYesCallback())
            .setNoCallback(event.getNoCallback())
            .open();
    });

    const ContentPublishDialog = (await import('lib-contentstudio/app/publish/ContentPublishDialog')).ContentPublishDialog;
    const contentPublishDialog = ContentPublishDialog.get();
    ContentPublishPromptEvent.on((event) => {
        contentPublishDialog
            .setContentToPublish(event.getModels())
            .setIncludeChildItems(event.isIncludeChildItems(), event.getExceptedContentIds())
            .setMessage(event.getMessage())
            .setExcludedIds(event.getExcludedIds())
            .open();
    });

    const ContentUnpublishDialog = (await import('lib-contentstudio/app/publish/ContentUnpublishDialog')).ContentUnpublishDialog;
    const contentUnpublishDialog = new ContentUnpublishDialog();
    ContentUnpublishPromptEvent.on((event) => {
        contentUnpublishDialog
            .setContentToUnpublish(event.getModels())
            .open();
    });

    RequestContentPublishPromptEvent.on(
        (event) => IssueDialogsManager.get().openCreateRequestDialog(event.getModels(), event.isIncludeChildItems()));

    CreateIssuePromptEvent.on((event) => IssueDialogsManager.get().openCreateDialog(event.getModels()));

    ShowIssuesDialogEvent.on((event: ShowIssuesDialogEvent) =>
        IssueDialogsManager.get().openListDialog(event.getAssignedToMe()));

    ShowDependenciesEvent.on(ContentEventsProcessor.handleShowDependencies);

    const EditPermissionsDialog = (await import('lib-contentstudio/app/wizard/EditPermissionsDialog')).EditPermissionsDialog;
    // tslint:disable-next-line:no-unused-expression
    new EditPermissionsDialog();

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

async function startContentWizard(wizardParams: ContentWizardPanelParams, connectionDetector: ConnectionDetector) {
    const ContentWizardPanel = (await import('lib-contentstudio/app/wizard/ContentWizardPanel')).ContentWizardPanel;

    let wizard = new ContentWizardPanel(wizardParams, getTheme());

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
            updateTabTitle(content.getDisplayName() || NamePrettyfier.prettifyUnnamed(contentType.getDisplayName()));
        }
    });
    wizard.onWizardHeaderCreated(() => {
        // header will be ready after rendering is complete
        wizard.getWizardHeader().onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === 'displayName') {
                let contentType = wizard.getContentType();
                let name = <string>event.getNewValue() || NamePrettyfier.prettifyUnnamed(contentType.getDisplayName());

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

    EditContentEvent.on(ContentEventsProcessor.handleEdit);

    Body.get().addClass('wizard-page').appendChild(wizard);
}

function getTheme(): string {
    return CONFIG.theme ? (`theme-${CONFIG.theme}` || '') : '';
}

async function startContentBrowser(application: Application) {

    await import ('lib-contentstudio/app/ContentAppPanel');
    const AppWrapper = (await import ('lib-contentstudio/app/AppWrapper')).AppWrapper;
    const commonWrapper = new AppWrapper(application, getTheme());
    body.appendChild(commonWrapper);

    const NewContentDialog = (await import ('lib-contentstudio/app/create/NewContentDialog')).NewContentDialog;

    const newContentDialog = new NewContentDialog();
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

    const IssueListDialog = (await import('lib-contentstudio/app/issue/view/IssueListDialog')).IssueListDialog;
    const SortContentDialog = (await import('lib-contentstudio/app/browse/sort/dialog/SortContentDialog')).SortContentDialog;
    const MoveContentDialog = (await import('lib-contentstudio/app/move/MoveContentDialog')).MoveContentDialog;

    // tslint:disable-next-line:no-unused-expression
    IssueListDialog.get();

    // tslint:disable-next-line:no-unused-expression
    new SortContentDialog();

    // tslint:disable-next-line:no-unused-expression
    new MoveContentDialog();
}

function initProjectContext(application: Application): Q.Promise<void> {
    return new ProjectListWithMissingRequest().sendAndParse().then((projects: Project[]) => {
        ProjectSelectionDialog.get().setProjects(projects);

        const projectName: string = application.getPath().getElement(0) || localStorage.getItem(ProjectContext.LOCAL_STORAGE_KEY);

        if (projectName) {
            const currentProject: Project =
                projects.find((project: Project) => ProjectHelper.isAvailable(project) && project.getName() === projectName);

            if (currentProject) {
                ProjectContext.get().setProject(currentProject);
                return Q(null);
            }
        }

        if (projects.length === 1 && ProjectHelper.isAvailable(projects[0])) {
            ProjectContext.get().setProject(projects[0]);
            return Q(null);
        }

        if (projects.length === 0) {
            ProjectContext.get().setNotAvailable();
        }

        ProjectSelectionDialog.get().open();

        return Q(null);
    });
}

(async () => {
    await i18nInit(CONFIG.services.i18nUrl);

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
