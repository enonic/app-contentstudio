import { Button, Toolbar } from '@enonic/ui';
import { type ReactElement } from 'react';
import { type ToolbarAction } from './toolbarAction';

type Props = {
    action: ToolbarAction;
    disabled?: boolean;
};

export const ToolbarActionButton = ({ action, disabled = false }: Props): ReactElement | null => {
    if (!action.visible) {
        return null;
    }

    return (
        <Toolbar.Item asChild disabled={disabled || !action.enabled}>
            <Button size="sm" label={action.label} onClick={() => action.execute()} />
        </Toolbar.Item>
    );
};

ToolbarActionButton.displayName = 'ToolbarActionButton';
