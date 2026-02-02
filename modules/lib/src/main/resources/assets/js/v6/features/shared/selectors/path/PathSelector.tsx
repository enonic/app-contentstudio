import {
    Combobox,
    IconButton,
} from '@enonic/ui';
import {X} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactElement,
} from 'react';
import type {VirtuosoHandle} from 'react-virtuoso';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentTreeSelectorItem} from '../../../../../app/item/ContentTreeSelectorItem';
import {ContentSummaryOptionDataLoader} from '../../../../../app/inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {useI18n} from '../../../hooks/useI18n';
import {useTreeSelectorLayout} from '../../../hooks/useTreeSelectorLayout';
import {useTreeStore} from '../../../lib/tree-store';
import {createDebounce} from '../../../utils/timing/createDebounce';
import {ContentLabel} from '../../content/ContentLabel';
import {StatusBadge} from '../../status/StatusBadge';
import {PathSelectorTree} from './PathSelectorTree';
import {RootLabel, createRootContent, isRootContent, ROOT_ID} from './PathSelectorRoot';
import {getFilterContentPaths, getFilterExactPaths, isInvalidMoveTarget} from './pathSelectorFilters';

export type PathSelectorProps = {
    label: string;
    selectedId: string | null;
    excludedIds?: readonly string[];
    hideRoot?: boolean;
    filterItems?: readonly ContentSummaryAndCompareStatus[];
    disabled?: boolean;
    onSelectionChange: (id: string | null) => void;
    onItemChange?: (item: ContentSummaryAndCompareStatus | null) => void;
};

const PATH_SELECTOR_NAME = 'PathSelector';
const ROOT_PAGE_SIZE = 50;
const CHILD_PAGE_SIZE = 50;
const DEFAULT_DEBOUNCE_MS = 200;
const TREE_ROW_HEIGHT = 48;
const TREE_ROW_GAP = 6;
const TREE_PADDING = 8;
const TREE_MAX_HEIGHT = 400;

export const PathSelector = ({
    label,
    selectedId,
    excludedIds = [],
    hideRoot = false,
    filterItems = [],
    disabled = false,
    onSelectionChange,
    onItemChange,
}: PathSelectorProps): ReactElement => {
    const searchPlaceholder = useI18n('field.search.placeholder');
    const emptyLabel = useI18n('field.search.noItems');
    const showMoreLabel = useI18n('action.show.more');

    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ContentSummaryAndCompareStatus | null>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const loaderRef = useRef<ContentSummaryOptionDataLoader<ContentTreeSelectorItem> | null>(null);
    const rootRequestId = useRef(0);
    const searchRequestId = useRef(0);
    const childRequestIds = useRef(new Map<string, number>());
    const lastModeRef = useRef<'tree' | 'search'>('tree');
    const hasLoadedRootRef = useRef(false);
    const excludedIdSet = useMemo(() => new Set(excludedIds), [excludedIds]);

    if (!loaderRef.current) {
        loaderRef.current = ContentSummaryOptionDataLoader
            .create()
            .setFakeRoot(createRootContent())
            .build();
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

    const selectedIdStrings = selectedId ? [selectedId] : [];

    const {treeHeight} = useTreeSelectorLayout({
        flatNodes,
        activeId,
        setActiveId,
        open,
        rowHeight: TREE_ROW_HEIGHT,
        rowGap: TREE_ROW_GAP,
        padding: TREE_PADDING,
        maxHeight: TREE_MAX_HEIGHT,
    });

    const filterContentPaths = useMemo(() => getFilterContentPaths(filterItems), [filterItems]);
    const filterExactPaths = useMemo(() => getFilterExactPaths(filterContentPaths), [filterContentPaths]);

    const isInvalidTarget = useCallback((item: ContentTreeSelectorItem): boolean => {
        return isInvalidMoveTarget(item, filterContentPaths, filterExactPaths);
    }, [filterContentPaths, filterExactPaths]);

    const getChildRequestId = (id: string): number => {
        const current = childRequestIds.current.get(id) ?? 0;
        const next = current + 1;
        childRequestIds.current.set(id, next);
        return next;
    };

    const isLatestChildRequest = (id: string, requestId: number): boolean =>
        childRequestIds.current.get(id) === requestId;

    const isIdDisabled = useCallback((id: string): boolean => {
        if (excludedIdSet.has(id)) {
            return true;
        }
        if (hideRoot && id === ROOT_ID) {
            return true;
        }
        const node = getNode(id);
        return !!(node?.data && isInvalidTarget(node.data));
    }, [excludedIdSet, getNode, hideRoot, isInvalidTarget]);

    const disabledIdSet = useMemo(() => {
        const ids = new Set(excludedIdSet);
        if (hideRoot) {
            ids.add(ROOT_ID);
        }
        flatNodes.forEach((node) => {
            if (node.data && isInvalidTarget(node.data)) {
                ids.add(node.id);
            }
        });
        return ids;
    }, [excludedIdSet, flatNodes, hideRoot, isInvalidTarget]);

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

    const handleSelectionChange = useCallback((nextSelection: readonly string[]): void => {
        const nextId = nextSelection[0];
        if (!nextId) {
            setSelectedItem(null);
            onSelectionChange(null);
            onItemChange?.(null);
            return;
        }
        if (isIdDisabled(nextId)) {
            return;
        }
        const node = getNode(nextId);
        const item = node?.data?.getContent();
        if (!item) {
            setSelectedItem(null);
            onItemChange?.(null);
            return;
        }
        setSelectedItem(item);
        onSelectionChange(nextId);
        onItemChange?.(item);
    }, [getNode, isIdDisabled, onItemChange, onSelectionChange]);

    const debouncedSearch = useMemo(() => createDebounce(loadSearch, DEFAULT_DEBOUNCE_MS), [loadSearch]);

    useEffect(() => {
        if (!open) {
            setActiveId(null);
            debouncedSearch.cancel?.();
            return;
        }

        const query = inputValue.trim();
        if (query.length > 0) {
            void debouncedSearch(query);
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
        if (!selectedId) {
            setSelectedItem(null);
            onItemChange?.(null);
            return;
        }
        if (isIdDisabled(selectedId)) {
            setSelectedItem(null);
            onSelectionChange(null);
            onItemChange?.(null);
            return;
        }
        const node = getNode(selectedId);
        const item = node?.data?.getContent();
        if (item) {
            setSelectedItem(item);
            onItemChange?.(item);
        }
    }, [getNode, isIdDisabled, onItemChange, onSelectionChange, selectedId, flatNodes]);

    const hasVisibleNodes = flatNodes.some(node => !node.isLoading);
    const showEmptyState = !hasVisibleNodes && !isLoading(null);

    return (
        <div data-component={PATH_SELECTOR_NAME} className='flex flex-col gap-2.5'>
            <Combobox.Root
                open={open}
                onOpenChange={setOpen}
                value={inputValue}
                onChange={setInputValue}
                selection={selectedIdStrings}
                onSelectionChange={handleSelectionChange}
                selectionMode='single'
                contentType='tree'
                disabled={disabled}
            >
                <Combobox.Content className='relative'>
                    <Combobox.Control>
                        <Combobox.Search>
                            <Combobox.SearchIcon />
                            <Combobox.Input
                                placeholder={searchPlaceholder}
                                aria-label={label}
                            />
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>

                    <Combobox.Portal>
                        <Combobox.Popup className='overflow-y-auto rounded-sm shadow-bdr-subtle'>
                            {showEmptyState ? (
                                <div className='px-4.5 py-2 text-sm text-subtle'>{emptyLabel}</div>
                            ) : (
                                <PathSelectorTree
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
                                    disabledIdSet={disabledIdSet}
                                    virtuosoRef={virtuosoRef}
                                />
                            )}
                        </Combobox.Popup>
                    </Combobox.Portal>
                </Combobox.Content>
            </Combobox.Root>
            {selectedItem && (
                    <div className='flex items-center gap-2.5 pl-5 pr-2.5'>
                        {isRootContent(selectedItem) ? (
                            <RootLabel content={selectedItem} className='flex-1 min-w-0' />
                        ) : (
                            <ContentLabel content={selectedItem} variant='detailed' className='flex-1 min-w-0' />
                        )}
                        {!isRootContent(selectedItem) && (
                            <StatusBadge status={selectedItem.getPublishStatus()} />
                        )}
                        <IconButton
                            icon={X}
                            size='sm'
                            variant='text'
                            iconSize={18}
                            iconStrokeWidth={2}
                            onClick={() => {
                                setSelectedItem(null);
                                onSelectionChange(null);
                            }}
                            disabled={disabled}
                            aria-label='Remove'
                        />
                    </div>
            )}
        </div>
    );
};

PathSelector.displayName = PATH_SELECTOR_NAME;
