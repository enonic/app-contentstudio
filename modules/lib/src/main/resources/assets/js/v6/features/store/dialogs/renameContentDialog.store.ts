import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {computed, map} from 'nanostores';
import {ContentPath} from '../../../../app/content/ContentPath';
import {ContentExistsByPathRequest} from '../../../../app/resource/ContentExistsByPathRequest';

export type RenameContentDialogMode = 'rename-published' | 'rename' | 'set-name';
export type RenameContentDialogAvailabilityStatus = 'not-available' | 'checking' | 'available';
export type RenameContentDialogValidationStatus = 'invalid';

type RenameContentDialogStore = {
    open: boolean;
    mode: RenameContentDialogMode;
    pathName: string;
    initialName: string;
    value: string;
    parentPath?: ContentPath;
    availabilityStatus?: RenameContentDialogAvailabilityStatus;
    validationStatus?: RenameContentDialogValidationStatus;
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
    pathName: '',
    initialName: '',
    value: '',
    parentPath: undefined,
    availabilityStatus: undefined,
    validationStatus: undefined,
};

export const $renameContentDialog = map<RenameContentDialogStore>(structuredClone(initialState));

const INVALID_CONTENT_NAME_CHARACTERS = '/\\|?*';
const RESERVED_CONTENT_NAMES = new Set(['_', '.', '..']);
const VALID_CONTENT_NAME_CHARACTER_PATTERN = /^[\p{L}\p{Nd}\p{P}\p{S}]$/u;

function hasInvalidContentNameCharacters(value: string): boolean {
    for (let index = 0; index < value.length; index++) {
        const char = value.charAt(index);
        if (
            INVALID_CONTENT_NAME_CHARACTERS.includes(char) ||
            (char !== ' ' && !VALID_CONTENT_NAME_CHARACTER_PATTERN.test(char))
        ) {
            return true;
        }
    }

    return false;
}

function validateContentName(value: string): RenameContentDialogValidationStatus | undefined {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
        return undefined;
    }

    if (
        RESERVED_CONTENT_NAMES.has(trimmedValue) ||
        hasInvalidContentNameCharacters(trimmedValue)
    ) {
        return 'invalid';
    }

    return undefined;
}

const hasRenameContentDialogChanges = (state: RenameContentDialogStore): boolean => {
    const value = state.value.trim();

    return value.length > 0 && value !== state.initialName;
};

export const $canSubmitRenameContentDialog = computed($renameContentDialog, (state): boolean => {
    return state.open &&
           hasRenameContentDialogChanges(state) &&
           state.validationStatus !== 'invalid' &&
           state.availabilityStatus === 'available';
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
    const hasPendingChange = hasName && normalizedInitialName !== normalizedPersistedName;
    const validationStatus = hasPendingChange ? validateContentName(normalizedInitialName) : undefined;
    const mode: RenameContentDialogMode = hasName
        ? (isPublished ? 'rename-published' : 'rename')
        : 'set-name';

    resetRenameContentDialog();
    $renameContentDialog.set({
        ...structuredClone(initialState),
        open: true,
        mode,
        pathName: normalizedInitialName,
        initialName: normalizedPersistedName,
        value: hasName ? normalizedInitialName : '',
        parentPath,
        validationStatus,
    });

    if (hasPendingChange && validationStatus !== 'invalid') {
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

    const trimmedValue = value.trim();
    const validationStatus = validateContentName(value);

    $renameContentDialog.set({
        ...state,
        value,
        validationStatus,
        availabilityStatus: validationStatus === 'invalid'
                            ? undefined
                            : state.availabilityStatus,
    });

    if (validationStatus === 'invalid') {
        clearAvailabilityTimer();
        availabilityRequestId += 1;

        return;
    }

    if (trimmedValue === state.value.trim()) {
        return;
    }

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
    if (
        !hasRenameContentDialogChanges(state) ||
        state.validationStatus === 'invalid' ||
        state.availabilityStatus !== 'available'
    ) {
        return;
    }

    resolveDialog?.(nextName);
    resolveDialog = undefined;
    resetRenameContentDialog();
};
