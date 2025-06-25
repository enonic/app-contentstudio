import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Toggle, ToggleProps} from '@enonic/ui';
import {ReactElement} from 'react';
import {useAction} from '../hooks/useAction';

export type ActionButtonProps = {
    action: Action;
} & Omit<ToggleProps, 'disabled' | 'onClick'>;

export const ActionToggle = ({action, ...props}: ActionButtonProps): ReactElement => {
    const {label, enabled, execute} = useAction(action);

    return (
        <Toggle
            label={label}
            disabled={!enabled}
            onPressedChange={() => execute()}
            {...props}
        />
    );
};

ActionToggle.displayName = 'ActionButton';
