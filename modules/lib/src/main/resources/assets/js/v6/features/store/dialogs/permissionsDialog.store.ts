import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {type TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {listenKeys, map} from 'nanostores';
import {ResultAsync} from 'neverthrow';
import {type OpenEditPermissionsDialogEvent} from '../../../../app/event/OpenEditPermissionsDialogEvent';
import {AccessControlHelper} from '../../../../app/wizard/AccessControlHelper';
import {AccessControlList} from '../../../../app/access/AccessControlList';
import {AccessControlEntry} from '../../../../app/access/AccessControlEntry';
import {loadPrincipalsByKeys} from '../principals.store';
import {GetDescendantsOfContentsRequest} from '../../../../app/resource/GetDescendantsOfContentsRequest';
import {ApplyContentPermissionsRequest} from '../../../../app/resource/ApplyContentPermissionsRequest';
import {type ApplyPermissionsScope} from '../../../../app/dialog/permissions/PermissionsData';
import {type ContentId} from '../../../../app/content/ContentId';
import {GetContentByPathRequest} from '../../../../app/resource/GetContentByPathRequest';
import {GetContentRootPermissionsRequest} from '../../../../app/resource/GetContentRootPermissionsRequest';
import {type TaskResultState} from '../task.store';
import {trackTask} from '../../services/task.service';
import {formatError} from '../../utils/format/error';
import {Permission} from '../../../../app/access/Permission';

//
// * Store State
//

type PermissionsDialogStore = {
    // Config
    open: boolean;
    step: string;
    loading: boolean;
    contentDisplayName: string;
    isContentRoot: boolean;
    contentDescendantsCount: number;
    hasVisitedStrategyStep: boolean;

    // Initial data
    initialAccessControlEntries: AccessControlEntry[];
    initialAccessMode: string;

    // Data
    contentId?: ContentId;
    accessControlEntries: AccessControlEntry[];
    finalAccessControlEntries: AccessControlEntry[];
    parentAccessControlEntries: AccessControlEntry[];
    accessMode: string;
    applyTo: ApplyPermissionsScope;
    replaceAllChildPermissions: boolean;

    // Task
    taskId?: TaskId;
};

const initialState: PermissionsDialogStore = {
    // Config
    open: false,
    step: 'step-access',
    loading: false,
    contentDisplayName: '',
    isContentRoot: false,
    contentDescendantsCount: 0,
    hasVisitedStrategyStep: false,

    // Initial data
    initialAccessControlEntries: [],
    initialAccessMode: 'public',

    // Data
    contentId: undefined,

    accessControlEntries: [],
    finalAccessControlEntries: [],
    parentAccessControlEntries: [],
    accessMode: 'public',
    applyTo: 'single',
    replaceAllChildPermissions: false,

    // Task
    taskId: undefined,
};

export const $permissionsDialog = map<PermissionsDialogStore>(structuredClone(initialState));

//
// * Public API
//

export const openPermissionsDialog = (event: OpenEditPermissionsDialogEvent): void => {
    const contentPath = event.getContentPath();
    const parentPath = contentPath.getParentPath();
    const isRoot = !parentPath || parentPath.isRoot();

    const contentDescendants = () => ResultAsync.fromPromise(new GetDescendantsOfContentsRequest(contentPath).sendAndParse(), formatError);
    const parentPermissions = () =>
        isRoot
            ? ResultAsync.fromPromise(new GetContentRootPermissionsRequest().sendAndParse(), formatError).map((permissions) =>
                  permissions.getEntries()
              )
            : ResultAsync.fromPromise(new GetContentByPathRequest(parentPath).sendAndParse(), formatError).map((content) =>
                  content.getPermissions().getEntries()
              );

    $permissionsDialog.setKey('loading', true);
    $permissionsDialog.setKey('open', true);

    void ResultAsync.combine([contentDescendants(), parentPermissions()])
        .map(([descendants, parentPermissions]) => {
            if (!$permissionsDialog.get().open) return; // abort if dialog is closed

            const permissions = event.getPermissions().getEntries();

            // Make sure to remove the everyone from the access control entries. Everyone is managed separately.
            const accessControlEntries = AccessControlHelper.removeRedundantPermissions(permissions);
            const parentAccessControlEntries = AccessControlHelper.removeRedundantPermissions(parentPermissions);
            const principalKeys = [...accessControlEntries, ...parentAccessControlEntries].map((entry) => entry.getPrincipalKey());

            return {descendants, accessControlEntries, parentAccessControlEntries, principalKeys};
        })
        .map(({descendants, accessControlEntries, parentAccessControlEntries, principalKeys}) => {
            // Make sure all necessary principals are loaded
            return loadPrincipalsByKeys(principalKeys).map(() => {
                const contentId = event.getContentId();
                const contentDisplayName = event.getDisplayName();
                const accessMode = accessControlEntries.some((entry) => entry.getPrincipalKey().equals(RoleKeys.EVERYONE))
                    ? 'public'
                    : 'restricted';

                $permissionsDialog.set({
                    // Config
                    ...structuredClone(initialState),
                    open: true,
                    loading: false,
                    contentDisplayName,
                    isContentRoot: isRoot,
                    contentDescendantsCount: descendants.length,

                    // Initial data
                    initialAccessControlEntries: accessControlEntries,
                    initialAccessMode: accessMode,

                    // Data
                    contentId,
                    accessControlEntries: accessControlEntries,
                    parentAccessControlEntries: parentAccessControlEntries,
                    accessMode,
                });
            });
        })
        .mapErr((error) => {
            $permissionsDialog.setKey('loading', false);
            showWarning(i18n('notify.permissions.inheritError', event.getDisplayName()));
            console.error('Failed to open permissions dialog:', error);
        });
};

export const closePermissionsDialog = (): void => {
    $permissionsDialog.set(structuredClone(initialState));
};

export const setPermissionsDialogStep = (step: string): void => {
    $permissionsDialog.setKey('step', step);
};

export const setPermissionsDialogAccessControlEntries = (accessControlEntries: AccessControlEntry[]): void => {
    $permissionsDialog.setKey('accessControlEntries', accessControlEntries);
};

export const setPermissionsDialogAccessMode = (accessMode: string): void => {
    $permissionsDialog.setKey('accessMode', accessMode);
};

export const setPermissionsDialogApplyTo = (applyTo: ApplyPermissionsScope): void => {
    $permissionsDialog.setKey('applyTo', applyTo);
};

export const setPermissionsDialogReplaceAllChildPermissions = (replaceAllChildPermissions: boolean): void => {
    $permissionsDialog.setKey('replaceAllChildPermissions', replaceAllChildPermissions);
};

export const updatePermissions = (onComplete: (resultState: TaskResultState, message: string) => void): void => {
    const {contentId, initialAccessControlEntries, finalAccessControlEntries, applyTo, replaceAllChildPermissions} =
        $permissionsDialog.get();

    const request = new ApplyContentPermissionsRequest().setId(contentId).setScope(applyTo);

    if (applyTo !== 'single' && replaceAllChildPermissions) {
        request.setPermissions(new AccessControlList(finalAccessControlEntries));
    } else {
        const {added, removed} = AccessControlHelper.calcMergePermissions(initialAccessControlEntries, finalAccessControlEntries);
        request.setAddPermissions(added);
        request.setRemovePermissions(removed);
    }

    void ResultAsync.fromPromise(request.sendAndParse(), formatError)
        .map((taskId) => {
            $permissionsDialog.setKey('taskId', taskId);
            trackTask(taskId, {
                onComplete: (resultState, message) => {
                    onComplete(resultState, message);

                    if (resultState != 'SUCCESS') {
                        $permissionsDialog.setKey('taskId', undefined);
                        return;
                    }

                    closePermissionsDialog();
                },
            });
        })
        .mapErr((error) => {
            console.error('Failed to update permissions:', error);
        });
};

//
// * Internal
//

// Mark as visited when strategy step is visited
listenKeys($permissionsDialog, ['step'], ({step}) => {
    if (step === 'step-strategy') {
        $permissionsDialog.setKey('hasVisitedStrategyStep', true);
    }
});

// Clear replace all child permissions when applyTo is set to single
listenKeys($permissionsDialog, ['applyTo'], ({applyTo}) => {
    if (applyTo === 'single') {
        $permissionsDialog.setKey('replaceAllChildPermissions', false);
    }
});

// Prepend or remove everyone entry based on access mode
listenKeys($permissionsDialog, ['accessMode', 'accessControlEntries'], ({accessMode, accessControlEntries}) => {
    const everyoneEntry = new AccessControlEntry(Principal.create().setKey(RoleKeys.EVERYONE).setDisplayName('Everyone').build());
    everyoneEntry.allow(Permission.READ);

    const accessControlEntriesWithoutEveryone = accessControlEntries.filter((entry) => !entry.getPrincipalKey().equals(RoleKeys.EVERYONE));

    const finalAccessControlEntries =
        accessMode === 'public' ? [everyoneEntry, ...accessControlEntriesWithoutEveryone] : accessControlEntriesWithoutEveryone;

    $permissionsDialog.setKey('finalAccessControlEntries', finalAccessControlEntries);
});
