import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { CONFIG } from '@enonic/lib-admin-ui/util/Config';
import { ContentName } from '../../../../app/content/ContentName';
import type { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import { ContentUnnamed } from '../../../../app/content/ContentUnnamed';
import { PublishStatus } from '../../../../app/publish/PublishStatus';
import { GetPrincipalsByKeysRequest } from '../../../../app/security/GetPrincipalsByKeysRequest';
import { Project } from '../../../../app/settings/data/project/Project';
import { ProjectUpdatedEvent } from '../../../../app/settings/event/ProjectUpdatedEvent';
import { ProjectGetRequest } from '../../../../app/settings/resource/ProjectGetRequest';
import { ProjectListRequest } from '../../../../app/settings/resource/ProjectListRequest';
import { subscribe as subscribeToCollaborators } from '../../../../app/stores/collaboration';
import { UrlHelper } from '../../../../app/util/UrlHelper';
import { getActiveProject, getActiveProjectName } from '../../../entities/project/activeProject.store';
import { openRenameContentDialog } from '../../../features/rename/model/renameContentDialog.store';
import { normalizeContentPathName } from '../../../shared/lib/cms/content/paths';
import { calcTreePublishStatus } from '../../../shared/lib/cms/content/status';
import { LAYERS_WIDGET_NAME } from '../../../shared/lib/widget/layers';
import { handleError } from '../../../shared/notifications';
import { openContextWidget } from '../../../widgets/context-panel/openContextWidget';
import { saveWizardContent } from './wizardActions.commands';
import { $wizardActionFacts } from './wizardActions.store';
import { $wizardDraftName, setDraftName } from './wizardContent.store';
import {
    $wizardToolbar,
    resetWizardToolbar,
    setWizardToolbarCanRenameContentPath,
    setWizardToolbarCollaborators,
    setWizardToolbarContentInheritance,
    setWizardToolbarContentName,
    setWizardToolbarContentParentPath,
    setWizardToolbarIsContentOnline,
    setWizardToolbarIsLayerProject,
    setWizardToolbarProjectInfo,
    setWizardToolbarProjectLabel,
    setWizardToolbarPublishStatus,
} from './wizardToolbar.store';

//
// * Wizard Toolbar Service
//
// Keeps the wizard toolbar store filled: the project the content belongs to,
// the content's name, path and publish status, and who else is editing it.
//

let item: ContentSummaryAndCompareStatus | undefined;

//
// * Project
//

function applyProject(project: Project): void {
    const displayName = project.getDisplayName() || project.getName();
    const language = project.getLanguage() ? ` (${project.getLanguage()})` : '';

    setWizardToolbarProjectLabel(`${displayName}${language}`);
    setWizardToolbarProjectInfo(project.getName(), project.getLanguage() || '', !!project.getIcon());
    setWizardToolbarIsLayerProject(project.hasParents());
}

function fetchProject(): void {
    const name = getActiveProjectName();
    const fallback = (): Project => Project.create().setName(name).build();

    new ProjectListRequest()
        .sendAndParse()
        .then((projects) => applyProject(projects.find((project) => project.getName() === name) ?? fallback()))
        .catch((error: Error) => {
            applyProject(fallback());
            handleError(error);
        });
}

function handleProjectUpdated(event: ProjectUpdatedEvent): void {
    if (event.getProjectName() !== getActiveProjectName()) return;

    new ProjectGetRequest(event.getProjectName()).sendAndParse().then(applyProject).catch(handleError);
}

//
// * Collaboration
//

const collaboratorNames = new Map<string, string>();

let stopCollaboration: (() => void) | undefined;
let collaborationContentId: string | undefined;
let collaborationRequestId = 0;

const isCollaborationEnabled = (): boolean => CONFIG.isTrue('enableCollaboration');

function publishCollaborators(keys: string[], requestId: number, currentUserKey: string | undefined): void {
    if (requestId !== collaborationRequestId) return;

    setWizardToolbarCollaborators(
        keys.map((key) => ({ key, label: collaboratorNames.get(key) || key, isCurrent: currentUserKey === key })),
    );
}

function handleCollaborators(collaborators: Set<string>): void {
    const user = AuthContext.get().getUser();
    const currentUserKey = user?.getKey().toString();
    if (currentUserKey) collaboratorNames.set(currentUserKey, user.getDisplayName());

    // The current user comes first.
    const keys = [...collaborators].sort((a, b) => Number(b === currentUserKey) - Number(a === currentUserKey));
    const requestId = ++collaborationRequestId;
    const missing = keys.filter((key) => !collaboratorNames.has(key));

    if (missing.length === 0) {
        publishCollaborators(keys, requestId, currentUserKey);
        return;
    }

    new GetPrincipalsByKeysRequest(missing.map((key) => PrincipalKey.fromString(key)))
        .sendAndParse()
        .then((principals) => {
            principals.forEach((principal) => {
                collaboratorNames.set(principal.getKey().toString(), principal.getDisplayName());
            });
        })
        .catch(handleError)
        .then(() => publishCollaborators(keys, requestId, currentUserKey));
}

function leaveCollaboration(): void {
    stopCollaboration?.();
    stopCollaboration = undefined;
    collaborationContentId = undefined;
    collaborationRequestId += 1;
    setWizardToolbarCollaborators([]);
}

function joinCollaboration(contentId: string): void {
    if (collaborationContentId === contentId) return;

    leaveCollaboration();
    collaborationContentId = contentId;
    stopCollaboration = subscribeToCollaborators(contentId, getActiveProjectName(), handleCollaborators);
}

//
// * Content
//

const withoutUnnamed = (name: string): string => (name.startsWith(ContentUnnamed.UNNAMED_PREFIX) ? '' : name);

function resolvePublishStatus(content: ContentSummaryAndCompareStatus): PublishStatus | null {
    const publishStatus = content.getPublishStatus();
    if (publishStatus != null) return publishStatus;

    const summary = content.getContentSummary();
    if (summary != null) return calcTreePublishStatus(summary);

    return $wizardToolbar.get().publishStatus ?? null;
}

function resolveContentName(content: ContentSummaryAndCompareStatus): string {
    const draftName = $wizardDraftName.get()?.toString() || '';
    if (draftName.length > 0) return draftName;

    const summaryName = content.getContentSummary()?.getName()?.toString() || '';
    if (summaryName.length > 0) return withoutUnnamed(summaryName);

    return withoutUnnamed(content.getPath()?.getName() || '');
}

//
// * Public API
//

/** Shows the content in the toolbar: its name, path, publish status and inheritance. */
export function setWizardToolbarItem(content: ContentSummaryAndCompareStatus): void {
    item = content;

    const publishStatus = resolvePublishStatus(content);

    setWizardToolbarPublishStatus(publishStatus);
    setWizardToolbarContentName(resolveContentName(content));
    setWizardToolbarContentParentPath(content.getPath()?.getParentPath()?.toString() ?? '');
    setWizardToolbarCanRenameContentPath(!!content.getPath());
    setWizardToolbarIsContentOnline(publishStatus != null && publishStatus !== PublishStatus.OFFLINE);
    setWizardToolbarContentInheritance(content.isInherited(), content.isDataInherited());

    if (isCollaborationEnabled()) joinCollaboration(content.getContentId().toString());
}

/** Asks for a new name of the content and saves it. */
export function renameWizardContent(): void {
    const path = item?.getPath();
    if (!path || !$wizardToolbar.get().canRenameContentPath) return;

    const draftName = $wizardDraftName.get()?.toString() || '';
    const persistedName = normalizeContentPathName(path.getName());

    void openRenameContentDialog({
        parentPath: path.getParentPath(),
        initialName: normalizeContentPathName(draftName) || persistedName,
        persistedName,
        isPublished: $wizardActionFacts.get().summary?.online === true,
    }).then((newName?: string) => {
        if (!newName) return;

        setDraftName(new ContentName(newName));
        void saveWizardContent({ renamed: true });
    });
}

export function backToWizardProject(): void {
    window.location.href = UrlHelper.createContentBrowseUrl(getActiveProjectName());
}

export function openWizardLayers(): void {
    openContextWidget(LAYERS_WIDGET_NAME);
}

/** Starts filling the toolbar store; the returned function stops it and clears the store. */
export function startWizardToolbar(): () => void {
    resetWizardToolbar();
    item = undefined;

    const project = getActiveProject();
    setWizardToolbarIsLayerProject(project.hasParents());
    setWizardToolbarProjectInfo(project.getName(), project.getLanguage() || '', !!project.getIcon());

    fetchProject();
    ProjectUpdatedEvent.on(handleProjectUpdated);

    return () => {
        ProjectUpdatedEvent.un(handleProjectUpdated);
        leaveCollaboration();
        item = undefined;
        resetWizardToolbar();
    };
}
