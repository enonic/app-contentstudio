import {Button} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {useI18n} from '../../../../../hooks/useI18n';
import {$isApplyEnabled, executeInspectSave} from '../../../../../store/inspect-panel.store';

const APPLY_BUTTON_NAME = 'InspectApplyButton';

export const ApplyButton = (): ReactElement => {
    const isEnabled = useStore($isApplyEnabled);
    const label = useI18n('action.apply');

    return (
        <Button
            data-component={APPLY_BUTTON_NAME}
            variant="solid"
            className="mt-10 self-center w-full max-w-80"
            disabled={!isEnabled}
            onClick={executeInspectSave}
            label={label}
        />
    );
};

ApplyButton.displayName = APPLY_BUTTON_NAME;
