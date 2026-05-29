import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {computed, map} from 'nanostores';
import {ContentPath} from '../../../../app/content/ContentPath';
import {ContentExistsByPathRequest} from '../../../../app/resource/ContentExistsByPathRequest';
import {
    type ContentPathDisplayValues,
    getContentPathDisplayValues,
    getUnnamedContentPathLabel,
} from '../../utils/cms/content/paths';

export type RenameContentDialogMode = 'rename-published' | 'rename' | 'set-name';
export type RenameContentDialogAvailabilityStatus = 'not-available' | 'checking' | 'available';

type RenameContentDialogStore = {
    open: boolean;
    mode: RenameContentDialogMode;
    fullPath: string;
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
    unnamedContentPathLabel: string;
};

const initialState: RenameContentDialogStore = {
    open: false,
    mode: 'rename',
    fullPath: '',
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

const buildContentPathDisplayValues = (
    parentPath: ContentPath,
    name: string,
    unnamedContentPathLabel: string,
): ContentPathDisplayValues => {
    const normalizedName = name.trim();
    if (normalizedName) {
        return getContentPathDisplayValues(buildPath(parentPath, normalizedName), unnamedContentPathLabel);
    }

    const parentFullPath = getContentPathDisplayValues(parentPath, unnamedContentPathLabel).fullPath;
    const pathLabel = getUnnamedContentPathLabel(unnamedContentPathLabel);

    return {
        pathLabel,
        fullPath: `${parentFullPath === '/' ? '' : parentFullPath}/${pathLabel}`,
    };
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
    unnamedContentPathLabel,
}: OpenRenameContentDialogParams): Promise<string | undefined> => {
    resolveDialog?.(undefined);
    resolveDialog = undefined;

    const normalizedInitialName = initialName.trim();
    const normalizedPersistedName = (persistedName ?? initialName).trim();
    const hasName = normalizedInitialName.length > 0;
    const mode: RenameContentDialogMode = hasName
        ? (isPublished ? 'rename-published' : 'rename')
        : 'set-name';
    const {fullPath, pathLabel} = buildContentPathDisplayValues(parentPath, normalizedInitialName, unnamedContentPathLabel);

    resetRenameContentDialog();
    $renameContentDialog.set({
        ...structuredClone(initialState),
        open: true,
        mode,
        fullPath,
        initialName: normalizedPersistedName,
        value: hasName ? normalizedInitialName : '',
        placeholder: pathLabel,
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
