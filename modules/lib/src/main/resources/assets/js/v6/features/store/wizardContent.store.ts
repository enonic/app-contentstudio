import {atom, computed} from 'nanostores';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import type {Content} from '../../../app/content/Content';
import type {ContentType} from '../../../app/inputtype/schema/ContentType';
import type {ExtraData} from '../../../app/content/ExtraData';
import type {Page} from '../../../app/page/Page';
import type {XData} from '../../../app/content/XData';

//
// * Store
//

export const $persistedContent = atom<Content | null>(null);

export const $contentType = atom<ContentType | null>(null);

export const $xDataSchemas = atom<XData[]>([]);

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

export const $persistedXData = computed($persistedContent, (content): ExtraData[] => content?.getAllExtraData() ?? []);

export const $contentTypeDisplayName = computed($contentType, (contentType) => contentType?.getDisplayName() ?? '');

export type XDataTabInfo = {
    name: string;
    displayName: string;
};

export const $xDataTabs = computed([$persistedXData, $xDataSchemas], (extraData, schemas): XDataTabInfo[] => {
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

export function setXDataSchemas(xDatas: XData[]): void {
    $xDataSchemas.set(xDatas);
}

export function resetWizardContent(): void {
    $persistedContent.set(null);
    $contentType.set(null);
    $xDataSchemas.set([]);
    $displayNameDraft.set(null);
}
