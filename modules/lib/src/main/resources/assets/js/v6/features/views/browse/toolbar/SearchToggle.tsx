import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {cn, Toggle, Toolbar, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Search} from 'lucide-react';
import {ReactElement} from 'react';
import {useAction} from '../../../hooks/useAction';
import {useI18n} from '../../../hooks/useI18n';
import {$contentFilterOpen} from '../../../store/contentFilter.store';

type Props = {
    action: Action;
    className?: string;
};

export const SearchToggle = ({action, className}: Props): ReactElement => {
    const isContentFilterOpen = useStore($contentFilterOpen);
    const {label, enabled, execute} = useAction(action);

    const showReachLabel = useI18n('action.search.show');
    const hideReachLabel = useI18n('action.search.hide');
    const searchLabel = label || (isContentFilterOpen ? showReachLabel : hideReachLabel);

    return (
        <Tooltip value={searchLabel} asChild>
            <Toolbar.Item asChild>
                <Toggle
                    className={cn('size-10 p-0', className)}
                    aria-label={searchLabel}
                    startIcon={Search}
                    pressed={isContentFilterOpen}
                    onPressedChange={() => execute()}
                    disabled={!enabled}
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

SearchToggle.displayName = 'SearchToggle';
