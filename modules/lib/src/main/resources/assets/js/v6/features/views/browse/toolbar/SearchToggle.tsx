import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {cn, Toggle, Toolbar, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Search} from 'lucide-react';
import {forwardRef, type ReactElement} from 'react';
import {useAction} from '../../../hooks/useAction';
import {useI18n} from '../../../hooks/useI18n';
import {$isContentFilterOpen} from '../../../store/contentFilter.store';

export const SEARCH_TOGGLE_TOOLBAR_ITEM_ID = 'search-toggle';

type Props = {
    action: Action;
    className?: string;
};

export const SearchToggle = forwardRef<HTMLButtonElement, Props>(({action, className}, ref): ReactElement => {
    const isContentFilterOpen = useStore($isContentFilterOpen);
    const {label, enabled, execute} = useAction(action);

    const showReachLabel = useI18n('tooltip.filterPanel.show');
    const hideReachLabel = useI18n('tooltip.filterPanel.hide');
    const searchLabel = label || (isContentFilterOpen ? hideReachLabel : showReachLabel);

    return (
        <Tooltip delay={300} value={searchLabel} asChild>
            <Toolbar.Item
                id={SEARCH_TOGGLE_TOOLBAR_ITEM_ID}
                asChild
                disabled={!enabled}
            >
                <Toggle
                    ref={ref}
                    className={cn('size-9 p-0', className)}
                    size='sm'
                    iconStrokeWidth={2}
                    aria-label={searchLabel}
                    startIcon={Search}
                    pressed={isContentFilterOpen}
                    onPressedChange={() => execute()}
                />
            </Toolbar.Item>
        </Tooltip>
    );
});

SearchToggle.displayName = 'SearchToggle';
