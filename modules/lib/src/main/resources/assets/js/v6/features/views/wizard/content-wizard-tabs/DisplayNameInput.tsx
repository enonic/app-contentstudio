import {cn} from '@enonic/ui';
import {AiContentOperatorSetContextEvent} from '@enonic/lib-admin-ui/ai/event/AiContentOperatorSetContextEvent';
import {FieldError} from '@enonic/lib-admin-ui/form2/components/field-error';
import {useStore} from '@nanostores/preact';
import {useLayoutEffect, useRef, useState, type ReactElement} from 'react';
import {AiContentDataHelper} from '../../../../../app/ai/AiContentDataHelper';
import {useI18n} from '../../../hooks/useI18n';
import {EditableText} from '../../../shared/primitives/EditableText';
import {
    $displayName,
    $displayNameInputFocusRequested,
    $wizardReadOnly,
    clearDisplayNameInputFocusRequest,
    setDraftDisplayName,
} from '../../../store/wizardContent.store';
import {$validationVisibility} from '../../../store/wizardValidation.store';

const DISPLAY_NAME_INPUT_NAME = 'DisplayNameInput';

function setAIContext(): void {
    new AiContentOperatorSetContextEvent(AiContentDataHelper.TOPIC_PATH).fire();
}

export const DisplayNameInput = (): ReactElement => {
    const displayName = useStore($displayName);
    const shouldFocus = useStore($displayNameInputFocusRequested);
    const visibility = useStore($validationVisibility);
    const readOnly = useStore($wizardReadOnly);
    const [touched, setTouched] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

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

    useLayoutEffect(() => {
        if (!shouldFocus || !isInvalid || readOnly || !inputRef.current) {
            return;
        }

        inputRef.current.focus();
        clearDisplayNameInputFocusRequest();
    }, [shouldFocus, readOnly, inputRef.current]);

    return (
        <div>
            <EditableText
                ref={inputRef}
                data-component={DISPLAY_NAME_INPUT_NAME}
                size="xl"
                value={displayName}
                placeholder={placeholder}
                onValueChange={setDraftDisplayName}
                onCommit={setDraftDisplayName}
                onEditingChange={handleEditingChange}
                onFocus={setAIContext}
                disabled={readOnly}
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
