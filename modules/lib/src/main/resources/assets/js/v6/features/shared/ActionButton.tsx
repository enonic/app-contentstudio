import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button, ButtonProps} from '@enonic/ui';
import {ReactElement} from 'react';
import {useAction} from '../hooks/useAction';

export type ActionButtonProps = {
    action: Action;
} & Omit<ButtonProps, 'disabled' | 'onClick'>;

export const ActionButton = ({action, ...props}: ActionButtonProps): ReactElement => {
    const {label, enabled, execute} = useAction(action);

    return (
        <Button
            {...props}
            label={label}
            disabled={!enabled}
            onClick={() => execute()}
        />
    );
};

ActionButton.displayName = 'ActionButton';
