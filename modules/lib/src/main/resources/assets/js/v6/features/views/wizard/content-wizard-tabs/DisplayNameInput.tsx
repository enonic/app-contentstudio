import {cn} from '@enonic/ui';
import {FieldError} from '@enonic/lib-admin-ui/form2/components/field-error';
import {useStore} from '@nanostores/preact';
import {useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {EditableText} from '../../../shared/primitives/EditableText';
import {$displayName, setDraftDisplayName} from '../../../store/wizardContent.store';
import {$validationVisibility} from '../../../store/wizardValidation.store';

const DISPLAY_NAME_INPUT_NAME = 'DisplayNameInput';

export const DisplayNameInput = (): ReactElement => {
    const displayName = useStore($displayName);
    const visibility = useStore($validationVisibility);
    const [touched, setTouched] = useState(false);

    const placeholder = useI18n('field.displayName');
    const errorMessage = useI18n('field.displayName.required');

    const isInvalid = displayName.trim().length === 0;
    const showError = isInvalid && (
        visibility === 'all' || (visibility === 'interactive' && touched)
    );

    const handleEditingChange = (isEditing: boolean): void => {
        if (!isEditing) {
            setTouched(true);
        }
    };

    return (
        <div>
            <EditableText
                data-component={DISPLAY_NAME_INPUT_NAME}
                size="xl"
                value={displayName}
                placeholder={placeholder}
                onValueChange={setDraftDisplayName}
                onCommit={setDraftDisplayName}
                onEditingChange={handleEditingChange}
                error={showError}
                className={cn(
                    'min-w-64 px-5 placeholder:text-subtle/50 rounded-xs focus:border-transparent',
                    showError ? 'border-l-error' : 'border-l-bdr-subtle',
                )}
            />
            <FieldError className="mt-2" message={showError ? errorMessage : undefined} />
        </div>
    );
};

DisplayNameInput.displayName = DISPLAY_NAME_INPUT_NAME;
