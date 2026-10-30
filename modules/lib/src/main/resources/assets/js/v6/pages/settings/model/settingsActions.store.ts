import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import { showFeedback, showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { ObjectHelper } from '@enonic/lib-admin-ui/ObjectHelper';
import { atom, computed } from 'nanostores';
import { type Project } from '../../../../app/settings/data/project/Project';
import { ProjectConfigContext } from '../../../../app/settings/data/project/ProjectConfigContext';
import { FolderViewItem } from '../../../../app/settings/view/FolderViewItem';
import { type SettingsViewItem } from '../../../../app/settings/view/SettingsViewItem';
import { syncProjects } from '../../../entities/project/api/projects.api';
import { $noProjectMode, $projects, isActiveProject } from '../../../entities/project/projects.store';
import { cleanupTask, trackTask } from '../../../entities/task';
import {
    openCreateProjectDialog,
    openEditProjectDialog,
} from '../../../features/manage-project/model/projectDialog.store';
import { i18n } from '../../../shared/i18n';
import { openDeleteSettingsDialog } from './deleteSettingsDialog.store';
import { getSettingsItem, isProjectViewItem } from './settings-tree.store';
import { $currentItems } from './settingsTreeSelection.store';

export type SettingsActionId = 'new' | 'edit' | 'delete' | 'sync';

export type SettingsAction = {
    id: SettingsActionId;
    labelKey: string;
    shortcut?: string;
};

export type SettingsActionState = {
    enabled: boolean;
    visible: boolean;
};

export type SettingsActionsState = Record<SettingsActionId, SettingsActionState>;

// The sync action only shows once there are layers to synchronize.
const SYNC_MIN_PROJECTS = 3;

export const SETTINGS_ACTIONS: readonly SettingsAction[] = [
    { id: 'new', labelKey: 'action.new', shortcut: 'alt+n' },
    { id: 'edit', labelKey: 'action.edit', shortcut: 'mod+e' },
    { id: 'delete', labelKey: 'action.delete', shortcut: 'mod+del' },
    { id: 'sync', labelKey: 'settings.actions.sync' },
];

const $isSyncInProgress = atom(false);

const hasChildren = (item: SettingsViewItem, projects: readonly Readonly<Project>[]): boolean =>
    ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem) ||
    projects.some((project) => project.hasMainParentByName(item.getId()));

export const $settingsActions = computed(
    [$currentItems, $projects, $noProjectMode, $isSyncInProgress],
    (items, { projects }, noProjectMode, isSyncInProgress): SettingsActionsState => {
        const canCreate = AuthHelper.isContentAdmin();
        const canEdit = !noProjectMode && items.length > 0 && items.every((item) => item.isEditAllowed());
        const canDelete =
            !noProjectMode && items.length === 1 && items[0].isDeleteAllowed() && !hasChildren(items[0], projects);
        const canSync = !noProjectMode && AuthHelper.isAdmin() && projects.length >= SYNC_MIN_PROJECTS;

        return {
            new: { enabled: canCreate, visible: true },
            edit: { enabled: canEdit, visible: true },
            delete: { enabled: canDelete, visible: true },
            sync: { enabled: canSync && !isSyncInProgress, visible: canSync },
        };
    },
);

//
// * Commands
//

export function createSettingsItem(): void {
    if (!AuthHelper.isContentAdmin()) return;

    void openCreateProjectDialog(getSelectedProjects());
}

export function editSettingsItem(item: SettingsViewItem): void {
    if (!isProjectViewItem(item)) return;

    const project = item.getData();
    const parentProjects = (project.getParents() ?? [])
        .map((id) => getSettingsItem(id))
        .filter(isProjectViewItem)
        .map((parent) => parent.getData());

    void openEditProjectDialog(project, parentProjects);
}

export function editCurrentSettingsItem(): void {
    const item = $currentItems.get().at(-1);
    if (item) editSettingsItem(item);
}

export function deleteCurrentSettingsItem(): void {
    const item = $currentItems.get()[0];
    if (!item || !isProjectViewItem(item)) return;

    openDeleteSettingsDialog(item.getId(), item.getName(), isActiveProject(item.getName()));
}

export function syncLayers(): void {
    if ($isSyncInProgress.get()) return;

    $isSyncInProgress.set(true);
    showFeedback(i18n('settings.actions.sync.started'));

    const finish = (succeeded: boolean): void => {
        $isSyncInProgress.set(false);
        if (succeeded) {
            showFeedback(i18n('settings.actions.sync.finished'));
        } else {
            showWarning(i18n('settings.actions.sync.failed'));
        }
    };

    void syncProjects().match(
        (taskId) => {
            trackTask(taskId, {
                onComplete: (state) => {
                    cleanupTask(taskId);
                    finish(state === 'SUCCESS');
                },
            });
        },
        () => finish(false),
    );
}

const COMMANDS: Record<SettingsActionId, () => void> = {
    new: createSettingsItem,
    edit: editCurrentSettingsItem,
    delete: deleteCurrentSettingsItem,
    sync: syncLayers,
};

/** Runs the action only while the store reports it enabled and visible. */
export function executeSettingsAction(id: SettingsActionId): void {
    const { enabled, visible } = $settingsActions.get()[id];
    if (!enabled || !visible) return;

    COMMANDS[id]();
}

//
// * Internal
//

function getSelectedProjects(): Project[] {
    const selected = $currentItems
        .get()
        .filter(isProjectViewItem)
        .map((item) => item.getData());
    if (selected.length === 0) return [];

    const isMultiInheritance = Boolean(ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance());
    return isMultiInheritance ? selected : selected.slice(-1);
}
