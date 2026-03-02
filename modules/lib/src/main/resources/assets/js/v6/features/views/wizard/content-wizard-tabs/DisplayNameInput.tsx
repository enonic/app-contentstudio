import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {EditableText} from '../../../shared/primitives/EditableText';
import {$displayName, setDraftDisplayName} from '../../../store/wizardContent.store';

const DISPLAY_NAME_INPUT_NAME = 'DisplayNameInput';

export const DisplayNameInput = (): ReactElement => {
    const displayName = useStore($displayName);
    const placeholder = useI18n('field.displayName');

    return (
        <EditableText
            data-component={DISPLAY_NAME_INPUT_NAME}
            size="xl"
            value={displayName}
            placeholder={placeholder}
            onValueChange={setDraftDisplayName}
            onCommit={setDraftDisplayName}
            className='min-w-64 px-5 placeholder:text-subtle/50 border-l-bdr-subtle rounded-xs'
        />
    );
};

DisplayNameInput.displayName = DISPLAY_NAME_INPUT_NAME;
