import {Button} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {useI18n} from '../../../../../hooks/useI18n';
import {$inspectedItem, $inspectedItemType, requestReloadComponent} from '../../../../../store/page-editor';
import {$isApplyEnabled, executeInspectSave} from '../../../../../store/inspect-panel.store';

const APPLY_BUTTON_NAME = 'InspectApplyButton';

const RELOADABLE_TYPES = new Set(['part', 'layout', 'fragment', 'text']);

export const ApplyButton = (): ReactElement => {
    const isEnabled = useStore($isApplyEnabled);
    const item = useStore($inspectedItem);
    const itemType = useStore($inspectedItemType);
    const label = useI18n('action.apply');

    const handleClick = (): void => {
        const typeKey = itemType?.toString();
        if (item && typeKey && RELOADABLE_TYPES.has(typeKey)) {
            requestReloadComponent(item.getPath(), true);
            return;
        }
        executeInspectSave();
    };

    return (
        <Button
            data-component={APPLY_BUTTON_NAME}
            variant="solid"
            className="mt-10 self-center w-full max-w-80"
            disabled={!isEnabled}
            onClick={handleClick}
            label={label}
        />
    );
};

ApplyButton.displayName = APPLY_BUTTON_NAME;
