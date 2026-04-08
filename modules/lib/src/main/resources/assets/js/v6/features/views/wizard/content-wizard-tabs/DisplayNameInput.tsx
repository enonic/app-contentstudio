import {cn} from '@enonic/ui';
import {AiContentOperatorSetContextEvent} from '@enonic/lib-admin-ui/ai/event/AiContentOperatorSetContextEvent';
import {FieldError} from '@enonic/lib-admin-ui/form2/components/field-error';
import {useStore} from '@nanostores/preact';
import {type FocusEvent, useCallback, useState, type ReactElement} from 'react';
import {AI_CONTENT_TOPIC_PATH} from '../../../../../app/ai/AiContentDataHelper';
import {useI18n} from '../../../hooks/useI18n';
import {EditableText} from '../../../shared/primitives/EditableText';
import {$displayName, setDraftDisplayName} from '../../../store/wizardContent.store';
import {$validationVisibility} from '../../../store/wizardValidation.store';

export const DISPLAY_NAME_INPUT_NAME = 'DisplayNameInput';
export const DISPLAY_NAME_INPUT_SELECTOR = `input[data-component="${DISPLAY_NAME_INPUT_NAME}"]`;

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

    const handleFocus = useCallback((_event: FocusEvent<HTMLInputElement>): void => {
        new AiContentOperatorSetContextEvent(AI_CONTENT_TOPIC_PATH).fire();
    }, []);

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
                onFocus={handleFocus}
                error={showError}
                className={cn(
                    'min-w-64 border-0 border-l-1 [&:hover,&:focus]:border-l-4 pl-4.5 [&:hover,&:focus]:pl-3.75 placeholder:text-subtle/50 rounded-none',
                    'focus:ring-0 focus:ring-offset-0 focus:border-transparent',
                    showError ? 'border-l-error focus:border-l-error' : 'border-l-bdr-subtle focus:border-l-ring',
                )}
            />
            <FieldError className="mt-2" message={showError ? errorMessage : undefined} />
        </div>
    );
};

DisplayNameInput.displayName = DISPLAY_NAME_INPUT_NAME;
