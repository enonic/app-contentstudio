import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {atom, computed} from 'nanostores';
import type {Content} from '../../../app/content/Content';
import type {MixinDescriptor} from '../../../app/content/MixinDescriptor';
import type {ContentType} from '../../../app/inputtype/schema/ContentType';
import type {Page} from '../../../app/page/Page';

//
// * Store
//

export const $persistedContent = atom<Content | null>(null);

export const $contentType = atom<ContentType | null>(null);

//
//! This is broken, we need to fix it
//
export const $mixinsDescriptors = atom<MixinDescriptor[]>([]);

//
// * Derived State
//

export const $persistedDisplayName = computed($persistedContent, (content) => content?.getDisplayName() ?? '');

const $displayNameDraft = atom<string | null>(null);

export const $displayName = computed(
    [$displayNameDraft, $persistedDisplayName],
    (draft, persisted) => draft ?? persisted,
);

export const $persistedPage = computed($persistedContent, (content): Page | null => content?.getPage() ?? null);

export const $persistedHasPage = computed($persistedPage, (page) => page != null);

export const $persistedData = computed($persistedContent, (content): PropertyTree | null => content?.getContentData() ?? null);

export const $persistedMixins = computed($persistedContent, (content): MixinDescriptor[] => []);

export const $contentTypeDisplayName = computed($contentType, (contentType) => contentType?.getDisplayName() ?? '');

export type MixinTabInfo = {
    name: string;
    displayName: string;
};

export const $mixinsPendingChanges = atom<Map<string, boolean>>(new Map());

export const $enabledMixinsNames = computed(
    [$persistedMixins, $mixinsDescriptors, $mixinsPendingChanges],
    (extraData, schemas, pendingChanges): Set<string> => {
        const persistedNames = new Set(extraData.map((extra) => extra.getName().toString()));
        const enabledNames = new Set<string>();

        for (const schema of schemas) {
            const name = schema.getName();
            const override = pendingChanges.get(name);

            if (override != null) {
                if (override) {
                    enabledNames.add(name);
                }
            } else if (!schema.isOptional() || persistedNames.has(name)) {
                enabledNames.add(name);
            }
        }

        return enabledNames;
    },
);

export const $mixinsTabs = computed([$enabledMixinsNames, $mixinsDescriptors], (enabledNames, schemas): MixinTabInfo[] => {
    return schemas
        .filter((schema) => enabledNames.has(schema.getName()))
        .map((schema) => ({
            name: schema.getName(),
            displayName: schema.getDisplayName() ?? schema.getName(),
        }));
});

export type MixinMenuItem = {
    name: string;
    displayName: string;
    isOptional: boolean;
    isEnabled: boolean;
};

export const $mixinsMenuItems = computed([$mixinsDescriptors, $enabledMixinsNames], (schemas, enabledNames): MixinMenuItem[] => {
    return schemas.map((schema) => ({
        name: schema.getName(),
        displayName: schema.getDisplayName() ?? schema.getName(),
        isOptional: schema.isOptional(),
        isEnabled: enabledNames.has(schema.getName()),
    }));
});

//
// * Actions
//

export function setDisplayNameDraft(value: string): void {
    $displayNameDraft.set(value);
}

export function setPersistedContent(content: Content): void {
    $persistedContent.set(content);
    $displayNameDraft.set(null);
}

export function setContentType(contentType: ContentType): void {
    $contentType.set(contentType);
}

export function setMixinsDescriptors(mixinsDescriptors: MixinDescriptor[]): void {
    $mixinsDescriptors.set(mixinsDescriptors);
}

export function toggleMixin(name: string, enabled: boolean): void {
    const next = new Map($mixinsPendingChanges.get());
    next.set(name, enabled);
    $mixinsPendingChanges.set(next);
}

export function resetWizardContent(): void {
    $persistedContent.set(null);
    $contentType.set(null);
    $mixinsDescriptors.set([]);
    $mixinsPendingChanges.set(new Map());
    $displayNameDraft.set(null);
}
