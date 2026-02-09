import {cn, VirtualizedTreeList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Folder, FolderOpen} from 'lucide-react';
import {ReactElement, useCallback, useMemo, useRef} from 'react';
import type {ListRange, VirtuosoHandle} from 'react-virtuoso';
import {Virtuoso} from 'react-virtuoso';
import {EditSettingsItemEvent} from '../../../../../app/settings/event/EditSettingsItemEvent';
import {SettingsDataViewItem} from '../../../../../app/settings/view/SettingsDataViewItem';
import {SettingsViewItem} from '../../../../../app/settings/view/SettingsViewItem';
import {ProjectHelper} from '../../../../../app/settings/data/project/ProjectHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectLabel} from '../../../shared/project/ProjectLabel';
import {ItemLabel} from '../../../shared/ItemLabel';
import {useI18n} from '../../../hooks/useI18n';
import type {FlatNode} from '../../../lib/tree-store';
import {$settingsFlatNodes, collapseSettingsNode, expandSettingsNode} from '../../../store/settings-tree.store';
import {$activeId, $selection, clearSelection, setActive, setSelection} from '../../../store/settingsTreeSelection.store';
import {SettingsTreeContextMenu, type SettingsTreeContextMenuProps} from './SettingsTreeContextMenu';

type SettingsFlatNode = FlatNode<SettingsViewItem>;

export type SettingsTreeListProps = {
    contextMenuActions?: SettingsTreeContextMenuProps['actions'];
};

const SETTINGS_TREE_LIST_NAME = 'SettingsTreeList';

const isSettingsDataItem = (item: SettingsViewItem): item is SettingsDataViewItem<any> =>
    ObjectHelper.iFrameSafeInstanceOf(item, SettingsDataViewItem);

export const SettingsTreeList = ({contextMenuActions = []}: SettingsTreeListProps): ReactElement => {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const suppressNextClickForIdRef = useRef<string | null>(null);
    const flatNodes = useStore($settingsFlatNodes);
    const selection = useStore($selection);
    const activeId = useStore($activeId);
    const noDescription = useI18n('text.noDescription');

    const handleExpand = useCallback((id: string) => {
        expandSettingsNode(id);
    }, []);

    const handleCollapse = useCallback((id: string) => {
        collapseSettingsNode(id);
    }, []);

    const handleActivate = useCallback((id: string) => {
        const node = flatNodes.find((n) => n.id === id);
        if (!node?.data) return;

        if (ObjectHelper.iFrameSafeInstanceOf(node.data, SettingsDataViewItem)) {
            new EditSettingsItemEvent([node.data]).fire();
        }
    }, [flatNodes]);

    const handleSelectionChange = useCallback((newSelection: ReadonlySet<string>) => {
        setSelection(newSelection);
    }, []);

    const visibleIds = useMemo(
        () => new Set(flatNodes.filter((n) => n.nodeType === 'node').map((n) => n.id)),
        [flatNodes]
    );

    const visibleSelection = useMemo(
        () => new Set([...selection].filter((id) => visibleIds.has(id))),
        [selection, visibleIds]
    );

    const handleRangeChange = useCallback((_range: ListRange) => {
        // no-op for now
    }, []);

    return (
        <VirtualizedTreeList
            data-component={SETTINGS_TREE_LIST_NAME}
            items={flatNodes}
            selection={visibleSelection}
            onSelectionChange={handleSelectionChange}
            selectionMode="multiple"
            active={activeId}
            onActiveChange={setActive}
            onExpand={handleExpand}
            onCollapse={handleCollapse}
            onActivate={handleActivate}
            clearActiveOnReclick={true}
            virtuosoRef={virtuosoRef}
            aria-label="Settings tree"
            className="w-full flex-1 min-h-0 settings-tree-list"
        >
            {({items, getItemProps, containerProps}) => {
                const {className: containerClassName, ...restContainerProps} = containerProps;
                return (
                    <SettingsTreeContextMenu actions={contextMenuActions}>
                        <Virtuoso<SettingsFlatNode>
                            ref={virtuosoRef}
                            data={items as SettingsFlatNode[]}
                            className={cn('h-full px-5 py-2.5 bg-surface-neutral', containerClassName)}
                            rangeChanged={handleRangeChange}
                            {...restContainerProps}
                            itemContent={(index, node) => {
                                const {id, level, isExpanded, hasChildren, nodeType, data} = node;

                                if (nodeType === 'loading' || data === null) {
                                    return (
                                        <VirtualizedTreeList.RowLoading level={level} className="min-h-12" />
                                    );
                                }

                                const itemProps = getItemProps(index, node);
                                const isSelected = selection.has(id);

                                const secondaryText = data.getDescription() || `<${noDescription}>`;
                                const isUnavailable = isSettingsDataItem(data)
                                    ? !ProjectHelper.isAvailable(data.getData())
                                    : false;

                                return (
                                    <VirtualizedTreeList.Row
                                        {...itemProps}
                                        active={itemProps.active}
                                        selected={isSelected}
                                        data-tone={isSelected ? 'inverse' : undefined}
                                        onContextMenu={(event) => {
                                            event.preventDefault();
                                            suppressNextClickForIdRef.current = id;
                                            if (selection.size > 0) {
                                                if (selection.has(id)) {
                                                    if (selection.size > 1) {
                                                        setSelection(new Set([id]));
                                                    }
                                                } else {
                                                    clearSelection();
                                                }
                                            }
                                            if (activeId !== id) {
                                                setActive(id);
                                            }
                                        }}
                                        onClick={(e) => {
                                            // Some platforms emit a click after opening context menu.
                                            if (suppressNextClickForIdRef.current === id) {
                                                suppressNextClickForIdRef.current = null;
                                                return;
                                            }

                                            // Ignore non-primary clicks and ctrl+click context-menu gestures.
                                            if (e.button !== 0 || e.ctrlKey) {
                                                return;
                                            }

                                            const tree = e.currentTarget.closest<HTMLElement>('[role="tree"]');
                                            tree?.focus();

                                            if (selection.size > 0) {
                                                clearSelection();
                                                setActive(id);
                                            } else if (activeId === id) {
                                                setActive(null);
                                            } else {
                                                setActive(id);
                                            }
                                        }}
                                    >
                                        <VirtualizedTreeList.RowLeft>
                                            <VirtualizedTreeList.RowSelectionControl
                                                rowId={id}
                                                selected={itemProps.selected}
                                            />
                                            <VirtualizedTreeList.RowLevelSpacer level={level} />
                                            <VirtualizedTreeList.RowExpandControl
                                                rowId={id}
                                                expanded={isExpanded}
                                                hasChildren={hasChildren}
                                                onToggle={() => (isExpanded ? handleCollapse(id) : handleExpand(id))}
                                                selected={isSelected}
                                            />
                                        </VirtualizedTreeList.RowLeft>
                                        <VirtualizedTreeList.RowContent>
                                            {isSettingsDataItem(data) ? (
                                                <ProjectLabel
                                                    project={data.getData()}
                                                    className={isUnavailable ? 'opacity-50' : undefined}
                                                />
                                            ) : (
                                                <ItemLabel
                                                    icon={
                                                        isExpanded ? (
                                                            <FolderOpen size={20} />
                                                        ) : (
                                                            <Folder size={20} />
                                                        )
                                                    }
                                                    primary={data.getDisplayName()}
                                                    secondary={secondaryText}
                                                />
                                            )}
                                        </VirtualizedTreeList.RowContent>
                                    </VirtualizedTreeList.Row>
                                );
                            }}
                        />
                    </SettingsTreeContextMenu>
                );
            }}
        </VirtualizedTreeList>
    );
};

SettingsTreeList.displayName = SETTINGS_TREE_LIST_NAME;
