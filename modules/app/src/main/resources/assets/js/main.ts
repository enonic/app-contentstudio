/*global Q, JQuery */

import {Application} from '@enonic/lib-admin-ui/app/Application';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {showError, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalJson} from '@enonic/lib-admin-ui/security/PrincipalJson';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {ConnectionDetector} from '@enonic/lib-admin-ui/system/ConnectionDetector';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {CONFIG, ConfigObject} from '@enonic/lib-admin-ui/util/Config';
import {LauncherHelper} from '@enonic/lib-admin-ui/util/LauncherHelper';
import {i18n, Messages} from '@enonic/lib-admin-ui/util/Messages';
import * as $ from 'jquery';
import {AppContext} from '@enonic/lib-contentstudio/app/AppContext';
import {ContentDeletePromptEvent} from '@enonic/lib-contentstudio/app/browse/ContentDeletePromptEvent';
import {ContentDuplicatePromptEvent} from '@enonic/lib-contentstudio/app/browse/ContentDuplicatePromptEvent';
import {ContentPublishPromptEvent} from '@enonic/lib-contentstudio/app/browse/ContentPublishPromptEvent';
import {ContentUnpublishPromptEvent} from '@enonic/lib-contentstudio/app/browse/ContentUnpublishPromptEvent';
import {CreateIssuePromptEvent} from '@enonic/lib-contentstudio/app/browse/CreateIssuePromptEvent';
import {RequestContentPublishPromptEvent} from '@enonic/lib-contentstudio/app/browse/RequestContentPublishPromptEvent';
import {ShowDependenciesEvent} from '@enonic/lib-contentstudio/app/browse/ShowDependenciesEvent';
import {ShowIssuesDialogEvent} from '@enonic/lib-contentstudio/app/browse/ShowIssuesDialogEvent';
import {ShowNewContentDialogEvent} from '@enonic/lib-contentstudio/app/browse/ShowNewContentDialogEvent';
import {Content} from '@enonic/lib-contentstudio/app/content/Content';
import {ContentIconUrlResolver} from '@enonic/lib-contentstudio/app/content/ContentIconUrlResolver';
import {ContentSummary} from '@enonic/lib-contentstudio/app/content/ContentSummary';
import {ContentEventsListener} from '@enonic/lib-contentstudio/app/ContentEventsListener';
import {ContentEventsProcessor} from '@enonic/lib-contentstudio/app/ContentEventsProcessor';
import {NewContentEvent} from '@enonic/lib-contentstudio/app/create/NewContentEvent';
import {ProjectSelectionDialog} from '@enonic/lib-contentstudio/app/dialog/ProjectSelectionDialog';
import {AggregatedServerEventsListener} from '@enonic/lib-contentstudio/app/event/AggregatedServerEventsListener';
import {ContentServerEventsHandler} from '@enonic/lib-contentstudio/app/event/ContentServerEventsHandler';
import {ContentUpdatedEvent} from '@enonic/lib-contentstudio/app/event/ContentUpdatedEvent';
import {EditContentEvent} from '@enonic/lib-contentstudio/app/event/EditContentEvent';
import {OpenEditPermissionsDialogEvent} from '@enonic/lib-contentstudio/app/event/OpenEditPermissionsDialogEvent';
import {IssueServerEventsHandler} from '@enonic/lib-contentstudio/app/issue/event/IssueServerEventsHandler';
import {IssueDialogsManager} from '@enonic/lib-contentstudio/app/issue/IssueDialogsManager';
import {ContentMovePromptEvent} from '@enonic/lib-contentstudio/app/move/ContentMovePromptEvent';
import {ProjectContext} from '@enonic/lib-contentstudio/app/project/ProjectContext';
import {GetContentByIdRequest} from '@enonic/lib-contentstudio/app/resource/GetContentByIdRequest';
import {GetContentByPathRequest} from '@enonic/lib-contentstudio/app/resource/GetContentByPathRequest';
import {GetContentTypeByNameRequest} from '@enonic/lib-contentstudio/app/resource/GetContentTypeByNameRequest';
import {Router} from '@enonic/lib-contentstudio/app/Router';
import {Project} from '@enonic/lib-contentstudio/app/settings/data/project/Project';
import {ProjectHelper} from '@enonic/lib-contentstudio/app/settings/data/project/ProjectHelper';
import {ProjectNotAvailableDialog} from '@enonic/lib-contentstudio/app/settings/dialog/project/create/ProjectNotAvailableDialog';
import {ProjectDeletedEvent} from '@enonic/lib-contentstudio/app/settings/event/ProjectDeletedEvent';
import {SettingsServerEventsListener} from '@enonic/lib-contentstudio/app/settings/event/SettingsServerEventsListener';
import {ProjectListRequest} from '@enonic/lib-contentstudio/app/settings/resource/ProjectListRequest';
import {$isDown, subscribe as subscribeToWorker} from '@enonic/lib-contentstudio/app/stores/worker';
import {TooltipHelper} from '@enonic/lib-contentstudio/app/TooltipHelper';
import {UrlAction} from '@enonic/lib-contentstudio/app/UrlAction';
import {ContentAppHelper} from '@enonic/lib-contentstudio/app/wizard/ContentAppHelper';
import {ContentWizardPanelParams} from '@enonic/lib-contentstudio/app/wizard/ContentWizardPanelParams';
import {VersionHelper} from '@enonic/lib-contentstudio/app/util/VersionHelper';
import Q from 'q';

// Dynamically import and execute all input types, since they are used
// on-demand, when parsing XML schemas and has not real usage in app
declare const require: {context: (directory: string, useSubdirectories: boolean, filter: RegExp) => void};
const importAll = r => r.keys().forEach(r);
importAll(require.context('@enonic/lib-contentstudio/app/inputtype', true, /^(?!\.[\/\\](ui)).*(\.js)$/));

function getApplication(): Application {
    const application = new Application(
        CONFIG.getString('appId'),
        i18n('admin.tool.displayName'),
        i18n('app.abbr')
    );
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

function startLostConnectionDetector(): ConnectionDetector {
    let readonlyMessageId: string;

    const connectionDetector =
        ConnectionDetector.get(CONFIG.getString('statusApiUrl'))
            .setAuthenticated(true)
            .setSessionExpireRedirectUrl(CONFIG.getString('toolUri'))
            .setNotificationMessage(i18n('notify.connection.loss'));

    connectionDetector.onReadonlyStatusChanged((readonly: boolean) => {
        if (readonly && !readonlyMessageId) {
            readonlyMessageId = showWarning(i18n('notify.repo.readonly'), false);
        } else if (readonlyMessageId) {
            NotifyManager.get().hide(readonlyMessageId);
            readonlyMessageId = null;
        }
    });

    let wsConnectionErrorId: string;
    let timeoutId: number;
    $isDown.subscribe(isDown => {
        clearTimeout(timeoutId);

        if (isDown && connectionDetector.isConnected()) {
            timeoutId = window.setTimeout(() => {
                wsConnectionErrorId = showError(i18n('notify.websockets.error'), false);
            }, 1000);
            return;
        }

        if (wsConnectionErrorId) {
            NotifyManager.get().hide(wsConnectionErrorId);
            wsConnectionErrorId = null;
        }
    });

    connectionDetector.startPolling(true);

    return connectionDetector;
}

function initApplicationEventListener() {

    let messageId: string;
    let appStatusCheckInterval: number;

    ApplicationEvent.on((event: ApplicationEvent) => {
        if (ApplicationEventType.STOPPED === event.getEventType() ||
            ApplicationEventType.UNINSTALLED === event.getEventType()) {
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

function updateTabTitle(title: string) {
    $('title').text(`${title} / ${i18n('app.name')}`);
}

function shouldUpdateFavicon(contentTypeName: ContentTypeName): boolean {
    // Chrome currently doesn't support SVG favicons which are served for not image contents
    return contentTypeName.isImage() || navigator.userAgent.search('Chrome') === -1;
}

const faviconCache: Record<string, HTMLElement> = {};

const iconUrlResolver = new ContentIconUrlResolver();

let dataPreloaded: boolean = false;

function clearFavicon() {
    // save current favicon hrefs
    $('link[rel*=icon][sizes]').each((index, link: HTMLElement) => {
        let href = link.getAttribute('href');
        faviconCache[href] = link;
        link.setAttribute('href', ImgEl.PLACEHOLDER);
    });
}

function updateFavicon(content: ContentSummary) {
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

const refreshTab = function (content: ContentSummary) {
    updateFavicon(content);
    updateTabTitle(content.getDisplayName());
};

function preLoadApplication() {
    const application: Application = getApplication();
    if (ContentAppHelper.isContentWizardUrl()) {
        clearFavicon();
        const wizardParams: ContentWizardPanelParams = ContentAppHelper.createWizardParamsFromUrl();

        if (!Body.get().isRendered() && !Body.get().isRendering()) {
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
                new GetContentTypeByNameRequest(wizardParams.contentTypeName).sendAndParse().then(
                    (contentType) => {
                        updateTabTitle(NamePrettyfier.prettifyUnnamed(contentType.getDisplayName()));
                    });
            }
        }
    }
}

function startServerEventListeners(application: Application) {
    subscribeToWorker();

    new AggregatedServerEventsListener(application);
    new SettingsServerEventsListener(application);
}

const handleProjectDeletedEvent = (projectName: string) => {
    const currentProject: Project = ProjectContext.get().getProject();
    const isCurrentProjectDeleted: boolean = projectName === currentProject.getName();

    if (isCurrentProjectDeleted) {
        handleCurrentProjectDeleted();
    }
};

const handleCurrentProjectDeleted = () => {
    new ProjectListRequest(true).sendAndParse().then((projects: Project[]) => {
        const projectToSet: Project = getProjectToSet(projects);

        if (projectToSet) {
            ProjectContext.get().setProject(projectToSet);
        } else {
            ProjectContext.get().setNotAvailable();
        }
    }).catch(DefaultErrorHandler.handle);
};

const getProjectToSet = (projects: Project[]): Project => {
    if (projects.length === 0) {
        return null;
    }

    return getParentProject(ProjectContext.get().getProject(), projects) || getFirstAvailableProject(projects);
};

const getParentProject = (project: Project, projects: Project[]): Project => {
    const parentProject: Project = projects.find((p: Project) => project.hasParentByName(p.getName()));

    if (parentProject) {
        return ProjectHelper.isAvailable(parentProject) ? parentProject : getParentProject(parentProject, projects);
    }

    return null;
};

const getFirstAvailableProject = (projects: Project[]): Project => {
    return projects.find((p: Project) => ProjectHelper.isAvailable(p));
};

const handleNoProjectsAvailable = () => {
    if (AuthHelper.isContentAdmin()) {
        new ProjectNotAvailableDialog().open();
    } else {
        ProjectSelectionDialog.get().setUpdateOnOpen(true);
        ProjectSelectionDialog.get().open();
    }
};

let connectionDetector: ConnectionDetector;

async function startApplication() {
    const application: Application = getApplication();
    connectionDetector = startLostConnectionDetector();
    Store.instance().set('application', application);

    startServerEventListeners(application);
    initApplicationEventListener();

    ProjectContext.get().onNoProjectsAvailable(() => handleNoProjectsAvailable());

    initProjectContext(application)
        .then(() => {
            ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
                handleProjectDeletedEvent(event.getProjectName());
            });
        })
        .catch((reason) => {
            DefaultErrorHandler.handle(reason);
            NotifyManager.get().showWarning(i18n('notify.settings.project.initFailed'));
        })
        .finally(() => {
            ProjectContext.get().whenInitialized(() => {
                if (ContentAppHelper.isContentWizardUrl()) {
                    startContentWizard();
                } else {
                    startContentBrowser();
                }
            });
        });

    AppHelper.preventDragRedirect();

    const {ContentDuplicateDialog} = await import('@enonic/lib-contentstudio/app/duplicate/ContentDuplicateDialog');
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

    const {MoveContentDialog} = await import('@enonic/lib-contentstudio/app/move/MoveContentDialog');
    let moveContentDialog = null;

    ContentMovePromptEvent.on((event) => {
        if (!moveContentDialog) {
            moveContentDialog = new MoveContentDialog();
        }

        moveContentDialog.handlePromptEvent(event);
    });

    const {ContentDeleteDialog} = await import('@enonic/lib-contentstudio/app/remove/ContentDeleteDialog');
    let contentDeleteDialog = null;

    ContentDeletePromptEvent.on((event) => {
        if (!contentDeleteDialog) {
            contentDeleteDialog = new ContentDeleteDialog();
        }

        contentDeleteDialog
            .setContentToDelete(event.getModels())
            .setYesCallback(event.getYesCallback())
            .setNoCallback(event.getNoCallback())
            .open();
    });

    const {ContentPublishDialog} = await import('@enonic/lib-contentstudio/app/publish/ContentPublishDialog');
    let contentPublishDialog = null;

    ContentPublishPromptEvent.on((event) => {
        if (!contentPublishDialog) {
            contentPublishDialog = ContentPublishDialog.get();
        }

        contentPublishDialog
            .setContentToPublish(event.getModels())
            .setKeepDependencies(event.isKeepDependencies())
            .setExcludedIds(event.getExcludedIds())
            .setIncludeChildItems(event.isIncludeChildItems(), event.getExceptedContentIds())
            .setMessage(event.getMessage())
            .open();
    });

    const {ContentUnpublishDialog} = await import('@enonic/lib-contentstudio/app/publish/ContentUnpublishDialog');
    let contentUnpublishDialog = null;

    ContentUnpublishPromptEvent.on((event) => {
        if (!contentUnpublishDialog) {
            contentUnpublishDialog = new ContentUnpublishDialog();
        }

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

    const {EditPermissionsDialog} = await import('@enonic/lib-contentstudio/app/dialog/permissions/EditPermissionsDialog');
    let editPermissionsDialog = null;

    OpenEditPermissionsDialogEvent.on((event: OpenEditPermissionsDialogEvent) => {
        if (!editPermissionsDialog) {
            editPermissionsDialog = new EditPermissionsDialog();
        }

        editPermissionsDialog.setDataAndOpen(event);
    });

    application.setLoaded(true);

    ContentServerEventsHandler.getInstance().start();
    IssueServerEventsHandler.getInstance().start();
}

const refreshTabOnContentUpdate = (content: Content) => {
    ContentUpdatedEvent.on((event: ContentUpdatedEvent) => {
        if (event.getContentId().equals(content.getContentId())) {
            clearFavicon();
            refreshTab(event.getContentSummary());
        }
    });
};

async function startContentWizard() {
    window['CKEDITOR'].config.language = CONFIG.getString('locale');

    const {ContentWizardPanel} = await import('@enonic/lib-contentstudio/app/wizard/ContentWizardPanel');

    const wizardParams = ContentAppHelper.createWizardParamsFromUrl();
    const wizard = new ContentWizardPanel(wizardParams, getTheme());

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
                let name = event.getNewValue() as string || NamePrettyfier.prettifyUnnamed(contentType.getDisplayName());

                updateTabTitle(name);
            }
        });
    });

    WindowDOM.get().onBeforeUnload((event: UIEvent) => {
        if (wizard.isContentDeleted() || !connectionDetector?.isConnected() || !connectionDetector?.isAuthenticated()) {
            return;
        }
        if (wizard.hasUnsavedChanges() && !wizard.isReadOnly()) {
            const message = i18n('dialog.wizard.unsavedChanges');
            const e: UIEvent | object = event || {returnValue: ''};
            e['returnValue'] = message;
            return message;
        }
    });

    wizard.onClosed(() => window.close());

    EditContentEvent.on(ContentEventsProcessor.handleEdit);
    NewContentEvent.on(ContentEventsProcessor.handleNew);

    Body.get().addClass('wizard-page').appendChild(wizard);

    TooltipHelper.init();
}

function getTheme(): string {
    if (CONFIG.has('theme')) {
        return `theme-${CONFIG.getString('theme')}`;
    }

    return '';
}

function isDefaultAppUrl(url: string): boolean {
    return url.endsWith('/main') || url.endsWith('/browse') || url.indexOf('/inbound/') > 0 || url.indexOf('/outbound/') > 0;
}

async function startContentBrowser() {
    await import('@enonic/lib-contentstudio/app/ContentAppPanel');
    const AppWrapper = (await import('@enonic/lib-contentstudio/app/AppWrapper')).AppWrapper;
    const url: string = window.location.href;
    const commonWrapper = new AppWrapper(getTheme());

    if (CONFIG.isTrue('checkLatestVersion') && AuthHelper.isContentAdmin()) {
        VersionHelper.checkAndNotifyIfNewerVersionExists();
    }

    if (isDefaultAppUrl(url)) {
        commonWrapper.selectDefaultWidget();
    } else {
        commonWrapper.onItemAdded((item: Widget) => {
            if (AppContext.get().getCurrentAppOrWidgetId()) {
                return;
            }

            if (url.endsWith(`/${item.getWidgetDescriptorKey().getName()}`)) {
                commonWrapper.selectWidget(item);
            }
        });

        setTimeout(() => { // if no external app is loaded then switch to a studio
            if (!AppContext.get().getCurrentAppOrWidgetId()) {
                commonWrapper.selectDefaultWidget();
            }
        }, 3000);
    }

    LauncherHelper.appendLauncherPanel();
    Body.get().appendChild(commonWrapper);

    const NewContentDialog = (await import('@enonic/lib-contentstudio/app/create/NewContentDialog')).NewContentDialog;

    const newContentDialog = new NewContentDialog();
    ShowNewContentDialogEvent.on((event) => {
        const parentContent: ContentSummary = event.getParentContent()
            ? event.getParentContent().getContentSummary() : null;

        if (parentContent != null) {
            new GetContentByIdRequest(parentContent.getContentId()).sendAndParse().then(
                (newParentContent: Content) => {

                    // TODO: remove pyramid of doom
                    if (parentContent.hasParent() && parentContent.getType().isTemplateFolder()) {
                        new GetContentByPathRequest(parentContent.getPath().getParentPath()).sendAndParse()
                            .then(() => {
                                newContentDialog.setParentContent(newParentContent);
                                newContentDialog.open();
                            }).catch((reason) => {
                                DefaultErrorHandler.handle(reason);
                            }).done();
                    } else {
                        newContentDialog.setParentContent(newParentContent);
                        newContentDialog.open();
                    }
                }).catch((reason) => {
                    DefaultErrorHandler.handle(reason);
                }).done();
        } else {
            newContentDialog.setParentContent(null);
            newContentDialog.open();
        }
    });

    const {IssueListDialog} = await import('@enonic/lib-contentstudio/app/issue/view/IssueListDialog');
    const {SortContentDialog} = await import('@enonic/lib-contentstudio/app/browse/sort/dialog/SortContentDialog');

    IssueListDialog.get();

    new SortContentDialog();

    new ContentEventsListener().start();
}

function initProjectContext(application: Application): Q.Promise<void> {
    return new ProjectListRequest(true).sendAndParse().then((projects: Project[]) => {
        ProjectSelectionDialog.get().setProjects(projects);

        const projectName: string = application.getPath().getElement(0) || localStorage.getItem(ProjectContext.LOCAL_STORAGE_KEY);

        if (projectName) {
            const currentProject: Project =
                projects.find((project: Project) => ProjectHelper.isAvailable(project) && project.getName() === projectName);

            if (currentProject) {
                ProjectContext.get().setProject(currentProject);
                return;
            }
        }

        if (projects.length === 1 && ProjectHelper.isAvailable(projects[0])) {
            ProjectContext.get().setProject(projects[0]);
            return;
        }

        if (projects.length === 0) {
            ProjectContext.get().setNotAvailable();
            return;
        }

        ProjectSelectionDialog.get().open();
    });
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
    Messages.addMessages(JSON.parse(CONFIG.getString('phrasesAsJson')) as object);
    AuthContext.init(Principal.fromJson(CONFIG.get('user') as PrincipalJson),
        (CONFIG.get('principals') as PrincipalJson[]).map(Principal.fromJson));

    const body = Body.get();

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
