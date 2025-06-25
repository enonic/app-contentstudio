import {cn, Toggle, Toolbar, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {PanelRightClose, PanelRightOpen} from 'lucide-react';
import {ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$isContextOpen, setContextOpen} from '../../../store/contextWidgets.store';

type Props = {
    className?: string;
};

export const ContextToggle = ({className}: Props): ReactElement => {
    const isContextOpen = useStore($isContextOpen);

    const showReachLabel = useI18n('action.context.show');
    const hideReachLabel = useI18n('action.context.hide');
    const contextLabel = isContextOpen ? hideReachLabel : showReachLabel;
    const ContextIcon = isContextOpen ? PanelRightClose : PanelRightOpen;

    return (
        <Tooltip delay={300} side='left' value={contextLabel} asChild>
            <Toolbar.Item asChild>
                <Toggle
                    className={cn('size-9 p-0', className)}
                    size='sm'
                    aria-label={contextLabel}
                    startIcon={ContextIcon}
                    pressed={isContextOpen}
                    onPressedChange={setContextOpen}
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

ContextToggle.displayName = 'ContextToggle';
