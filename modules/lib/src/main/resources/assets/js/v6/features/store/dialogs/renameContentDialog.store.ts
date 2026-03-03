import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentPath} from '../../../../app/content/ContentPath';
import {ContentExistsByPathRequest} from '../../../../app/resource/ContentExistsByPathRequest';

export type RenameContentDialogMode = 'rename-published' | 'rename' | 'set-name';
export type RenameContentDialogAvailabilityStatus = 'not-available' | 'checking' | 'available';

type RenameContentDialogStore = {
    open: boolean;
    mode: RenameContentDialogMode;
    path: string;
    initialName: string;
    value: string;
    placeholder: string;
    parentPath?: ContentPath;
    availabilityStatus?: RenameContentDialogAvailabilityStatus;
};

type OpenRenameContentDialogParams = {
    parentPath: ContentPath;
    initialName: string;
    persistedName?: string;
    isPublished: boolean;
};

const initialState: RenameContentDialogStore = {
    open: false,
    mode: 'rename',
    path: '',
    initialName: '',
    value: '',
    placeholder: '',
    parentPath: undefined,
    availabilityStatus: undefined,
};

export const $renameContentDialog = map<RenameContentDialogStore>(structuredClone(initialState));

const hasRenameContentDialogChanges = (state: RenameContentDialogStore): boolean => {
    const value = state.value.trim();

    return value.length > 0 && value !== state.initialName;
};

export const $canSubmitRenameContentDialog = computed($renameContentDialog, (state): boolean => {
    return state.open && hasRenameContentDialogChanges(state) && state.availabilityStatus === 'available';
});

let availabilityRequestId = 0;
let availabilityTimer: ReturnType<typeof setTimeout> | undefined;
let resolveDialog: ((nextName?: string) => void) | undefined;

const clearAvailabilityTimer = (): void => {
    if (availabilityTimer) {
        clearTimeout(availabilityTimer);
        availabilityTimer = undefined;
    }
};

const buildPath = (parentPath: ContentPath, name: string): ContentPath => {
    return ContentPath.create().fromParent(parentPath, name).build();
};

const buildNameTemplatePath = (parentPath: ContentPath): string => {
    const basePath = parentPath.isRoot() ? '' : parentPath.toString();
    return `${basePath}/${i18n('dialog.rename.nameTemplate')}`;
};

const resetRenameContentDialog = (): void => {
    clearAvailabilityTimer();
    availabilityRequestId += 1;
    $renameContentDialog.set(structuredClone(initialState));
};

const runAvailabilityCheck = async (requestId: number, path: ContentPath): Promise<void> => {
    try {
        const exists = await new ContentExistsByPathRequest(path.toString()).sendAndParse();
        if (requestId !== availabilityRequestId) {
            return;
        }

        const state = $renameContentDialog.get();
        if (!state.open) {
            return;
        }

        $renameContentDialog.set({
            ...state,
            availabilityStatus: exists ? 'not-available' : 'available',
        });
    } catch (error) {
        if (requestId !== availabilityRequestId) {
            return;
        }

        DefaultErrorHandler.handle(error);

        const state = $renameContentDialog.get();
        if (!state.open) {
            return;
        }

        $renameContentDialog.set({
            ...state,
            availabilityStatus: 'not-available',
        });
    }
};

const scheduleAvailabilityCheck = (name: string, parentPath: ContentPath): void => {
    clearAvailabilityTimer();

    const requestId = ++availabilityRequestId;
    const state = $renameContentDialog.get();
    $renameContentDialog.set({
        ...state,
        availabilityStatus: 'checking',
    });

    availabilityTimer = setTimeout(() => {
        void runAvailabilityCheck(requestId, buildPath(parentPath, name));
    }, 300);
};

export const openRenameContentDialog = ({
    parentPath,
    initialName,
    persistedName,
    isPublished,
}: OpenRenameContentDialogParams): Promise<string | undefined> => {
    resolveDialog?.(undefined);
    resolveDialog = undefined;

    const normalizedInitialName = initialName.trim();
    const normalizedPersistedName = (persistedName ?? initialName).trim();
    const hasName = normalizedInitialName.length > 0;
    const mode: RenameContentDialogMode = hasName
        ? (isPublished ? 'rename-published' : 'rename')
        : 'set-name';
    const templatePath = buildNameTemplatePath(parentPath);

    resetRenameContentDialog();
    $renameContentDialog.set({
        ...structuredClone(initialState),
        open: true,
        mode,
        path: hasName ? buildPath(parentPath, normalizedInitialName).toString() : templatePath,
        initialName: normalizedPersistedName,
        value: hasName ? normalizedInitialName : '',
        placeholder: normalizedPersistedName || templatePath,
        parentPath,
    });

    if (hasName && normalizedInitialName !== normalizedPersistedName) {
        scheduleAvailabilityCheck(normalizedInitialName, parentPath);
    }

    return new Promise((resolve) => {
        resolveDialog = resolve;
    });
};

export const closeRenameContentDialog = (): void => {
    resolveDialog?.(undefined);
    resolveDialog = undefined;
    resetRenameContentDialog();
};

export const setRenameContentDialogValue = (value: string): void => {
    const state = $renameContentDialog.get();
    if (!state.open) {
        return;
    }

    $renameContentDialog.set({
        ...state,
        value,
    });

    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === state.initialName || !state.parentPath) {
        clearAvailabilityTimer();
        availabilityRequestId += 1;
        $renameContentDialog.set({
            ...$renameContentDialog.get(),
            availabilityStatus: undefined,
        });
        return;
    }

    scheduleAvailabilityCheck(trimmedValue, state.parentPath);
};

export const submitRenameContentDialog = (): void => {
    const state = $renameContentDialog.get();
    const nextName = state.value.trim();
    if (!hasRenameContentDialogChanges(state) || state.availabilityStatus !== 'available') {
        return;
    }

    resolveDialog?.(nextName);
    resolveDialog = undefined;
    resetRenameContentDialog();
};
