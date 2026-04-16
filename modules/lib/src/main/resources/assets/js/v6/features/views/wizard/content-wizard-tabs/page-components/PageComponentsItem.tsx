import type {SortableListItemContext} from '@enonic/lib-admin-ui/form2/components';
import {cn} from '@enonic/ui';
import {Box, ChevronRight, Columns2, Globe, type LucideIcon, OctagonAlert, Puzzle, Type,} from 'lucide-react';
import {type MouseEvent, type ReactElement} from 'react';
import type {FlatNode} from '../../../../lib/tree-store';
import type {PageComponentNodeData, PageComponentNodeType} from './types';

//
// * Types
//

export type PageComponentsItemProps = {
    context: SortableListItemContext<FlatNode<PageComponentNodeData>>;
    selected?: boolean;
    invalid?: boolean;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
};

//
// * Icon map
//

const NODE_TYPE_ICON: Partial<Record<PageComponentNodeType, LucideIcon>> = {
    page: Globe,
    part: Box,
    layout: Columns2,
    text: Type,
    fragment: Puzzle,
};

//
// * Constants
//

const PAGE_COMPONENTS_ITEM_NAME = 'PageComponentsItem';

const LEVEL_INDENT_PX = 20;

const calcSpacerWidth = (level: number): number => LEVEL_INDENT_PX * (level - 1) - 10;

//
// * Component
//

export const PageComponentsItem = ({
    context,
    selected,
    invalid,
    onToggle,
    onSelect,
}: PageComponentsItemProps): ReactElement | null => {
    const {item: node} = context;
    const data = node.data;
    if (data == null) {
        return null;
    }

    const isRegion = data.nodeType === 'region';
    const isSubdued = isRegion || !data.hasDescriptor;
    const Icon = NODE_TYPE_ICON[data.nodeType];
    const spacerWidth = calcSpacerWidth(node.level);

    const handleToggleClick = (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        onToggle(node.id);
    };

    const handleClick = (): void => {
        onSelect(node.id);
    };

    return (
        <div
            className="flex flex-1 min-w-0 items-center gap-1 py-1"
            data-node-id={node.id}
            onClick={handleClick}
        >
            {!context.isMovable && <span className="size-5 shrink-0" />}

            {spacerWidth > 0 && (
                <span style={{paddingInlineStart: `${spacerWidth}px`}} />
            )}

            {node.hasChildren ? (
                <button
                    type="button"
                    tabIndex={-1}
                    className={cn(
                        'flex items-center justify-center size-5 shrink-0 cursor-pointer',
                        selected ? 'text-alt' : 'text-subtle hover:text-primary',
                    )}
                    onClick={handleToggleClick}
                >
                    <ChevronRight className={cn(
                        'size-5 transition-transform duration-150',
                        node.isExpanded && 'rotate-90',
                    )} />
                </button>
            ) : (
                <span className="size-5 shrink-0" />
            )}

            {Icon != null && (
                <Icon className={cn('size-5 shrink-0', selected ? 'text-alt' : isSubdued ? 'text-subtle' : 'text-default')} />
            )}

            <span className={cn(
                'truncate text-base',
                isRegion && 'uppercase',
                isRegion ? 'text-subtle font-normal' : 'font-semibold',
                selected
                    ? 'text-alt'
                    : isSubdued ? 'text-subtle' : 'text-default',
            )}>
                {data.displayName}
            </span>

            {invalid && (
                <OctagonAlert className="size-3.5 shrink-0 text-error" strokeWidth={2.5} />
            )}
        </div>
    );
};

PageComponentsItem.displayName = PAGE_COMPONENTS_ITEM_NAME;
