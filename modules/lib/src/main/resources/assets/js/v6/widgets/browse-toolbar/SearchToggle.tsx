import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { cn, Toggle, Toolbar, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Search, SearchCheck } from 'lucide-react';
import { type ReactElement, useEffect, useRef } from 'react';
import { useAction } from '../../shared/lib/hooks/useAction';
import { useBreakpoints } from '../../shared/lib/hooks/useBreakpoints';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { $isContentFilterOpen, $isContentFilterDirty } from '../../features/search/model/contentFilter.store';

type Props = {
    action: Action;
    className?: string;
};

export const SearchToggle = ({ action, className }: Props): ReactElement => {
    const toggleRef = useRef<HTMLButtonElement>(null);
    const isContentFilterOpen = useStore($isContentFilterOpen);
    const wasContentFilterOpen = useRef(isContentFilterOpen);
    const isFilterDirty = useStore($isContentFilterDirty);
    const { label, enabled, execute } = useAction(action);

    const showReachLabel = useI18n('tooltip.filterPanel.show');
    const hideReachLabel = useI18n('tooltip.filterPanel.hide');
    const searchLabel = label || (isContentFilterOpen ? hideReachLabel : showReachLabel);

    const { sm } = useBreakpoints();

    // Closing the filter panel hides the focused search input, so focus returns here
    useEffect(() => {
        if (wasContentFilterOpen.current && !isContentFilterOpen) {
            toggleRef.current?.focus();
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
                    startIconClassName="max-sm:size-5 max-sm:translate-x-1.5 max-sm:[stroke-width:1.5]"
                    aria-label={searchLabel}
                    startIcon={isFilterDirty ? SearchCheck : Search}
                    pressed={isContentFilterOpen}
                    onPressedChange={() => execute()}
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

SearchToggle.displayName = 'SearchToggle';
