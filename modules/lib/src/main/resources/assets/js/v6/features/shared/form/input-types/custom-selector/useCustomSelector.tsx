import {UriHelper as LibUriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Branch} from '../../../../../../app/versioning/Branch';
import {UrlAction} from '../../../../../../app/UrlAction';
import {UriHelper} from '../../../../../../app/rendering/UriHelper';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {$activeProject} from '../../../../store/projects.store';
import {type CustomSelectorConfig} from './CustomSelectorConfig';
import {type CustomSelectorItem} from './CustomSelectorInput';
import {useDebouncedCallback} from '../../../../utils/hooks/useDebouncedCallback';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {type SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {errAsync, okAsync, ResultAsync} from 'neverthrow';
import {formatError} from '../../../../utils/format/error';
import {parseNumber} from '../../../../utils/format/values';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

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

export const useCustomSelector = ({config, selection, query, count = DEFAULT_SIZE, onAdd, onRemove}: useCustomSelectorOptions) => {
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
        [itemsMap]
    );
    const filteredItems = useMemo(
        () => (key ? (itemsMap.get(key) ?? []) : allItemsWithoutPreload),
        [key, itemsMap, allItemsWithoutPreload]
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
                        return errAsync(new Error(
                            `Error fetching ${config.extension ? config.extension + ' extension' : config.service + ' service'} items.`));
                    }

                    return ResultAsync.fromPromise(response.json(), formatError);
                })
                .andThen((data: unknown) => {
                    const isHitsValid = Array.isArray(data?.['hits']);
                    const isCountValid = parseNumber(data?.['count']) !== undefined;
                    const isTotalValid = parseNumber(data?.['total']) !== undefined;

                    if (!isHitsValid || !isTotalValid || !isCountValid) {
                        return errAsync(new Error(
                            `Invalid ${config.extension ? config.extension + ' extension' : config.service + ' service'} response.`));
                    }

                    return okAsync(data as ServiceResponse);
                })
                .mapErr((error) => {
                    return error;
                });
        },
        [config]
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
                return new Map(prev).set(resolvedKey, [...existing, ...resolvedHits.map(hitToItem)].filter(uniqueItemsFilter));
            });
        },
        [key]
    );

    // Used to load the items that are already selected
    const preLoad = useCallback(async () => {
        if (!projectIdRef.current || !contentIdRef.current || (!config.extension && !config.service) || !selection || selection?.length ===
            0) {
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
            }
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
            }
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
        [selection, onAdd, onRemove]
    );

    return {allItems, filteredItems, isLoading, hasError, hasMore, preLoad, load: debouncedLoad, onSelectionChange};
};

//
// * Utilities
//

type BuildRequestUrlProps = {
    extension?: string;
    service?: string;
    projectId: string;
    contentId: string;
    configParams: CustomSelectorConfig['params'];
    requestParams: RequestParams;
};

function buildRequestUrl({extension, service, configParams, projectId, contentId, requestParams}: BuildRequestUrlProps): string {
    const params = (configParams ?? []).reduce<Record<string, string>>((acc, {label, value}) => ({...acc, [label]: value}), {});
    let url = '';
    if (extension) {
        const extensionBaseUrl = (CONFIG.getString('extensionApiUrl') || '').replace(/\/+$/, '');
        const extensionPrefix = `${extensionBaseUrl}/${extension}/`;
        url = LibUriHelper.appendUrlParams(extensionPrefix, params);
    } else if (service) {
        const servicePrefix = UriHelper.addSitePrefix(`/${UrlAction.EDIT}/${projectId}/${Branch.DRAFT}/${contentId}/_/service`);
        url = `${servicePrefix}/${LibUriHelper.appendUrlParams(service, params)}`;
    } else {
        return '';
    }
    return LibUriHelper.appendUrlParams(url, requestParams);
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
