/*global Q, JQuery */

import { Application } from '@enonic/lib-admin-ui/app/Application';
import { ApplicationEvent, ApplicationEventType } from '@enonic/lib-admin-ui/application/ApplicationEvent';
import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import { Message } from '@enonic/lib-admin-ui/notify/Message';
import { NotifyManager } from '@enonic/lib-admin-ui/notify/NotifyManager';
import { Path } from '@enonic/lib-admin-ui/rest/Path';
import { Principal } from '@enonic/lib-admin-ui/security/Principal';
import { PrincipalJson } from '@enonic/lib-admin-ui/security/PrincipalJson';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import { CONFIG, ConfigObject } from '@enonic/lib-admin-ui/util/Config';
import { i18n, Messages } from '@enonic/lib-admin-ui/util/Messages';
import { setPhrases } from '@enonic/lib-contentstudio/v6/shared/i18n';
import { mountAdminMenu } from '@enonic/lib-contentstudio/v6/shared/menu';
import type { Phrases } from '@enonic/ui-utils';
import { ContentDuplicatePromptEvent } from '@enonic/lib-contentstudio/app/browse/ContentDuplicatePromptEvent';
import { ContentPublishPromptEvent } from '@enonic/lib-contentstudio/app/browse/ContentPublishPromptEvent';
import { CreateIssuePromptEvent } from '@enonic/lib-contentstudio/app/browse/CreateIssuePromptEvent';
import { RequestContentPublishPromptEvent } from '@enonic/lib-contentstudio/app/browse/RequestContentPublishPromptEvent';
import { ShowDependenciesEvent } from '@enonic/lib-contentstudio/app/browse/ShowDependenciesEvent';
import { ShowIssuesDialogEvent } from '@enonic/lib-contentstudio/app/browse/ShowIssuesDialogEvent';
import { ShowNewContentDialogEvent } from '@enonic/lib-contentstudio/app/browse/ShowNewContentDialogEvent';
import { Content } from '@enonic/lib-contentstudio/app/content/Content';
import { ContentSummary } from '@enonic/lib-contentstudio/app/content/ContentSummary';
import { ContentEventsListener } from '@enonic/lib-contentstudio/app/ContentEventsListener';
import { ContentEventsProcessor } from '@enonic/lib-contentstudio/app/ContentEventsProcessor';
import { AggregatedServerEventsListener } from '@enonic/lib-contentstudio/app/event/AggregatedServerEventsListener';
import { ContentServerEventsHandler } from '@enonic/lib-contentstudio/app/event/ContentServerEventsHandler';
import { OpenEditPermissionsDialogEvent } from '@enonic/lib-contentstudio/app/event/OpenEditPermissionsDialogEvent';
import { IssueServerEventsHandler } from '@enonic/lib-contentstudio/app/issue/event/IssueServerEventsHandler';
import { IssueDialogsManager } from '@enonic/lib-contentstudio/app/issue/IssueDialogsManager';
import { ContentMovePromptEvent } from '@enonic/lib-contentstudio/app/move/ContentMovePromptEvent';
import { GetContentByIdRequest } from '@enonic/lib-contentstudio/app/resource/GetContentByIdRequest';
import { GetContentByPathRequest } from '@enonic/lib-contentstudio/app/resource/GetContentByPathRequest';
import { GetContentTypeByNameRequest } from '@enonic/lib-contentstudio/app/resource/GetContentTypeByNameRequest';
import { Router } from '@enonic/lib-contentstudio/app/Router';
import { SettingsServerEventsListener } from '@enonic/lib-contentstudio/app/settings/event/SettingsServerEventsListener';
import { $isDown, $isSessionEnded, subscribe as subscribeToWorker } from '@enonic/lib-contentstudio/app/stores/worker';
import { UrlAction } from '@enonic/lib-contentstudio/app/UrlAction';
import { UrlHelper } from '@enonic/lib-contentstudio/app/util/UrlHelper';
import { VersionHelper } from '@enonic/lib-contentstudio/app/util/VersionHelper';
import { ContentAppHelper } from '@enonic/lib-contentstudio/app/wizard/ContentAppHelper';
import { ContentWizardPanelParams } from '@enonic/lib-contentstudio/app/wizard/ContentWizardPanelParams';
import { mountApp } from '@enonic/lib-contentstudio/v6/app/App';
import {
    canShowContentFavicon,
    clearWizardTabFavicon,
    followContentInWizardTab,
    resolveUnnamedTabTitle,
    setWizardTabTitle,
    showContentInWizardTab,
} from '@enonic/lib-contentstudio/v6/pages/wizard/model/wizardTab.service';
import { mountNotifications } from '@enonic/lib-contentstudio/v6/app/notificationsRoot';
import { initAiHost } from '@enonic/lib-contentstudio/v6/features/ai';
import { $isBrowseSidebarOpen } from '@enonic/lib-contentstudio/v6/pages/browse/model/browseSidebar.store';
import { initTheme, setPage } from '@enonic/lib-contentstudio/v6/shared/app-state/app.store';
import { initConfig } from '@enonic/lib-contentstudio/v6/shared/config/config.store';
import { initLanguages } from '@enonic/lib-contentstudio/v6/entities/language/languages.store';
import { initPrincipals } from '@enonic/lib-contentstudio/v6/entities/principal/principals.store';
import { $activeProject } from '@enonic/lib-contentstudio/v6/entities/project/activeProject.store';
import { $projects, initProjects } from '@enonic/lib-contentstudio/v6/entities/project/projects.store';

// Dynamically import and execute all input types, since they are used
// on-demand, when parsing XML schemas and has not real usage in app
declare const require: { context: (directory: string, useSubdirectories: boolean, filter: RegExp) => void };
const importAll = (r) => r.keys().forEach(r);
importAll(require.context('@enonic/lib-contentstudio/app/inputtype', true, /^(?!\.[\/\\](ui)).*(\.js)$/));

function getApplication(): Application {
    const application = new Application(CONFIG.getString('appId'), i18n('admin.tool.displayName'), i18n('app.abbr'));
    application.setPath(processApplicationPath());
    application.setWindow(window);

    return application;
}

function processApplicationPath(): Path {
    const path: Path = Router.getPath();

    if (path.getElement(0) !== UrlAction.ISSUE.toString()) {
        return path;
    }

    Router.get().setHash(path.toString());

    return Router.getPath();
}

function showErrorWithRefresh(text: string): string {
    const message = Message.newError(text, false);
    message.addAction(i18n('action.refresh'), () => window.location.reload());
    return NotifyManager.get().notify(message);
}

function startConnectionNotifier(): void {
    let messageId: string;
    let timeoutId: number;
    let isSessionExpiredShown = false;

    const hideMessage = () => {
        if (messageId) {
            NotifyManager.get().hide(messageId);
            messageId = null;
        }
        isSessionExpiredShown = false;
    };

    const update = () => {
        clearTimeout(timeoutId);

        const isSessionEnded = $isSessionEnded.get();
        if (isSessionEnded && isSessionExpiredShown && NotifyManager.get().getNotification(messageId) != null) {
            return;
        }

        hideMessage();

        if (isSessionEnded) {
            messageId = showErrorWithRefresh(i18n('notify.session.expired'));
            isSessionExpiredShown = true;
            return;
        }

        if ($isDown.get()) {
            timeoutId = window.setTimeout(() => {
                messageId = showErrorWithRefresh(i18n('notify.websockets.error'));
            }, 1000);
        }
    };

    $isSessionEnded.subscribe(update);
    $isDown.subscribe(update);
}

function initApplicationEventListener() {
    let messageId: string;
    let appStatusCheckInterval: number;

    ApplicationEvent.on((event: ApplicationEvent) => {
        if (
            ApplicationEventType.STOPPED === event.getEventType() ||
            ApplicationEventType.UNINSTALLED === event.getEventType()
        ) {
            if (appStatusCheckInterval) {
                return;
            }
            appStatusCheckInterval = window.setInterval(() => {
                if (!messageId && CONFIG.get('appId') === event.getApplicationKey().toString()) {
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

// ? dataPreloaded is set inside the preload .then so that startContentWizard can
// ? skip favicon/title work that already happened. Safe because startApplication
// ? is gated on preLoadPromise — by the time the wizard runs, the request has
// ? resolved and the flag is correct.
let dataPreloaded: boolean = false;

let invalidEditUrlNotificationPending: boolean = false;

let wizardParams: ContentWizardPanelParams | undefined;

function preLoadApplication(): Promise<void> {
    if (!wizardParams) {
        return Promise.resolve();
    }

    const shouldPreloadTabData: boolean = !Body.get().isRendered() && !Body.get().isRendering();

    if (wizardParams.contentId) {
        // ? Request fires regardless of body render state so background tabs with
        // ? invalid bookmarks also get URL cleanup before the user focuses them.
        // ? Favicon/title updates remain gated on shouldPreloadTabData.
        return Promise.resolve(
            new GetContentByIdRequest(wizardParams.contentId)
                .setRequestProjectName(wizardParams.projectName)
                .sendAndParse()
                .then((content: Content) => {
                    if (!shouldPreloadTabData) {
                        return;
                    }
                    dataPreloaded = true;
                    clearWizardTabFavicon();
                    showContentInWizardTab(content);
                    if (canShowContentFavicon(content.getType())) {
                        followContentInWizardTab(content.getContentId());
                    }
                })
                .catch(() => {
                    invalidEditUrlNotificationPending = true;
                    history.replaceState(null, '', UrlHelper.createContentBrowseUrl(wizardParams.projectName));
                    setPage('browse');
                    wizardParams = undefined;
                }),
        ).then(() => undefined);
    }

    if (shouldPreloadTabData) {
        dataPreloaded = true;
        clearWizardTabFavicon();
        new GetContentTypeByNameRequest(wizardParams.contentTypeName).sendAndParse().then((contentType) => {
            setWizardTabTitle(resolveUnnamedTabTitle(contentType.getTitle()));
        });
    }

    return Promise.resolve();
}

function startServerEventListeners(application: Application) {
    subscribeToWorker();

    new AggregatedServerEventsListener(application);
    new SettingsServerEventsListener(application);
}

let contentViewStarted = false;

function isProjectsResolved(): boolean {
    return $projects.get().resolved;
}

function hasActiveProject(): boolean {
    return $activeProject.get() != null;
}

async function startApplication() {
    mountNotifications();
    mountApp();
    initAiHost();

    const application: Application = getApplication();
    startConnectionNotifier();

    startServerEventListeners(application);
    initApplicationEventListener();

    let projectInitFailureShown = false;
    const startResolvedContentView = () => {
        if (contentViewStarted || !isProjectsResolved()) {
            return;
        }

        if ($projects.get().loadError) {
            if (!projectInitFailureShown) {
                projectInitFailureShown = true;
                NotifyManager.get().showWarning(i18n('notify.settings.project.initFailed'));
            }
            return;
        }

        if (!hasActiveProject()) {
            return;
        }

        if (ContentAppHelper.isContentWizardUrl()) {
            contentViewStarted = true;
            startContentWizard();
            return;
        }

        contentViewStarted = true;
        startContentBrowser();
    };

    $projects.subscribe(startResolvedContentView);
    $activeProject.subscribe(startResolvedContentView);
    startResolvedContentView();

    AppHelper.preventDragRedirect();

    const { ContentDuplicateDialog } = await import('@enonic/lib-contentstudio/app/duplicate/ContentDuplicateDialog');
    let contentDuplicateDialog = null;

    ContentDuplicatePromptEvent.on((event) => {
        if (!contentDuplicateDialog) {
            contentDuplicateDialog = new ContentDuplicateDialog();
        }

        contentDuplicateDialog
            .setContentToDuplicate(event.getModels())
            .setYesCallback(event.getYesCallback())
            .setNoCallback(event.getNoCallback())
            .setOpenTabAfterDuplicate(event.getOpenActionAfterDuplicate())
            .open();
    });

    const { MoveContentDialog } = await import('@enonic/lib-contentstudio/app/move/MoveContentDialog');
    let moveContentDialog = null;

    ContentMovePromptEvent.on((event) => {
        if (!moveContentDialog) {
            moveContentDialog = new MoveContentDialog();
        }

        moveContentDialog.handlePromptEvent(event);
    });

    const { ContentPublishDialog } = await import('@enonic/lib-contentstudio/app/publish/ContentPublishDialog');
    let contentPublishDialog = null;

    ContentPublishPromptEvent.on((event) => {
        if (!contentPublishDialog) {
            contentPublishDialog = ContentPublishDialog.get();
        }

        // TODO: Enonic UI - Reference event
        contentPublishDialog
            .setContentToPublish(event.getModels())
            .setKeepDependencies(event.isKeepDependencies())
            .setExcludedIds(event.getExcludedIds())
            .setIncludeChildItems(event.isIncludeChildItems(), event.getExceptedContentIds())
            .setMessage(event.getMessage())
            .open();
    });

    RequestContentPublishPromptEvent.on((event) =>
        IssueDialogsManager.get().openCreateRequestDialog(event.getModels(), event.isIncludeChildItems()),
    );

    CreateIssuePromptEvent.on((event) => IssueDialogsManager.get().openCreateDialog(event.getModels()));

    ShowIssuesDialogEvent.on(() => IssueDialogsManager.get().openListDialog());

    ShowDependenciesEvent.on(ContentEventsProcessor.handleShowDependencies);

    const { openPermissionsDialog } =
        await import('@enonic/lib-contentstudio/v6/features/permissions/model/permissionsDialog.store');

    OpenEditPermissionsDialogEvent.on((event: OpenEditPermissionsDialogEvent) => {
        openPermissionsDialog(event);
    });

    application.setLoaded(true);

    ContentServerEventsHandler.getInstance().start();
    IssueServerEventsHandler.getInstance().start();
}

async function startContentWizard() {
    const { startWizardApp } = await import('@enonic/lib-contentstudio/v6/app/wizardApp');

    startWizardApp(wizardParams, { theme: getTheme(), tabPreloaded: dataPreloaded });
}

function getTheme(): string {
    if (CONFIG.has('theme')) {
        return `theme-${CONFIG.getString('theme')}`;
    }

    return '';
}

function appendMenuPanel(): void {
    const menuLoaderUrl = CONFIG.getString('menuLoaderUrl');
    if (!menuLoaderUrl) {
        throw new Error('Menu loader URL is not defined');
    }
    mountAdminMenu(menuLoaderUrl)
        .then((host) => {
            $isBrowseSidebarOpen.subscribe((isOpen) => {
                host.inert = isOpen;
            });
        })
        .catch((e: Error) => {
            throw new Error(`Failed to mount the menu from ${menuLoaderUrl}: ${e.toString()}`);
        });
}

async function startContentBrowser() {
    const { startBrowseApp } = await import('@enonic/lib-contentstudio/v6/app/browseApp');

    startBrowseApp();

    if (CONFIG.isTrue('checkLatestVersion') && AuthHelper.isContentAdmin()) {
        VersionHelper.checkAndNotifyIfNewerVersionExists();
    }

    appendMenuPanel();

    if (invalidEditUrlNotificationPending) {
        showError(i18n('text.content.not.found'));
        invalidEditUrlNotificationPending = false;
    }

    const NewContentDialog = (await import('@enonic/lib-contentstudio/app/create/NewContentDialog')).NewContentDialog;

    const newContentDialog = new NewContentDialog();
    ShowNewContentDialogEvent.on((event) => {
        const parentContent: ContentSummary = event.getParentContent()
            ? event.getParentContent().getContentSummary()
            : null;

        if (parentContent != null) {
            new GetContentByIdRequest(parentContent.getContentId())
                .sendAndParse()
                .then((newParentContent: Content) => {
                    // TODO: remove pyramid of doom
                    if (parentContent.hasParent() && parentContent.getType().isTemplateFolder()) {
                        new GetContentByPathRequest(parentContent.getPath().getParentPath())
                            .sendAndParse()
                            .then(() => {
                                newContentDialog.setParentContent(newParentContent);
                                newContentDialog.open();
                            })
                            .catch((reason) => {
                                DefaultErrorHandler.handle(reason);
                            })
                            .done();
                    } else {
                        newContentDialog.setParentContent(newParentContent);
                        newContentDialog.open();
                    }
                })
                .catch((reason) => {
                    DefaultErrorHandler.handle(reason);
                })
                .done();
        } else {
            newContentDialog.setParentContent(null);
            newContentDialog.open();
        }
    });

    const { IssueListDialog } = await import('@enonic/lib-contentstudio/app/issue/view/IssueListDialog');
    const { SortContentDialog } = await import('@enonic/lib-contentstudio/app/browse/sort/dialog/SortContentDialog');

    IssueListDialog.get();

    new SortContentDialog();

    new ContentEventsListener().start();
}

(() => {
    if (!document.currentScript) {
        throw Error('Legacy browsers are not supported');
    }
    const configScriptId = document.currentScript.getAttribute('data-config-script-id');
    if (!configScriptId) {
        throw Error('Unable to fetch app config');
    }

    CONFIG.setConfig(JSON.parse(document.getElementById(configScriptId).innerText) as ConfigObject);
    initConfig(configScriptId);
    initTheme();
    initProjects();
    void initLanguages();
    initPrincipals();
    const phrases: Phrases = JSON.parse(CONFIG.getString('phrasesAsJson'));
    Messages.addMessages(phrases);
    setPhrases(phrases);
    AuthContext.init(
        Principal.fromJson(CONFIG.get('user') as PrincipalJson),
        (CONFIG.get('principals') as PrincipalJson[]).map(Principal.fromJson),
    );

    const body = Body.get();

    if (ContentAppHelper.isContentWizardUrl()) {
        wizardParams = ContentAppHelper.createWizardParamsFromUrl();
    }

    const preLoadPromise = preLoadApplication();

    // ! startApplication must run AFTER preLoadPromise resolves so that
    // ! isContentWizardUrl() is re-evaluated against the rewritten path
    // ! when an invalid edit URL has been replaced with the browse URL.
    const renderListener = () => {
        preLoadPromise.then(() => startApplication());
        body.unRendered(renderListener);
    };
    if (body.isRendered()) {
        renderListener();
    } else {
        body.onRendered(renderListener);
    }
})();
