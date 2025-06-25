import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {cn, Toggle, Toolbar, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Search} from 'lucide-react';
import {ReactElement} from 'react';
import {useAction} from '../../../hooks/useAction';
import {useI18n} from '../../../hooks/useI18n';
import {$isContentFilterOpen} from '../../../store/contentFilter.store';

type Props = {
    action: Action;
    className?: string;
};

export const SearchToggle = ({action, className}: Props): ReactElement => {
    const isContentFilterOpen = useStore($isContentFilterOpen);
    const {label, enabled, execute} = useAction(action);

    const showReachLabel = useI18n('action.search.show');
    const hideReachLabel = useI18n('action.search.hide');
    const searchLabel = label || (isContentFilterOpen ? showReachLabel : hideReachLabel);

    return (
        <Tooltip delay={300} value={searchLabel} asChild>
            <Toolbar.Item asChild disabled={!enabled}>
                <Toggle
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
};

SearchToggle.displayName = 'SearchToggle';
