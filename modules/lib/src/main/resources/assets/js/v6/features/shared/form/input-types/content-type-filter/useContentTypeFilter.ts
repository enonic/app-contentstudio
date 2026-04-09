import {type SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {useStore} from '@nanostores/preact';
import {okAsync, ResultAsync} from 'neverthrow';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {Site} from '../../../../../../app/content/Site';
import {GetAllContentTypesRequest} from '../../../../../../app/resource/GetAllContentTypesRequest';
import {GetContentTypesByContentRequest} from '../../../../../../app/resource/GetContentTypesByContentRequest';
import {GetNearestSiteRequest} from '../../../../../../app/resource/GetNearestSiteRequest';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {$activeProject} from '../../../../store/projects.store';
import {$contentType} from '../../../../store/wizardContent.store';
import {formatError} from '../../../../utils/format/error';
import type {ContentTypeFilterConfig} from './ContentTypeFilterConfig';

const TYPES_ALLOWED_EVERYWHERE = new Set([
    String(ContentTypeName.UNSTRUCTURED),
    String(ContentTypeName.FOLDER),
    String(ContentTypeName.SITE),
]);

type UseContentTypeFilterOptions = {
    config: ContentTypeFilterConfig;
    selection: string[];
    query: string | undefined;
    onAdd: SelfManagedComponentProps['onAdd'];
    onRemove: SelfManagedComponentProps['onRemove'];
};

export const useContentTypeFilter = ({config, selection, query, onAdd, onRemove}: UseContentTypeFilterOptions) => {
    const [allContentTypes, setAllContentTypes] = useState<ContentTypeSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Stores
    const contextContent = useStore($contextContent);
    const contentType = useStore($contentType);
    const project = useStore($activeProject);

    // Memoized values
    const filteredContentTypes = useMemo(
        () => allContentTypes.filter((ct) => matchesSearch(ct, (query ?? '').trim())),
        [allContentTypes, query]
    );

    const fetchContentTypes = useCallback(async () => {
        const contentId = contextContent?.getContentId();
        const isPageTemplate = contentType?.getContentTypeName()?.isPageTemplate();

        if (!contentId || !project) return okAsync<ContentTypeSummary[], Error>([]);

        const allContentTypes = () => ResultAsync.fromPromise(new GetAllContentTypesRequest().sendAndParse(), formatError);
        const site = () =>
            ResultAsync.fromPromise(new GetNearestSiteRequest(contentId).setRequestProject(project).sendAndParse(), formatError);
        const contentTypesByContent = () =>
            ResultAsync.fromPromise(new GetContentTypesByContentRequest(contentId).setRequestProject(project).sendAndParse(), formatError);

        if (isPageTemplate) {
            return ResultAsync.combine([allContentTypes(), site()])
                .map(([types, site]) => (site ? filterForPageTemplate(types, site) : types).sort(sortByDisplayName))
                .mapErr((error) => new Error(`Error fetching content types for page template. ${error.message}`));
        }

        if (config.context) {
            return contentTypesByContent()
                .map((types) => types.sort(sortByDisplayName))
                .mapErr((error) => new Error(`Error fetching content types of content. ${error.message}`));
        }

        return allContentTypes()
            .map((types) => types.sort(sortByDisplayName))
            .mapErr((error) => new Error(`Error fetching all content types. ${error.message}`));
    }, [config, contextContent, contentType, project]);

    // Fetch content types on mount.
    useEffect(() => {
        (async () => {
            setIsLoading(true);

            (await fetchContentTypes()).match(
                (types) => {
                    setAllContentTypes(types);
                    setIsLoading(false);
                    setHasError(false);
                },
                (error) => {
                    console.error(`Error fetching content types.`, error.message);
                    setAllContentTypes([]);
                    setIsLoading(false);
                    setHasError(true);
                }
            );
        })();
    }, [fetchContentTypes]);

    // Handler for the combobox root. Manages adding and removing items.
    const onSelectionChange = useCallback(
        (newSelection: readonly string[]) => {
            const currentIds = new Set(selection);
            const newIds = new Set(newSelection);

            for (let i = selection.length - 1; i >= 0; i--) {
                if (!newIds.has(selection[i])) {
                    onRemove(i);
                }
            }

            for (const id of newSelection) {
                if (!currentIds.has(id)) {
                    onAdd(ValueTypes.STRING.newValue(id));
                }
            }
        },
        [selection, onAdd, onRemove]
    );

    return {allContentTypes, filteredContentTypes, isLoading, hasError, onSelectionChange};
};

//
// * Helpers
//
function filterForPageTemplate(contentTypes: ContentTypeSummary[], site: Site): ContentTypeSummary[] {
    const siteAppKeys = new Set(site.getApplicationKeys().map((key) => key.toString()));

    return contentTypes.filter((item) => {
        if (item.isAbstract()) return false;
        const name = item.getContentTypeName();
        if (name.isDescendantOfMedia()) return true;
        if (TYPES_ALLOWED_EVERYWHERE.has(name.toString())) return true;
        if (siteAppKeys.has(name.getApplicationKey().toString())) return true;
        return false;
    });
}

function sortByDisplayName(a: ContentTypeSummary, b: ContentTypeSummary): number {
    return a.getTitle().localeCompare(b.getTitle());
}

function matchesSearch(contentType: ContentTypeSummary, search: string): boolean {
    if (!search) return true;

    return (
        contentType.getTitle().toLowerCase().includes(search.toLowerCase()) ||
        contentType.getContentTypeName().toString().toLowerCase().includes(search.toLowerCase())
    );
}
