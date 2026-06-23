import {AttachmentValidationError, ComponentConfigValidationError, DataValidationError, MixinConfigValidationError, SiteConfigValidationError, type ValidationError} from '@enonic/lib-admin-ui/ValidationError';
import {matchesFieldPath, matchesOccurrencePath, type RawValueMap, type ServerErrorEntry, type ValidationVisibility, validateForm} from '@enonic/lib-admin-ui/form2';
import {atom, computed} from 'nanostores';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import type {Descriptor} from '../../../app/page/Descriptor';
import {DescriptorBasedComponent} from '../../../app/page/region/DescriptorBasedComponent';
import {LayoutComponent} from '../../../app/page/region/LayoutComponent';
import type {Region} from '../../../app/page/region/Region';
import {
    $contentType,
    $enabledMixinsNames,
    $mixinsDescriptors,
    $wizardDataChanged,
    $wizardDataVersion,
    $wizardDraftData,
    $wizardDraftDisplayName,
    $wizardDraftMixins,
    onWizardContentReset,
    setWizardFormValidation,
} from './wizardContent.store';
import {$page, $pageVersion} from './page-editor/store';
import {$layoutDescriptorOptions, $partDescriptorOptions} from './component-inspection.store';
import {$applications} from './applications.store';
import {createDebounce} from '../utils/timing/createDebounce';

//
// * State
//

export const $validationVisibility = atom<ValidationVisibility>('none');

// Tracks which tabs have invalid forms. Values are tab keys: 'content', 'page', or mixin name.
export const $invalidTabs = atom<ReadonlySet<string>>(new Set());

export const $invalidComponentPaths = atom<ReadonlySet<string>>(new Set());

const $dataServerErrors = atom<DataValidationError[]>([]);

// Server data errors flattened for the form fields to display by data path.
export const $dataServerErrorEntries = computed($dataServerErrors, (errors): ServerErrorEntry[] =>
    errors.map((e) => ({path: e.getPropertyPath(), message: e.getMessage()})),
);

const $componentConfigErrors = atom<ComponentConfigValidationError[]>([]);

const $attachmentServerErrors = atom<AttachmentValidationError[]>([]);

export const $attachmentServerErrorEntries = computed($attachmentServerErrors, (errors): {attachment: string; message: string}[] =>
    errors.map((e) => ({attachment: e.getAttachment(), message: e.getMessage()})),
);

const $generalServerErrors = atom<ValidationError[]>([]);

export const $generalServerErrorMessages = computed($generalServerErrors, (errors): string[] =>
    errors.map((e) => e.getMessage()),
);

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
    const dataServerErrors = $dataServerErrors.get();

    if (!contentType || !draftData) {
        setWizardFormValidation(true);
        $invalidTabs.set(new Set());
        $invalidComponentPaths.set(new Set());
        return;
    }

    const contentResult = validateForm(contentType.getForm(), draftData.getRoot(), {
        rawValues: contentRawValueMap,
        serverErrors: dataServerErrors,
    });

    const nextInvalidTabs = new Set<string>();
    const hasInvalidDisplayName = $wizardDraftDisplayName.get().trim().length === 0;
    const hasAttachmentErrors = $attachmentServerErrors.get().length > 0;
    const hasGeneralErrors = $generalServerErrors.get().length > 0;

    if (!contentResult.isValid || hasInvalidDisplayName || hasAttachmentErrors || hasGeneralErrors) {
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
    setWizardFormValidation(
        contentResult.isValid && allMixinsValid && allInvalidPaths.size === 0 && !hasAttachmentErrors && !hasGeneralErrors,
    );

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
            debouncedRunValidation();
        }),
    );

    subscriptions.push(
        $wizardDataChanged.subscribe((changed) => {
            if (changed && $generalServerErrors.get().length > 0) {
                $generalServerErrors.set([]);
                runValidation();
            }
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

    // SiteConfigurator validity depends on the async-loaded application forms.
    subscriptions.push(
        $applications.subscribe(() => {
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

// Validation error codes are `<applicationKey>:<code>` (e.g. "system:cms.occurrencesInvalid").
// Errors in the SYSTEM application are built-in occurrence/required checks that duplicate our
// client-side validation; we ignore them and surface the (more readable) client messages instead.
// Custom app validators carry their own application key (e.g. "com.acme.app:..") and are kept.
const SYSTEM_ERROR_CODE_PREFIX = 'system:';

function isSystemError(error: ValidationError): boolean {
    return (error.getErrorCode() ?? '').startsWith(SYSTEM_ERROR_CODE_PREFIX);
}

export function setServerValidationErrors(errors: ValidationError[]): void {
    // ! Data errors route by propertyPath; attachment errors (null path) route by file
    // ! name. Data system errors are dropped (client-side validation covers them better),
    // ! but attachment ones are kept — v6 has no client-side check to re-surface them.
    const dataErrors = errors.filter(
        (e): e is DataValidationError => e instanceof DataValidationError
            && !(e instanceof ComponentConfigValidationError)
            && !(e instanceof SiteConfigValidationError)
            && !(e instanceof MixinConfigValidationError)
            && !isSystemError(e)
    );

    const componentErrors = errors.filter(
        (e): e is ComponentConfigValidationError => e instanceof ComponentConfigValidationError,
    );

    const attachmentErrors = errors.filter(
        (e): e is AttachmentValidationError => e instanceof AttachmentValidationError,
    );

    const generalErrors = errors.filter(
        (e) => !(e instanceof DataValidationError) && !(e instanceof AttachmentValidationError) && !isSystemError(e),
    );

    $dataServerErrors.set(dataErrors);
    $componentConfigErrors.set(componentErrors);
    $attachmentServerErrors.set(attachmentErrors);
    $generalServerErrors.set(generalErrors);
    runValidation();
}

// Drop the server errors on an edited occurrence's data path (and its descendants).
export function clearServerErrorsAtPath(occurrencePath: string): void {
    const current = $dataServerErrors.get();
    const next = current.filter((e) => !matchesOccurrencePath(e.getPropertyPath(), occurrencePath));
    if (next.length === current.length) return;

    $dataServerErrors.set(next);
    runValidation();
}

// Drop every server error on a field (all occurrences). Used on structural
// occurrence changes (add/remove/move), where positional alignment is lost;
// fresh errors arrive on the next save.
export function clearServerErrorsForField(fieldPath: string): void {
    const current = $dataServerErrors.get();
    const next = current.filter((e) => !matchesFieldPath(e.getPropertyPath(), fieldPath));
    if (next.length === current.length) return;

    $dataServerErrors.set(next);
    runValidation();
}

export function clearAttachmentServerError(attachment: string): void {
    const current = $attachmentServerErrors.get();
    const next = current.filter((e) => e.getAttachment() !== attachment);
    if (next.length === current.length) return;

    $attachmentServerErrors.set(next);
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
    $dataServerErrors.set([]);
    $componentConfigErrors.set([]);
    $attachmentServerErrors.set([]);
    $generalServerErrors.set([]);
    contentRawValueMap.clear();
    mixinRawValueMaps.clear();
}

//
// * Cleanup registration
//

onWizardContentReset(resetValidation);
