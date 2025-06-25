import type {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {toPathKey} from '../utils/cms/property/path';

export type ChangedPathsStore = {
    get: () => Record<string, number>;
    setKey: (key: string, value: number | undefined) => void;
};

export function getParentSetByPath(
    tree: PropertyTree,
    path: PropertyPath | null | undefined,
): ReturnType<PropertyTree['getRoot']> | undefined {
    return !path || path.elementCount() === 0 ? tree.getRoot() : tree.getPropertySet(path);
}

export function hasPropertyByPath(tree: PropertyTree, path: PropertyPath): boolean {
    return tree.getProperty(path.toString()) != null;
}

type StringPropertyState = {
    exists: boolean;
    isNull: boolean;
    value: string | null;
};

function getStringPropertyState(tree: PropertyTree | null, path: PropertyPath): StringPropertyState {
    const property = tree?.getProperty(path.toString());
    if (!property) {
        return {
            exists: false,
            isNull: false,
            value: null,
        };
    }

    const isNull = property.hasNullValue();
    return {
        exists: true,
        isNull,
        value: isNull ? null : property.getString(),
    };
}

function stringPropertyStatesEqual(a: StringPropertyState, b: StringPropertyState): boolean {
    if (!a.exists || !b.exists) {
        return a.exists === b.exists;
    }

    if (a.isNull !== b.isNull) {
        return false;
    }

    if (a.isNull) {
        return true;
    }

    return a.value === b.value;
}

function pruneEmptyParentSets(tree: PropertyTree, path: PropertyPath | null | undefined): void {
    let currentPath = path;

    while (currentPath && currentPath.elementCount() > 0) {
        const currentSet = tree.getPropertySet(currentPath);
        if (!currentSet || currentSet.getSize() > 0) {
            return;
        }

        const ownerPath = currentPath.getParentPath();
        const ownerSet = getParentSetByPath(tree, ownerPath);
        if (!ownerSet) {
            return;
        }

        const currentElement = currentPath.getLastElement();
        ownerSet.removeProperty(currentElement.getName(), currentElement.getIndex());
        currentPath = ownerPath;
    }
}

export function removeStringByPath(tree: PropertyTree, path: PropertyPath): void {
    const parentPath = path.getParentPath();
    const parentSet = getParentSetByPath(tree, parentPath);
    if (!parentSet) {
        return;
    }

    const pathElement = path.getLastElement();
    parentSet.removeProperty(pathElement.getName(), pathElement.getIndex());
    pruneEmptyParentSets(tree, parentPath);
}

export function getBasePathKey(pathKey: string): string {
    return pathKey.replace(/\[\d+]$/, '');
}

export function reconcileChangedPathsForArray(
    changedPathsStore: ChangedPathsStore,
    basePathKey: string,
    draftParent: ReturnType<PropertyTree['getRoot']> | undefined,
    persistedParent: ReturnType<PropertyTree['getRoot']> | undefined,
    propertyName: string,
): void {
    const draftArray = draftParent?.getPropertyArray(propertyName);
    const persistedArray = persistedParent?.getPropertyArray(propertyName);
    const draftCount = draftArray?.getSize() ?? 0;
    const persistedCount = persistedArray?.getSize() ?? 0;

    let hasChange = false;

    if (draftCount !== persistedCount) {
        hasChange = true;
    } else {
        for (let i = 0; i < draftCount; i += 1) {
            const draftProperty = draftArray?.get(i);
            const persistedProperty = persistedArray?.get(i);
            const draftIsNull = draftProperty?.hasNullValue() ?? false;
            const persistedIsNull = persistedProperty?.hasNullValue() ?? false;
            const draftValue = draftProperty?.getString() ?? null;
            const persistedValue = persistedProperty?.getString() ?? null;

            if (draftIsNull !== persistedIsNull || draftValue !== persistedValue) {
                hasChange = true;
                break;
            }
        }
    }

    // Clear stale indexed keys (e.g. "field[0]", "field[1]"), but not the base key itself.
    // Clearing and re-setting the base key synchronously would be a no-op under React batching.
    const changedPaths = changedPathsStore.get();
    for (const key of Object.keys(changedPaths)) {
        if (key.startsWith(`${basePathKey}[`)) {
            changedPathsStore.setKey(key, undefined);
        }
    }

    if (hasChange) {
        const current = changedPathsStore.get()[basePathKey] ?? 0;
        changedPathsStore.setKey(basePathKey, current + 1);
    } else {
        changedPathsStore.setKey(basePathKey, undefined);
    }
}

export function setStringValue(
    draftTree: PropertyTree,
    persistedTree: PropertyTree | null,
    changedPaths: ChangedPathsStore,
    path: PropertyPath,
    value: string,
): boolean {
    const normalizedValue = value ?? '';
    const pathKey = toPathKey(path);
    const basePathKey = getBasePathKey(pathKey);
    const persistedState = getStringPropertyState(persistedTree, path);
    const draftState = getStringPropertyState(draftTree, path);
    const isClearingToPersistedEmpty = normalizedValue === '' &&
        persistedState.exists &&
        (persistedState.isNull || persistedState.value === '');
    const shouldRemoveProperty = normalizedValue === '' && !persistedState.exists;
    const shouldRestorePersistedProperty = isClearingToPersistedEmpty;

    if (shouldRemoveProperty && !draftState.exists) {
        changedPaths.setKey(pathKey, undefined);
        return false;
    }

    if (shouldRestorePersistedProperty && stringPropertyStatesEqual(draftState, persistedState)) {
        changedPaths.setKey(pathKey, undefined);
        return false;
    }

    if (!shouldRemoveProperty &&
        !shouldRestorePersistedProperty &&
        draftState.exists &&
        !draftState.isNull &&
        draftState.value === normalizedValue) {
        return false;
    }

    if (shouldRemoveProperty) {
        removeStringByPath(draftTree, path);
    } else if (shouldRestorePersistedProperty) {
        if (persistedState.isNull) {
            draftTree.setPropertyByPath(path, ValueTypes.STRING.newNullValue());
        } else {
            draftTree.setStringByPath(path, '');
        }
    } else {
        draftTree.setStringByPath(path, normalizedValue);
    }

    if (shouldRemoveProperty && basePathKey !== pathKey) {
        const parentPath = path.getParentPath();
        const propertyName = path.getLastElement().getName();
        const draftParent = getParentSetByPath(draftTree, parentPath);
        const persistedParent = persistedTree ? getParentSetByPath(persistedTree, parentPath) : undefined;

        reconcileChangedPathsForArray(changedPaths, basePathKey, draftParent, persistedParent, propertyName);
        return true;
    }

    const nextDraftState = getStringPropertyState(draftTree, path);
    if (stringPropertyStatesEqual(nextDraftState, persistedState)) {
        changedPaths.setKey(pathKey, undefined);
    } else {
        const current = changedPaths.get()[pathKey] ?? 0;
        changedPaths.setKey(pathKey, current + 1);
    }

    return true;
}

export function addStringOccurrence(
    draftTree: PropertyTree,
    persistedTree: PropertyTree | null,
    changedPaths: ChangedPathsStore,
    path: PropertyPath,
    occurrenceIndex: number,
): boolean {
    if (occurrenceIndex < 0) {
        return false;
    }

    const parentPath = path.getParentPath();
    const propertyName = path.getLastElement().getName();
    const parentSet = getParentSetByPath(draftTree, parentPath);
    if (!parentSet) {
        return false;
    }

    const basePathKey = toPathKey(path);
    const persistedParent = persistedTree ? getParentSetByPath(persistedTree, parentPath) : undefined;
    const persistedProperty = persistedParent?.getPropertyArray(propertyName)?.get(occurrenceIndex);

    if (persistedProperty?.hasNullValue()) {
        parentSet.addProperty(propertyName, ValueTypes.STRING.newNullValue());
    } else {
        parentSet.addString(propertyName, null);
    }

    reconcileChangedPathsForArray(changedPaths, basePathKey, parentSet, persistedParent, propertyName);

    return true;
}

export function removeStringOccurrence(
    draftTree: PropertyTree,
    persistedTree: PropertyTree | null,
    changedPaths: ChangedPathsStore,
    path: PropertyPath,
    occurrenceIndex: number,
): boolean {
    if (occurrenceIndex < 0) {
        return false;
    }

    const parentPath = path.getParentPath();
    const propertyName = path.getLastElement().getName();
    const parentSet = getParentSetByPath(draftTree, parentPath);
    if (!parentSet) {
        return false;
    }

    const propertyArray = parentSet.getPropertyArray(propertyName);
    if (!propertyArray || occurrenceIndex >= propertyArray.getSize()) {
        return false;
    }

    parentSet.removeProperty(propertyName, occurrenceIndex);

    const basePathKey = toPathKey(path);
    const persistedParent = persistedTree ? getParentSetByPath(persistedTree, parentPath) : undefined;
    reconcileChangedPathsForArray(changedPaths, basePathKey, parentSet, persistedParent, propertyName);

    return true;
}
