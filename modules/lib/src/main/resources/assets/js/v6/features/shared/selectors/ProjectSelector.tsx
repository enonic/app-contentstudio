import {cn, Combobox, ComboboxRootProps, FlatNode, useCombobox, VirtualizedTreeList} from '@enonic/ui';
import {Project} from '../../../../app/settings/data/project/Project';
import {forwardRef, HTMLAttributes, ReactElement, useCallback, useMemo, useRef, useState} from 'react';
import {ProjectLabel} from '../project/ProjectLabel';
import {useStore} from '@nanostores/preact';
import {$projects} from '../../store/projects.store';
import {projectsToTreeListItems} from '../../utils/url/projects';
import {Virtuoso, VirtuosoHandle} from 'react-virtuoso';

type ProjectSelectorProps = {
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    selectionMode?: ComboboxRootProps['selectionMode'];
    placeholder?: string;
    noResults?: string;
    className?: string;
};

const PROJECT_SELECTOR_NAME = 'ProjectSelector';

export const ProjectSelector = (props: ProjectSelectorProps): ReactElement => {
    const {selection, onSelectionChange, selectionMode = 'single', placeholder, noResults, className} = props;

    // Hooks
    const {projects} = useStore($projects);
    const [searchValue, setSearchValue] = useState<string | undefined>();
    const [expanded, setExpanded] = useState<string[]>([]);
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Items
    const items = useMemo(() => projectsToTreeListItems(projects, expanded), [projects, expanded]);
    const filteredItems = useMemo(() => {
        if (!searchValue) return items;
        const searchLower = searchValue.toLowerCase();
        return items.filter((node) => node.data.getDisplayName().toLowerCase().includes(searchLower));
    }, [items, searchValue]);

    // Handlers
    const handleExpand = (id: string): void => {
        setExpanded((prev) => [...prev, id]);
    };
    const handleCollapse = (id: string): void => {
        setExpanded((prev) => prev.filter((idd) => idd !== id));
    };

    return (
        <Combobox.Root
            data-component={PROJECT_SELECTOR_NAME}
            value={searchValue}
            onChange={setSearchValue}
            selection={selection}
            onSelectionChange={onSelectionChange}
            contentType="tree"
            selectionMode={selectionMode}
            closeOnBlur={false}
        >
            <Combobox.Content className={className}>
                <Combobox.Control>
                    <Combobox.Search>
                        <Combobox.SearchIcon />
                        <Combobox.Input placeholder={placeholder} />
                        <Combobox.Apply />
                        <Combobox.Toggle />
                    </Combobox.Search>
                </Combobox.Control>
                <Combobox.Portal>
                    <Combobox.Popup className="mt-1.5">
                        <ProjectSelectorTreeContent
                            items={filteredItems}
                            handleExpand={handleExpand}
                            handleCollapse={handleCollapse}
                            selection={selection}
                            selectionMode={selectionMode}
                            noResults={noResults}
                            virtuosoRef={virtuosoRef}
                        />
                    </Combobox.Popup>
                </Combobox.Portal>
            </Combobox.Content>
        </Combobox.Root>
    );
};

ProjectSelector.DisplayName = PROJECT_SELECTOR_NAME;

type ProjectSelectorTreeContentProps = {
    items: FlatNode<Readonly<Project>>[];
    handleExpand: (id: string) => void;
    handleCollapse: (id: string) => void;
    selectionMode: ComboboxRootProps['selectionMode'];
    selection: readonly string[];
    virtuosoRef: React.RefObject<VirtuosoHandle>;
    noResults?: string;
};
const ProjectSelectorTreeContent = (props: ProjectSelectorTreeContentProps): ReactElement => {
    const {items, handleExpand, handleCollapse, selectionMode, virtuosoRef, noResults} = props;

    const {selection, onSelectionChange} = useCombobox();

    const handleTreeSelectionChange = useCallback(
        (newSelection: ReadonlySet<string>) => {
            onSelectionChange(Array.from(newSelection));
        },
        [onSelectionChange]
    );

    // Tree Height
    const nodesCount = items.length;
    const treeHeight = useMemo(() => {
        const contentHeight =
            nodesCount === 0 ? ROW_HEIGHT + PADDING : nodesCount * ROW_HEIGHT + Math.max(nodesCount - 1, 0) * GAP + PADDING;

        return Math.min(contentHeight, MAX_HEIGHT);
    }, [nodesCount]);

    return (
        <Combobox.TreeContent style={{height: treeHeight}}>
            <VirtualizedTreeList
                items={items}
                preserveFilteredSelection
                selection={selection}
                onSelectionChange={handleTreeSelectionChange}
                clearSelectionOnEscape={false}
                selectionMode={selectionMode === 'single' ? 'single' : 'multiple'}
                onExpand={handleExpand}
                onCollapse={handleCollapse}
                virtuosoRef={virtuosoRef}
                className="h-full"
            >
                {({items, getItemProps, containerProps}) =>
                    items.length > 0 ? (
                        <Virtuoso<FlatNode<Readonly<Project>>>
                            ref={virtuosoRef}
                            data={items}
                            components={virtuosoComponents}
                            {...containerProps}
                            className={cn('h-full', containerProps.className)}
                            itemContent={(index, node) => {
                                if (!node.data) return;

                                const itemProps = getItemProps(index, node);

                                return (
                                    <VirtualizedTreeList.Row {...itemProps}>
                                        <VirtualizedTreeList.RowLeft>
                                            <VirtualizedTreeList.RowLevelSpacer level={node.level} />
                                            <VirtualizedTreeList.RowExpandControl
                                                expanded={node.isExpanded}
                                                hasChildren={node.hasChildren}
                                                onToggle={() => (node.isExpanded ? handleCollapse(node.id) : handleExpand(node.id))}
                                                selected={itemProps.selected}
                                            />
                                        </VirtualizedTreeList.RowLeft>

                                        <VirtualizedTreeList.RowContent>
                                            <ProjectLabel project={node.data} />
                                        </VirtualizedTreeList.RowContent>

                                        {selectionMode !== 'single' && (
                                            <VirtualizedTreeList.RowRight>
                                                <VirtualizedTreeList.RowSelectionControl rowId={node.id} />
                                            </VirtualizedTreeList.RowRight>
                                        )}
                                    </VirtualizedTreeList.Row>
                                );
                            }}
                        />
                    ) : (
                        <div className="p-4 text-sm text-subtle">{noResults}</div>
                    )
                }
            </VirtualizedTreeList>
        </Combobox.TreeContent>
    );
};

//
// * Virtuoso
//

const ROW_HEIGHT = 50;
const MAX_HEIGHT = 240;
const GAP = 6;
const PADDING = 8;

const virtuosoComponents = {
    Scroller: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, className, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className={cn('rounded-sm *:p-1', className)}>
            {children}
        </div>
    )),
    List: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, className, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className={cn('flex flex-col gap-y-1.5', className)}>
            {children}
        </div>
    )),
};
