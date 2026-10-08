import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { cn, Toggle, Toolbar, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Search, ZoomIn } from 'lucide-react';
import { type ReactElement, useEffect, useRef } from 'react';
import { useAction } from '../../shared/lib/hooks/useAction';
import { useBreakpoints } from '../../shared/lib/hooks/useBreakpoints';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import {
    $isContentFilterOpen,
    $isContentFilterDirty,
    $isDependencySearchPending,
} from '../../features/search/model/contentFilter.store';
import { $isFilterActive } from '../../entities/content/model/active-tree.store';

type Props = {
    action: Action;
    className?: string;
};

export const SearchToggle = ({ action, className }: Props): ReactElement => {
    const toggleRef = useRef<HTMLButtonElement>(null);
    const isContentFilterOpen = useStore($isContentFilterOpen);
    const wasContentFilterOpen = useRef(isContentFilterOpen);
    const skipFocusReturnRef = useRef(false);
    const isFilterDirty = useStore($isContentFilterDirty);
    const isFilterActive = useStore($isFilterActive);
    const { label, enabled, execute } = useAction(action);

    const showReachLabel = useI18n('tooltip.filterPanel.show');
    const hideReachLabel = useI18n('tooltip.filterPanel.hide');
    const searchLabel = label || (isContentFilterOpen ? hideReachLabel : showReachLabel);

    const { sm } = useBreakpoints();

    useEffect(
        () =>
            $isContentFilterOpen.listen((isOpen, wasOpen) => {
                if (isOpen) {
                    skipFocusReturnRef.current = false;
                } else if (wasOpen) {
                    skipFocusReturnRef.current = $isDependencySearchPending.get();
                }
            }),
        [],
    );

    // Closing the filter panel hides the focused search input, so focus returns here
    useEffect(() => {
        if (wasContentFilterOpen.current && !isContentFilterOpen) {
            if (!skipFocusReturnRef.current) {
                toggleRef.current?.focus();
            }
            skipFocusReturnRef.current = false;
        }
        wasContentFilterOpen.current = isContentFilterOpen;
    }, [isContentFilterOpen]);

    return (
        <Tooltip side={sm ? 'bottom' : 'right'} delay={300} value={searchLabel} asChild>
            <Toolbar.Item asChild disabled={!enabled}>
                <Toggle
                    ref={toggleRef}
                    className={cn('size-9 p-0', className)}
                    size="sm"
                    iconStrokeWidth={2}
                    startIconClassName="max-sm:size-5 max-sm:[stroke-width:1.5]"
                    aria-label={searchLabel}
                    startIcon={isFilterDirty || isFilterActive ? ZoomIn : Search}
                    pressed={isContentFilterOpen}
                    onPressedChange={() => execute()}
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

SearchToggle.displayName = 'SearchToggle';
