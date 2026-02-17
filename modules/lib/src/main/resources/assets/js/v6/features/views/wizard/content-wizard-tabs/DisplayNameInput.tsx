import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {EditableText} from '../../../shared/primitives/EditableText';
import {$displayName, setDisplayNameDraft} from '../../../store/wizardContent.store';

const displayNameClasses = cn(
    'rounded-none',
    'px-5',
    'min-w-64',
    'border-l-bdr-subtle',
);

export const DisplayNameInput = (): ReactElement => {
    const displayName = useStore($displayName);
    const placeholder = useI18n('field.displayName');

    return (
        <EditableText
            size="xl"
            value={displayName}
            placeholder={placeholder}
            onCommit={setDisplayNameDraft}
            className={displayNameClasses}
        />
    );
};

DisplayNameInput.displayName = 'DisplayNameInput';
