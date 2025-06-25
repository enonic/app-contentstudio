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
export const $mixins = atom<MixinDescriptor[]>([]);

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

export type XDataTabInfo = {
    name: string;
    displayName: string;
};

export const $mixinsTabs = computed([$persistedMixins, $mixins], (extraData, schemas): XDataTabInfo[] => {
    return extraData.map((extra) => {
        const name = extra.getName().toString();
        const schema = schemas.find((s) => s.getName() === name);
        return {
            name,
            displayName: schema?.getDisplayName() ?? name,
        };
    });
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

export function setXDataSchemas(xDatas: MixinDescriptor[]): void {
    $mixins.set(xDatas);
}

export function resetWizardContent(): void {
    $persistedContent.set(null);
    $contentType.set(null);
    $mixins.set([]);
    $displayNameDraft.set(null);
}
