import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button, Toolbar} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useAction} from '../../../hooks/useAction';

type Props = {
    action: Action;
    disabled?: boolean;
};

export const ToolbarActionButton = ({action, disabled = false}: Props): ReactElement | null => {
    const {label, enabled, visible, execute} = useAction(action);
    const isDisabled = disabled || !enabled;

    if (!visible) {
        return null;
    }

    return (
        <Toolbar.Item asChild disabled={isDisabled}>
            <Button
                size='sm'
                label={label}
                onClick={() => execute()}
            />
        </Toolbar.Item>
    );
};

ToolbarActionButton.displayName = 'ToolbarActionButton';
