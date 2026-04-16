import {ComponentConfigValidationError, DataValidationError, MixinConfigValidationError, SiteConfigValidationError, type ValidationError} from '@enonic/lib-admin-ui/ValidationError';
import {ValidationErrorHelper} from '@enonic/lib-admin-ui/ValidationErrorHelper';
import {type RawValueMap, type ValidationVisibility, validateForm} from '@enonic/lib-admin-ui/form2';
import {atom} from 'nanostores';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import type {Descriptor} from '../../../app/page/Descriptor';
import {DescriptorBasedComponent} from '../../../app/page/region/DescriptorBasedComponent';
import {LayoutComponent} from '../../../app/page/region/LayoutComponent';
import type {Region} from '../../../app/page/region/Region';
import {
    $contentType,
    $enabledMixinsNames,
    $mixinsDescriptors,
    $wizardDataVersion,
    $wizardDraftData,
    $wizardDraftDisplayName,
    $wizardDraftMixins,
    onWizardContentReset,
    setWizardFormValidation,
} from './wizardContent.store';
import {$page, $pageVersion} from './page-editor/store';
import {$layoutDescriptorOptions, $partDescriptorOptions} from './component-inspection.store';
import {createDebounce} from '../utils/timing/createDebounce';

//
// * State
//

export const $validationVisibility = atom<ValidationVisibility>('none');

// Tracks which tabs have invalid forms. Values are tab keys: 'content', 'page', or mixin name.
export const $invalidTabs = atom<ReadonlySet<string>>(new Set());

export const $invalidComponentPaths = atom<ReadonlySet<string>>(new Set());

const $contentServerErrors = atom<DataValidationError[]>([]);

const $componentConfigErrors = atom<ComponentConfigValidationError[]>([]);

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
    const contentServerErrors = $contentServerErrors.get();

    if (!contentType || !draftData) {
        setWizardFormValidation(true);
        $invalidTabs.set(new Set());
        $invalidComponentPaths.set(new Set());
        return;
    }

    const contentResult = validateForm(contentType.getForm(), draftData.getRoot(), {
        rawValues: contentRawValueMap,
        serverErrors: contentServerErrors,
    });

    const nextInvalidTabs = new Set<string>();
    const hasInvalidDisplayName = $wizardDraftDisplayName.get().trim().length === 0;

    if (!contentResult.isValid || hasInvalidDisplayName) {
        nextInvalidTabs.add('content');
    }

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
            nextInvalidTabs.add(name);
        }
    }

    // Component config validation: server errors + client-side form validation
    const serverErrorPaths = $componentConfigErrors.get().map((e) => e.getComponentPath());
    const clientInvalidPaths = validateComponentConfigs();
    const allInvalidPaths = new Set([...serverErrorPaths, ...clientInvalidPaths]);

    if (allInvalidPaths.size > 0) {
        nextInvalidTabs.add('page');
    }

    $invalidComponentPaths.set(allInvalidPaths);
    $invalidTabs.set(nextInvalidTabs);
    setWizardFormValidation(contentResult.isValid && allMixinsValid && allInvalidPaths.size === 0);

}

const debouncedRunValidation = createDebounce(runValidation, DEBOUNCE_DELAY);

//
// * Component config validation
//

function validateComponentConfigs(): Set<string> {
    const page = $page.get();
    if (!page) return new Set();

    const partDescriptors = $partDescriptorOptions.get();
    const layoutDescriptors = $layoutDescriptorOptions.get();
    const allDescriptors = [...partDescriptors, ...layoutDescriptors];
    if (allDescriptors.length === 0) return new Set();

    const invalidPaths = new Set<string>();

    if (page.isFragment()) {
        const fragment = page.getFragment();

        // Validate the fragment component itself
        if (fragment instanceof DescriptorBasedComponent && fragment.hasDescriptor()) {
            validateComponent(fragment, '/', allDescriptors, invalidPaths);
        }

        // Validate children if the fragment is a layout
        if (fragment instanceof LayoutComponent) {
            const regions = fragment.getRegions()?.getRegions() ?? [];
            for (const region of regions) {
                validateRegionComponents(region, '/', allDescriptors, invalidPaths);
            }
        }
    } else {
        const regions = page.getRegions()?.getRegions() ?? [];
        for (const region of regions) {
            validateRegionComponents(region, '/', allDescriptors, invalidPaths);
        }
    }

    return invalidPaths;
}

function validateRegionComponents(
    region: Region,
    parentPath: string,
    descriptors: Descriptor[],
    invalidPaths: Set<string>,
): void {
    const regionPath = parentPath === '/'
        ? `/${region.getName()}`
        : `${parentPath}/${region.getName()}`;

    region.getComponents().forEach((component, index) => {
        const componentPath = `${regionPath}/${index}`;

        if (component instanceof DescriptorBasedComponent && component.hasDescriptor()) {
            validateComponent(component, componentPath, descriptors, invalidPaths);
        }

        if (component instanceof LayoutComponent) {
            const layoutRegions = component.getRegions()?.getRegions() ?? [];
            for (const layoutRegion of layoutRegions) {
                validateRegionComponents(layoutRegion, componentPath, descriptors, invalidPaths);
            }
        }
    });
}

function validateComponent(
    component: DescriptorBasedComponent,
    componentPath: string,
    descriptors: Descriptor[],
    invalidPaths: Set<string>,
): void {
    const descriptorKey = component.getDescriptorKey().toString();
    const descriptor = descriptors.find((d) => d.getKey().toString() === descriptorKey);
    if (!descriptor) return;

    const configForm = descriptor.getConfig();
    const configRoot = component.getConfig()?.getRoot();
    if (!configForm || !configRoot || configForm.getFormItems().length === 0) return;

    const result = validateForm(configForm, configRoot);
    if (!result.isValid) {
        invalidPaths.add(componentPath);
    }
}

//
// * Subscriptions
//

type Unsubscribe = () => void;

const subscriptions: Unsubscribe[] = [];

let mixinTreeCleanups: Unsubscribe[] = [];

function setupSubscriptions(): void {
    subscriptions.push(
        $wizardDataVersion.subscribe(() => {
            if ($contentServerErrors.get().length > 0) {
                $contentServerErrors.set([]);
            }
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $contentType.subscribe(() => {
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $wizardDraftDisplayName.subscribe(() => {
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $pageVersion.subscribe(() => {
            if ($componentConfigErrors.get().length > 0) {
                $componentConfigErrors.set([]);
            }
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $partDescriptorOptions.subscribe(() => {
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $layoutDescriptorOptions.subscribe(() => {
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
    // ! Only DataValidationError has a propertyPath that validateForm can match
    // ! against content form fields. Base ValidationError and AttachmentValidationError
    // ! return null from getPropertyPath(), which would crash matchServerErrors.
    // ! System errors (e.g. "system:required") are already handled by client-side
    // ! validation; keeping them here would make them sticky after the user fixes
    // ! the field, because $contentServerErrors is only refreshed on save.
    const contentErrors = errors.filter(
        (e): e is DataValidationError => e instanceof DataValidationError
            && !(e instanceof ComponentConfigValidationError)
            && !(e instanceof SiteConfigValidationError)
            && !(e instanceof MixinConfigValidationError)
    );

    const componentErrors = errors.filter(
        (e): e is ComponentConfigValidationError => e instanceof ComponentConfigValidationError,
    );
    $contentServerErrors.set(contentErrors);
    $componentConfigErrors.set(componentErrors);
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
    $invalidTabs.set(new Set());
    $invalidComponentPaths.set(new Set());
    $contentServerErrors.set([]);
    $componentConfigErrors.set([]);
    contentRawValueMap.clear();
    mixinRawValueMaps.clear();
}

//
// * Cleanup registration
//

onWizardContentReset(resetValidation);
