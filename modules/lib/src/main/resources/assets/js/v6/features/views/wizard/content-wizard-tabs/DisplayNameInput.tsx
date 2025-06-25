import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {EditableText} from '../../../shared/primitives/EditableText';
import {$displayName, setDisplayNameDraft} from '../../../store/wizardContent.store';

export const DisplayNameInput = (): ReactElement => {
    const displayName = useStore($displayName);
    const placeholder = useI18n('field.displayName');

    return (
        <EditableText
            size="xl"
            value={displayName}
            placeholder={placeholder}
            onCommit={setDisplayNameDraft}
            className='min-w-64 px-5 placeholder:text-subtle/50 border-l-bdr-subtle rounded-none '
        />
    );
};

DisplayNameInput.displayName = 'DisplayNameInput';
