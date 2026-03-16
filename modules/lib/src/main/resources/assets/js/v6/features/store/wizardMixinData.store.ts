import type {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {type ReadableAtom, computed, map} from 'nanostores';
import type {FormDataContextValue} from '../views/wizard/content-wizard-tabs/FormDataContext';
import {$wizardDraftMixins, $wizardPersistedMixins, onWizardContentReset} from './wizardContent.store';
import {addStringOccurrence, removeStringOccurrence, setStringValue} from './wizardPropertyTree.utils';

type MixinDataStores = {
    $draftData: ReadableAtom<PropertyTree | null>;
    $changedPaths: ReturnType<typeof map<Record<string, number>>>;
    context: FormDataContextValue;
};

const mixinDataStoresMap = new Map<string, MixinDataStores>();

function createMixinDataStores(mixinName: string): MixinDataStores {
    const $draftData = computed($wizardDraftMixins, (mixins) => {
        const mixin = mixins.find((m) => m.getName().toString() === mixinName);
        return mixin?.getData() ?? null;
    });

    const $persistedData = computed($wizardPersistedMixins, (mixins) => {
        const mixin = mixins.find((m) => m.getName().toString() === mixinName);
        return mixin?.getData() ?? null;
    });

    const $changedPaths = map<Record<string, number>>({});
    const $validation = map<Record<string, string[]>>({});

    const getDraftStringByPath = (path: PropertyPath): string => {
        return $draftData.get()?.getString(path) ?? '';
    };

    const setDraftStringByPath = (path: PropertyPath, value: string): void => {
        const draftData = $draftData.get();
        if (!draftData) {
            return;
        }

        const mutated = setStringValue(draftData, $persistedData.get(), $changedPaths, path, value);
        if (mutated) {
            $wizardDraftMixins.set([...$wizardDraftMixins.get()]);
        }
    };

    const addOccurrence = (path: PropertyPath, occurrenceIndex: number): void => {
        const draftData = $draftData.get();
        if (!draftData) {
            return;
        }

        const mutated = addStringOccurrence(draftData, $persistedData.get(), $changedPaths, path, occurrenceIndex);
        if (mutated) {
            $wizardDraftMixins.set([...$wizardDraftMixins.get()]);
        }
    };

    const removeOccurrence = (path: PropertyPath, occurrenceIndex: number): void => {
        const draftData = $draftData.get();
        if (!draftData) {
            return;
        }

        const mutated = removeStringOccurrence(draftData, $persistedData.get(), $changedPaths, path, occurrenceIndex);
        if (mutated) {
            $wizardDraftMixins.set([...$wizardDraftMixins.get()]);
        }
    };

    const stores: MixinDataStores = {
        $draftData,
        $changedPaths,
        context: {
            $draftData,
            $changedPaths,
            $validation,
            getDraftStringByPath,
            setDraftStringByPath,
            addOccurrence,
            removeOccurrence,
        },
    };

    return stores;
}

export function getMixinDataContext(mixinName: string): FormDataContextValue {
    let stores = mixinDataStoresMap.get(mixinName);
    if (!stores) {
        stores = createMixinDataStores(mixinName);
        mixinDataStoresMap.set(mixinName, stores);
    }
    return stores.context;
}

function resetMixinDataStores(): void {
    for (const stores of mixinDataStoresMap.values()) {
        stores.$changedPaths.set({});
    }
    mixinDataStoresMap.clear();
}

onWizardContentReset(resetMixinDataStores);
