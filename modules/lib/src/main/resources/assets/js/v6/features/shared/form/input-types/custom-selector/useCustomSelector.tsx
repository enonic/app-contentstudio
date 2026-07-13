import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Branch } from '../../../../../../app/versioning/Branch';
import { UrlAction } from '../../../../../../app/UrlAction';
import { $contextContent } from '../../../../../widgets/context-panel/model/contextContent.store';
import { $activeProject } from '../../../../../entities/project';
import { type CustomSelectorConfig } from './CustomSelectorConfig';
import { type CustomSelectorItem } from './CustomSelectorInput';
import { useDebouncedCallback } from '../../../../../shared/lib/hooks/useDebouncedCallback';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { type SelfManagedComponentProps } from '@enonic/lib-admin-ui/form2';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { formatError } from '../../../../../shared/lib/format/error';
import { parseNumber } from '../../../../../shared/lib/format/values';
import { $config } from '../../../../../shared/config/config.store';
import { joinPath } from '../../../../../shared/lib/url/cms';

const PRELOAD_KEY = 'CUSTOM_SELECTOR_PRELOAD_KEY';
const DEFAULT_SIZE = 10;
const DEFAULT_DEBOUNCE = 300;

type RequestParams = {
    ids?: string;
    query?: string;
    start?: number;
    count?: number;
};

type ServiceResponse = {
    total: number;
    count: number;
    hits: CustomSelectorItem[];
};

type useCustomSelectorOptions = {
    /** The config of the custom selector input type */
    config: CustomSelectorConfig;
    /** The ids of the initial selected items */
    selection: string[];
    /** The query to search for */
    query: string;
    /** How many items is expected to be returned by the service */
    count?: number;
    /** The callback to add a new item */
    onAdd: SelfManagedComponentProps['onAdd'];
    /** The callback to remove an item */
    onRemove: SelfManagedComponentProps['onRemove'];
};

export const useCustomSelector = ({
    config,
    selection,
    query,
    count = DEFAULT_SIZE,
    onAdd,
    onRemove,
}: useCustomSelectorOptions) => {
    // States
    const [itemsMap, setItemsMap] = useState<Map<string, CustomSelectorItem[]>>(new Map());
    const [startMap, setStartMap] = useState<Map<string, number>>(new Map());
    const [totalMap, setTotalMap] = useState<Map<string, number>>(new Map());
    const [loadingCount, setLoadingCount] = useState(0);
    const [hasError, setHasError] = useState<boolean>(false);
    const isLoading = loadingCount > 0;

    // Memoized values
    const key = useMemo(() => query || '', [query]);
    const allItems = useMemo(() => Array.from(itemsMap.values()).flat().filter(uniqueItemsFilter), [itemsMap]);
    const allItemsWithoutPreload = useMemo(
        () =>
            Array.from(itemsMap.entries())
                .filter(([key, _]) => key !== PRELOAD_KEY)
                .map(([_, items]) => items)
                .flat()
                .filter(uniqueItemsFilter),
        [itemsMap],
    );
    const filteredItems = useMemo(
        () => (key ? (itemsMap.get(key) ?? []) : allItemsWithoutPreload),
        [key, itemsMap, allItemsWithoutPreload],
    );
    const hasMore = useMemo(() => {
        const total = totalMap.get(key);
        if (total === undefined) return true;
        return filteredItems.length < total;
    }, [key, totalMap, filteredItems.length]);

    // Refs
    const contentIdRef = useRef<string>();
    const projectIdRef = useRef<string>();

    // Get the context content and active project on mount.
    useEffect(() => {
        contentIdRef.current = $contextContent.get()?.getId();
        projectIdRef.current = $activeProject.get()?.getName();
    }, []);

    const fetchItems = useCallback(
        async (requestUrl: string) => {
            return ResultAsync.fromPromise(fetch(requestUrl), formatError)
                .andThen((response) => {
                    if (!response.ok) {
                        return errAsync(
                            new Error(
                                `Error fetching ${config.extension ? config.extension + ' extension' : config.service + ' service'} items.`,
                            ),
                        );
                    }

                    return ResultAsync.fromPromise(response.json(), formatError);
                })
                .andThen((data: unknown) => {
                    const isHitsValid = Array.isArray(data?.['hits']);
                    const isCountValid = parseNumber(data?.['count']) !== undefined;
                    const isTotalValid = parseNumber(data?.['total']) !== undefined;

                    if (!isHitsValid || !isTotalValid || !isCountValid) {
                        return errAsync(
                            new Error(
                                `Invalid ${config.extension ? config.extension + ' extension' : config.service + ' service'} response.`,
                            ),
                        );
                    }

                    return okAsync(data as ServiceResponse);
                })
                .mapErr((error) => {
                    return error;
                });
        },
        [config],
    );

    const processResponse = useCallback(
        (data: ServiceResponse | undefined, customKey?: string): void => {
            if (!data) return;

            const resolvedTotal = data?.total || 0;
            const resolvedCount = data?.count || 0;
            const resolvedHits = data?.hits || [];
            const resolvedKey = customKey || key;

            setStartMap((prev) => new Map(prev).set(resolvedKey, (prev.get(resolvedKey) || 0) + resolvedCount));
            setTotalMap((prev) => new Map(prev).set(resolvedKey, resolvedTotal));
            setItemsMap((prev) => {
                const existing = prev.get(resolvedKey) || [];
                return new Map(prev).set(
                    resolvedKey,
                    [...existing, ...resolvedHits.map(hitToItem)].filter(uniqueItemsFilter),
                );
            });
        },
        [key],
    );

    // Used to load the items that are already selected
    const preLoad = useCallback(async () => {
        if (
            !projectIdRef.current ||
            !contentIdRef.current ||
            (!config.extension && !config.service) ||
            !selection ||
            selection?.length === 0
        ) {
            return;
        }

        const requestUrl = buildRequestUrl({
            extension: config.extension,
            service: config.service,
            configParams: config.params,
            projectId: projectIdRef.current,
            contentId: contentIdRef.current,
            requestParams: {
                ids: selection.join(','),
            },
        });

        if (!requestUrl) return;

        setLoadingCount((c) => c + 1);

        (await fetchItems(requestUrl)).match(
            (data) => {
                processResponse(data, PRELOAD_KEY);
                setLoadingCount((c) => c - 1);
                setHasError(false);
            },
            (error) => {
                console.error(error.message);
                setLoadingCount((c) => c - 1);
                setHasError(true);
            },
        );
    }, [selection, config, query, key, startMap, count, fetchItems, processResponse]);

    // Used to load more items
    const load = useCallback(async () => {
        if (!projectIdRef.current || !contentIdRef.current || (!config.extension && !config.service)) return;

        const requestUrl = buildRequestUrl({
            extension: config.extension,
            service: config.service,
            configParams: config.params,
            projectId: projectIdRef.current,
            contentId: contentIdRef.current,
            requestParams: {
                query: query || null,
                start: startMap.get(key) || 0,
                count: count || null,
            },
        });

        if (!requestUrl) return;

        setLoadingCount((c) => c + 1);

        (await fetchItems(requestUrl)).match(
            (data) => {
                processResponse(data);
                setLoadingCount((c) => c - 1);
                setHasError(false);
            },
            (error) => {
                console.error(error.message);
                setLoadingCount((c) => c - 1);
                setHasError(true);
            },
        );
    }, [config, query, key, startMap, count, fetchItems, processResponse]);

    const loadRef = useRef(load);
    loadRef.current = load;

    const debouncedLoad = useDebouncedCallback(() => {
        void loadRef.current();
    }, DEFAULT_DEBOUNCE);

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
                    onAdd(ValueTypes.STRING.newValue(id.toString()));
                }
            }
        },
        [selection, onAdd, onRemove],
    );

    return { allItems, filteredItems, isLoading, hasError, hasMore, preLoad, load: debouncedLoad, onSelectionChange };
};

//
// * Utilities
//

const DEFAULT_APP_ID = 'com.enonic.app.contentstudio';

type UrlParams = Record<string, string | number | null | undefined>;

/**
 * Append query params to a URL, skipping null/undefined values and choosing the
 * separator (`?` or `&`) based on whether the URL already carries a query string.
 */
function appendUrlParams(url: string, params: UrlParams): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value != null) {
            search.append(key, String(value));
        }
    }

    const query = search.toString();
    if (!query) return url;

    return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

/**
 * Build the site service prefix:
 * `<adminUrl>/<appId>/site/edit/<project>/draft/<content>/_/service`.
 */
function getServiceBaseUrl(projectId: string, contentId: string): string {
    const appId = $config.get().appId || DEFAULT_APP_ID;
    return joinPath(
        '/',
        $config.get().adminUrl,
        `${appId}/site/${UrlAction.EDIT}/${projectId}/${Branch.DRAFT}/${contentId}/_/service`,
    );
}

type BuildRequestUrlProps = {
    extension?: string;
    service?: string;
    projectId: string;
    contentId: string;
    configParams: CustomSelectorConfig['params'];
    requestParams: RequestParams;
};

function buildRequestUrl({
    extension,
    service,
    configParams,
    projectId,
    contentId,
    requestParams,
}: BuildRequestUrlProps): string {
    const params = (configParams ?? []).reduce<Record<string, string>>(
        (acc, { label, value }) => ({ ...acc, [label]: value }),
        {},
    );
    let url = '';
    if (extension) {
        const extensionBaseUrl = $config.get().extensionApiUrl.replace(/\/+$/, '');
        const extensionPrefix = `${extensionBaseUrl}/${extension}/`;
        url = appendUrlParams(extensionPrefix, params);
    } else if (service) {
        const servicePrefix = getServiceBaseUrl(projectId, contentId);
        url = `${servicePrefix}/${appendUrlParams(service, params)}`;
    } else {
        return '';
    }
    return appendUrlParams(url, requestParams);
}

function hitToItem(hit: CustomSelectorItem): CustomSelectorItem {
    return {
        id: hit?.id?.toString(),
        displayName: hit?.displayName?.toString(),
        description: hit?.description?.toString(),
        iconUrl: hit?.iconUrl?.toString(),
        icon: hit?.icon,
    };
}

function uniqueItemsFilter(value: CustomSelectorItem, index: number, array: CustomSelectorItem[]): boolean {
    return value && value.id != null && array.findIndex((i) => i && i.id === value.id) === index;
}
