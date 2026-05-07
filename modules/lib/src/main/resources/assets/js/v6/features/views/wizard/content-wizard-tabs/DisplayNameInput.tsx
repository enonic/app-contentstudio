import {cn} from '@enonic/ui';
import {AiContentOperatorSetContextEvent} from '@enonic/lib-admin-ui/ai/event/AiContentOperatorSetContextEvent';
import {FieldError} from '@enonic/lib-admin-ui/form2/components/field-error';
import {useStore} from '@nanostores/preact';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ChangeEventHandler,
    type FocusEventHandler,
    type KeyboardEventHandler,
    type ReactElement,
} from 'react';
import {AiContentDataHelper} from '../../../../../app/ai/AiContentDataHelper';
import {useI18n} from '../../../hooks/useI18n';
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

function normalizeSingleLineValue(value: string): string {
    return value.replace(/[\r\n]+/g, ' ');
}

export const DisplayNameInput = (): ReactElement => {
    const displayName = useStore($displayName);
    const shouldFocus = useStore($displayNameInputFocusRequested);
    const visibility = useStore($validationVisibility);
    const readOnly = useStore($wizardReadOnly);
    const [touched, setTouched] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    const placeholder = useI18n('field.displayName');
    const errorMessage = useI18n('field.displayName.required');

    const isInvalid = displayName.trim().length === 0;
    const showError = isInvalid && (
        visibility === 'all' || (visibility === 'interactive' && touched)
    );

    const [isEditing, setIsEditing] = useState(false);
    const isShowingPlaceholder = !displayName && !!placeholder;

    const startEditing = useCallback((): void => {
        if (readOnly) {
            return;
        }

        setIsEditing(true);
    }, [readOnly]);

    const updateEditorHeight = useCallback((): void => {
        if (!inputRef.current) {
            return;
        }

        const el = inputRef.current;
        const previousHeight = el.style.height;

        el.style.height = 'auto';
        const nextHeight = `${el.scrollHeight}px`;
        el.style.height = previousHeight === nextHeight ? previousHeight : nextHeight;
    }, []);

    const handleEditorChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event): void => {
        setDraftDisplayName(normalizeSingleLineValue(event.currentTarget.value));
    }, []);

    const handleEditorFocus: FocusEventHandler<HTMLTextAreaElement> = useCallback((): void => {
        setAIContext();
        requestAnimationFrame(() => inputRef.current?.select());
    }, []);

    const handleEditorBlur: FocusEventHandler<HTMLTextAreaElement> = useCallback((event): void => {
        event.currentTarget.setSelectionRange(0, 0);
        setIsEditing(false);
        setTouched(true);
        setDraftDisplayName(event.currentTarget.value.trim());
    }, []);

    const handleEditorKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback((event): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    }, []);

    useLayoutEffect(() => {
        if (!shouldFocus || !isInvalid || readOnly) {
            return;
        }

        setIsEditing(true);
    }, [shouldFocus, isInvalid, readOnly]);

    useLayoutEffect(() => {
        if (!isEditing || !inputRef.current) {
            return;
        }

        inputRef.current.focus();

        if (shouldFocus) {
            clearDisplayNameInputFocusRequest();
        }
    }, [isEditing, shouldFocus]);

    useLayoutEffect(() => {
        if (isEditing) {
            updateEditorHeight();
        }
    }, [displayName, isEditing, updateEditorHeight]);

    useEffect(() => {
        if (!isEditing || !inputRef.current) {
            return;
        }

        let rafId = requestAnimationFrame(updateEditorHeight);
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateEditorHeight);
        });

        observer.observe(inputRef.current);

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [isEditing, updateEditorHeight]);

    return (
        <div>
            {!isEditing ? (
                <button
                    type="button"
                    data-component={DISPLAY_NAME_INPUT_NAME}
                    aria-invalid={showError || undefined}
                    disabled={readOnly}
                    onClick={startEditing}
                    onFocus={startEditing}
                    className={cn(
                        'block w-full min-w-64 truncate border-0 border-l-1 bg-transparent text-left text-[2rem] font-semibold',
                        'px-2.5 py-1 pl-4.5 rounded-none',
                        'hover:not-disabled:border-l-4 hover:not-disabled:pl-3.75',
                        'focus:outline-none focus:ring-0 focus:ring-offset-0',
                        'disabled:select-none disabled:cursor-not-allowed disabled:opacity-50',
                        isShowingPlaceholder && 'text-subtle/50',
                        showError ? 'border-l-error focus:border-l-error' : 'border-l-bdr-subtle focus:border-l-ring',
                    )}
                >
                    {displayName || placeholder}
                </button>
            ) : (
                <textarea
                    ref={inputRef}
                    data-component={DISPLAY_NAME_INPUT_NAME}
                    value={displayName}
                    placeholder={placeholder}
                    aria-invalid={showError || undefined}
                    rows={1}
                    onChange={handleEditorChange}
                    onFocus={handleEditorFocus}
                    onBlur={handleEditorBlur}
                    onKeyDown={handleEditorKeyDown}
                    disabled={readOnly}
                    className={cn(
                        'w-full min-w-64 resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent',
                        'border-0 border-l-1 text-[2rem] font-semibold px-2.5 py-1 pl-4.5',
                        '[&:hover,&:focus]:border-l-4 [&:hover,&:focus]:pl-3.75 placeholder:text-subtle/50 rounded-none',
                        'transition-highlight focus:outline-none disabled:select-none disabled:cursor-not-allowed disabled:opacity-50',
                        'focus:ring-0 focus:ring-offset-0 focus:border-transparent',
                        showError ? 'border-l-error focus:border-l-error' : 'border-l-bdr-subtle focus:border-l-ring',
                    )}
                />
            )}
            <FieldError className="mt-2" message={showError ? errorMessage : undefined} />
        </div>
    );
};

DisplayNameInput.displayName = DISPLAY_NAME_INPUT_NAME;
