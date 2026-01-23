import {Combobox} from '@enonic/ui';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {useCallback, useEffect, useMemo, useRef, useState, type ReactElement} from 'react';
import type {VirtuosoHandle} from 'react-virtuoso';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentId} from '../../../../../app/content/ContentId';
import {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';
import {ContentSummaryOptionDataLoader} from '../../../../../app/inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {useI18n} from '../../../hooks/useI18n';
import {useTreeStore} from '../../../lib/tree-store';
import {createDebounce} from '../../../utils/timing/createDebounce';
import {IssueItemsTree} from './IssueItemsTree';

export type IssueItemsSelectorProps = {
    label: string;
    selectedIds: ContentId[];
    disabled?: boolean;
    onItemsAdded: (items: ContentSummaryAndCompareStatus[]) => void;
    onItemsRemoved: (ids: ContentId[]) => void;
};

const ISSUE_ITEMS_SELECTOR_NAME = 'IssueItemsSelector';
const ROOT_PAGE_SIZE = 50;
const CHILD_PAGE_SIZE = 50;
const DEFAULT_DEBOUNCE_MS = 200;
const TREE_ROW_HEIGHT = 32;
const TREE_ROW_GAP = 6;
const TREE_PADDING = 8;
const TREE_MAX_HEIGHT = 400;

export const IssueItemsSelector = ({
                                       selectedIds,
                                       label,
                                       disabled = false,
                                       onItemsAdded,
                                       onItemsRemoved,
                                   }: IssueItemsSelectorProps): ReactElement => {
    const searchPlaceholder = useI18n('field.search.placeholder');
    const applyLabel = useI18n('action.apply');
    const emptyLabel = useI18n('dialog.issue.noItems');
    const showMoreLabel = useI18n('action.show.more');

    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const loaderRef = useRef<ContentSummaryOptionDataLoader<ContentTreeSelectorItem> | null>(null);
    const rootRequestId = useRef(0);
    const searchRequestId = useRef(0);
    const childRequestIds = useRef(new Map<string, number>());
    const lastModeRef = useRef<'tree' | 'search'>('tree');
    const hasLoadedRootRef = useRef(false);

    if (!loaderRef.current) {
        loaderRef.current = ContentSummaryOptionDataLoader.create().build();
    }

    const {
        flatNodes,
        clear,
        setNodes,
        setRootIds,
        setChildren,
        appendChildren,
        setNode,
        expand,
        collapse,
        setLoading,
        isLoading,
        getNode,
        hasMoreChildren,
        needsChildrenLoad,
    } = useTreeStore<ContentTreeSelectorItem>();

    const selectedIdStrings = useMemo(
        () => selectedIds.map(id => id.toString()),
        [selectedIds],
    );

    const treeHeight = useMemo(() => {
        const count = flatNodes.length;
        if (count === 0) {
            return TREE_ROW_HEIGHT + TREE_PADDING;
        }
        const contentHeight = count * TREE_ROW_HEIGHT + Math.max(count - 1, 0) * TREE_ROW_GAP + TREE_PADDING;
        return Math.min(contentHeight, TREE_MAX_HEIGHT);
    }, [flatNodes.length]);

    const getChildRequestId = (id: string): number => {
        const current = childRequestIds.current.get(id) ?? 0;
        const next = current + 1;
        childRequestIds.current.set(id, next);
        return next;
    };

    const isLatestChildRequest = (id: string, requestId: number): boolean =>
        childRequestIds.current.get(id) === requestId;

    const loadRoot = useCallback(async (): Promise<void> => {
        const loader = loaderRef.current;
        if (!loader) {
            return;
        }

        const requestId = ++rootRequestId.current;
        hasLoadedRootRef.current = true;
        lastModeRef.current = 'tree';
        clear();
        setLoading(null, true);

        try {
            const data = await loader.fetchChildren(null, 0, ROOT_PAGE_SIZE);
            if (requestId !== rootRequestId.current) {
                return;
            }

            const items = data.getData();
            setNodes(items.map(item => ({
                id: item.getId(),
                data: item,
                parentId: null,
                hasChildren: item.hasChildren() === true,
            })));
            setRootIds(items.map(item => item.getId()));
        } catch (error) {
            console.error(error);
        } finally {
            if (requestId === rootRequestId.current) {
                setLoading(null, false);
            }
        }
    }, [clear, setLoading, setNodes, setRootIds]);

    const loadSearch = useCallback(async (query: string): Promise<void> => {
        const loader = loaderRef.current;
        if (!loader) {
            return;
        }

        const requestId = ++searchRequestId.current;
        lastModeRef.current = 'search';
        clear();
        setLoading(null, true);

        try {
            const items = await loader.search(query);
            if (requestId !== searchRequestId.current) {
                return;
            }

            setNodes(items.map(item => ({
                id: item.getId(),
                data: item,
                parentId: null,
                hasChildren: false,
            })));
            setRootIds(items.map(item => item.getId()));
        } catch (error) {
            console.error(error);
        } finally {
            if (requestId === searchRequestId.current) {
                setLoading(null, false);
            }
        }
    }, [clear, setLoading, setNodes, setRootIds]);

    const loadChildren = useCallback(async (parentId: string): Promise<void> => {
        const loader = loaderRef.current;
        if (!loader) {
            return;
        }

        const parentNode = getNode(parentId);
        const parentItem = parentNode?.data;
        if (!parentItem) {
            return;
        }

        const requestId = getChildRequestId(parentId);
        setLoading(parentId, true);

        try {
            const from = parentNode?.childIds.length ?? 0;
            const parentOption = Option.create<ContentTreeSelectorItem>()
                .setValue(parentItem.getId())
                .setDisplayValue(parentItem)
                .build();
            const data = await loader.fetchChildren(parentOption, from, CHILD_PAGE_SIZE);
            if (!isLatestChildRequest(parentId, requestId)) {
                return;
            }

            const items = data.getData();
            const ids = items.map(item => item.getId());
            setNodes(items.map(item => ({
                id: item.getId(),
                data: item,
                parentId,
                hasChildren: item.hasChildren() === true,
            })));

            if (from === 0) {
                setChildren(parentId, ids);
            } else {
                appendChildren(parentId, ids);
            }

            setNode({id: parentId, totalChildren: data.getTotalHits()});
        } catch (error) {
            console.error(error);
        } finally {
            if (isLatestChildRequest(parentId, requestId)) {
                setLoading(parentId, false);
            }
        }
    }, [appendChildren, getNode, setChildren, setLoading, setNode, setNodes]);

    const handleExpand = useCallback((id: string): void => {
        expand(id);
        if (needsChildrenLoad(id) || hasMoreChildren(id)) {
            void loadChildren(id);
        }
    }, [expand, hasMoreChildren, loadChildren, needsChildrenLoad]);

    const handleCollapse = useCallback((id: string): void => {
        collapse(id);
    }, [collapse]);

    const handleSelectionApply = useCallback((nextSelection: readonly string[]): void => {
        const prevSet = new Set(selectedIdStrings);
        const nextSet = new Set(nextSelection);

        const addedIds = nextSelection.filter(id => !prevSet.has(id));
        const removedIds = selectedIdStrings.filter(id => !nextSet.has(id));

        if (addedIds.length > 0) {
            const addedItems = addedIds
                .map(id => getNode(id)?.data?.getContent())
                .filter((item): item is ContentSummaryAndCompareStatus => !!item);

            if (addedItems.length > 0) {
                onItemsAdded(addedItems);
            }
        }

        if (removedIds.length > 0) {
            onItemsRemoved(removedIds.map(id => new ContentId(id)));
        }
    }, [getNode, onItemsAdded, onItemsRemoved, selectedIdStrings]);

    const debouncedSearch = useMemo(() => {
        return createDebounce((query: string) => {
            void loadSearch(query);
        }, DEFAULT_DEBOUNCE_MS);
    }, [loadSearch]);

    useEffect(() => {
        if (!open) {
            setInputValue('');
            setActiveId(null);
            debouncedSearch.cancel?.();
            return;
        }

        const query = inputValue.trim();
        if (query.length > 0) {
            debouncedSearch(query);
            return;
        }

        debouncedSearch.cancel?.();
        if (!hasLoadedRootRef.current || lastModeRef.current === 'search') {
            void loadRoot();
        }
    }, [debouncedSearch, inputValue, loadRoot, open]);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel?.();
        };
    }, [debouncedSearch]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const activeExists = activeId && flatNodes.some(node => node.id === activeId);
        if (activeExists) {
            return;
        }

        const firstNode = flatNodes.find(node => !node.isLoading && node.data);
        setActiveId(firstNode?.id ?? null);
    }, [activeId, flatNodes, open]);

    const hasVisibleNodes = flatNodes.some(node => !node.isLoading);
    const showEmptyState = !hasVisibleNodes && !isLoading(null);

    return (
        <div data-component={ISSUE_ITEMS_SELECTOR_NAME} className='flex flex-col gap-2.5'>
            <Combobox.Root
                open={open}
                onOpenChange={setOpen}
                value={inputValue}
                onChange={setInputValue}
                selection={selectedIdStrings}
                onSelectionChange={handleSelectionApply}
                selectionMode='staged'
                contentType='tree'
                disabled={disabled}
            >
                <Combobox.Content className='relative'>
                    <Combobox.Control>
                        <Combobox.Search>
                            <Combobox.SearchIcon/>
                            <Combobox.Input
                                placeholder={searchPlaceholder}
                                aria-label={label}
                            />
                            <Combobox.Apply label={applyLabel}/>
                            <Combobox.Toggle/>
                        </Combobox.Search>
                    </Combobox.Control>

                    <Combobox.Portal>
                        <Combobox.Popup className='overflow-y-auto rounded-sm shadow-bdr-subtle'>
                            {showEmptyState ? (
                                <div className='px-4.5 py-2 text-sm text-subtle'>{emptyLabel}</div>
                            ) : (
                                 <IssueItemsTree
                                     items={flatNodes}
                                     activeId={activeId}
                                     onActiveChange={setActiveId}
                                     onExpand={handleExpand}
                                     onCollapse={handleCollapse}
                                     onLoadMore={(id) => {
                                         void loadChildren(id);
                                     }}
                                     treeHeight={treeHeight}
                                     hasMoreChildren={hasMoreChildren}
                                     isLoading={isLoading}
                                     showMoreLabel={showMoreLabel}
                                     label={label}
                                     disabled={disabled}
                                     virtuosoRef={virtuosoRef}
                                 />
                             )}
                        </Combobox.Popup>
                    </Combobox.Portal>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

IssueItemsSelector.displayName = ISSUE_ITEMS_SELECTOR_NAME;
