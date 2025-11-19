import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button, ButtonProps, Toolbar} from '@enonic/ui';
import {ReactElement} from 'react';
import {useAction} from '../../../hooks/useAction';
import {ActionButton} from '../../../shared/ActionButton';

type Props = {
    action: Action;
};

export const ToolbarActionButton = ({action}: Props): ReactElement => {
    const {label, enabled, execute} = useAction(action);

    return (
        <Toolbar.Item asChild disabled={!enabled}>
            <Button
                size='sm'
                label={label}
                onClick={() => execute()}
            />
        </Toolbar.Item>
    );
};

ToolbarActionButton.displayName = 'ToolbarActionButton';
