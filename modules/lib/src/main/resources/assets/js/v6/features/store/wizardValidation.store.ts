import type {ValidationError} from '@enonic/lib-admin-ui/ValidationError';
import {ValidationErrorHelper} from '@enonic/lib-admin-ui/ValidationErrorHelper';
import {type RawValueMap, type ValidationVisibility, validateForm} from '@enonic/lib-admin-ui/form2';
import {atom} from 'nanostores';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {
    $contentType,
    $enabledMixinsNames,
    $mixinsDescriptors,
    $wizardDataVersion,
    $wizardDraftData,
    $wizardDraftMixins,
    onWizardContentReset,
    setWizardFormValidation,
} from './wizardContent.store';
import {createDebounce} from '../utils/timing/createDebounce';

//
// * State
//

export const $validationVisibility = atom<ValidationVisibility>('none');

const $serverErrors = atom<ValidationError[]>([]);

const contentRawValueMap: RawValueMap = new Map();

const mixinRawValueMaps = new Map<string, RawValueMap>();

//
// * Internal
//

const DEBOUNCE_DELAY = 150;

function runValidation(): void {
    const contentType = $contentType.get();
    const draftData = $wizardDraftData.get();
    const draftMixins = $wizardDraftMixins.get();
    const descriptors = $mixinsDescriptors.get();
    const enabledNames = $enabledMixinsNames.get();
    const serverErrors = $serverErrors.get();

    if (!contentType || !draftData) {
        setWizardFormValidation(true);
        return;
    }

    const contentResult = validateForm(contentType.getForm(), draftData.getRoot(), {
        rawValues: contentRawValueMap,
        serverErrors,
    });

    let allMixinsValid = true;

    for (const name of enabledNames) {
        const descriptor = descriptors.find((d) => d.getName() === name);
        if (!descriptor || descriptor.getFormItems().length === 0) {
            continue;
        }

        const mixin = draftMixins.find((m) => m.getName().toString() === name);
        if (!mixin) {
            continue;
        }

        const mixinResult = validateForm(descriptor.toForm(), mixin.getData().getRoot(), {
            rawValues: getMixinRawValueMap(name),
        });

        if (!mixinResult.isValid) {
            allMixinsValid = false;
        }
    }

    setWizardFormValidation(contentResult.isValid && allMixinsValid);
}

const debouncedRunValidation = createDebounce(runValidation, DEBOUNCE_DELAY);

//
// * Subscriptions
//

type Unsubscribe = () => void;

const subscriptions: Unsubscribe[] = [];

let mixinTreeCleanups: Unsubscribe[] = [];

function setupSubscriptions(): void {
    subscriptions.push(
        $wizardDataVersion.subscribe(() => {
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $contentType.subscribe(() => {
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $wizardDraftMixins.subscribe((mixins) => {
            // Detach previous mixin tree listeners
            for (const cleanup of mixinTreeCleanups) {
                cleanup();
            }
            mixinTreeCleanups = [];

            // Attach new listeners to each mixin's PropertyTree
            for (const mixin of mixins) {
                const tree: PropertyTree = mixin.getData();
                const handler = () => {
                    debouncedRunValidation();
                };
                tree.onChanged(handler);
                mixinTreeCleanups.push(() => tree.unChanged(handler));
            }

            // Mixin list itself changed (add/remove) — trigger validation
            debouncedRunValidation();
        }),
    );
}

//
// * Exported functions
//

export function initializeValidation(isNew: boolean): void {
    resetValidation();
    $validationVisibility.set(isNew ? 'interactive' : 'all');
    setupSubscriptions();
    runValidation();
}

export function escalateVisibility(mode: ValidationVisibility): void {
    const order: ValidationVisibility[] = ['none', 'interactive', 'all'];
    const current = order.indexOf($validationVisibility.get());
    const next = order.indexOf(mode);

    if (next > current) {
        $validationVisibility.set(mode);
    }
}

export function setServerValidationErrors(errors: ValidationError[]): void {
    const customErrors = errors.filter((e) => ValidationErrorHelper.isCustomError(e));
    $serverErrors.set(customErrors);
    runValidation();
}

export function getContentRawValueMap(): RawValueMap {
    return contentRawValueMap;
}

export function getMixinRawValueMap(name: string): RawValueMap {
    let map = mixinRawValueMaps.get(name);
    if (!map) {
        map = new Map();
        mixinRawValueMaps.set(name, map);
    }
    return map;
}

export function flushValidation(): void {
    debouncedRunValidation.flush();
}

export function resetValidation(): void {
    debouncedRunValidation.cancel();

    for (const cleanup of mixinTreeCleanups) {
        cleanup();
    }
    mixinTreeCleanups = [];

    for (const unsub of subscriptions) {
        unsub();
    }
    subscriptions.length = 0;

    $validationVisibility.set('none');
    $serverErrors.set([]);
    contentRawValueMap.clear();
    mixinRawValueMaps.clear();
}

//
// * Cleanup registration
//

onWizardContentReset(resetValidation);
