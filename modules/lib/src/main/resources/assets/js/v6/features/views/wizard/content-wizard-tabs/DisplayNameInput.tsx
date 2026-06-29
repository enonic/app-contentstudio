import {cn, useBlinkAttention} from '@enonic/ui';
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
import {
    $aiPluginDialogOpen,
    $aiTopicError,
    $aiTopicHighlight,
    $aiTopicProcessing,
    AI_TOPIC_PATH,
    clearAiTopicError,
    sendPluginContext,
} from '../../../store/ai';
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
    // Gate like data fields: send the topic only while the dialog is open.
    if (!$aiPluginDialogOpen.get()['ai.contentOperator']) {
        return;
    }
    sendPluginContext('ai.contentOperator', AI_TOPIC_PATH);
}

function normalizeSingleLineValue(value: string): string {
    return value.replace(/[\r\n]+/g, ' ');
}

export const DisplayNameInput = (): ReactElement => {
    const displayName = useStore($displayName);
    const shouldFocus = useStore($displayNameInputFocusRequested);
    const visibility = useStore($validationVisibility);
    const readOnly = useStore($wizardReadOnly);
    const aiProcessing = useStore($aiTopicProcessing);
    const aiError = useStore($aiTopicError);
    const topicHighlight = useStore($aiTopicHighlight);
    const [touched, setTouched] = useState(false);
    const userEngagedRef = useRef(false);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const isBlinking = useBlinkAttention(rootRef, topicHighlight.count, {scrollIntoView: topicHighlight.scroll});

    const placeholder = useI18n('field.displayName');
    const requiredErrorMessage = useI18n('field.displayName.required');

    const isInvalid = displayName.trim().length === 0;
    const showRequiredError = !aiProcessing && !aiError && isInvalid && (
        visibility === 'all' || (visibility === 'interactive' && touched)
    );
    // AI failure wins over the required-field check the same way `InputField`
    // surfaces transient translator errors above validation errors.
    const visibleError = aiProcessing
        ? undefined
        : aiError ?? (showRequiredError ? requiredErrorMessage : undefined);
    const showErrorBorder = !aiProcessing && (aiError != null || showRequiredError);

    const [isEditing, setIsEditing] = useState(false);
    const isShowingPlaceholder = !displayName && !!placeholder;

    const startEditing = useCallback((): void => {
        if (readOnly || aiProcessing) {
            return;
        }

        setIsEditing(true);
    }, [readOnly, aiProcessing]);

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
        // Mirrors InputField: clear the transient AI error as soon as the user starts editing.
        clearAiTopicError();
        userEngagedRef.current = true;
        setDraftDisplayName(normalizeSingleLineValue(event.currentTarget.value));
    }, []);

    const handleEditorFocus: FocusEventHandler<HTMLTextAreaElement> = useCallback((): void => {
        setAIContext();
        requestAnimationFrame(() => {
            const input = inputRef.current;
            input?.setSelectionRange(input.value.length, input.value.length);
        });
    }, []);

    const handleEditorBlur: FocusEventHandler<HTMLTextAreaElement> = useCallback((event): void => {
        event.currentTarget.setSelectionRange(0, 0);
        setIsEditing(false);
        if (userEngagedRef.current) {
            setTouched(true);
        }
        setDraftDisplayName(event.currentTarget.value.trim());
    }, []);

    const handleEditorKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback((event): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    }, []);

    useLayoutEffect(() => {
        if (!shouldFocus || readOnly || aiProcessing) {
            return;
        }

        setIsEditing(true);
    }, [shouldFocus, readOnly, aiProcessing]);

    // AI streamed updates land in the display value while editing would mask them.
    // Switching out of edit mode lets the shimmer overlay show and prevents the
    // caret from jumping while text arrives.
    useEffect(() => {
        if (aiProcessing && isEditing) {
            setIsEditing(false);
        }
    }, [aiProcessing, isEditing]);

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
        <div ref={rootRef} className={cn('rounded-sm', isBlinking && 'input-blink-attention')}>
            {!isEditing ? (
                <button
                    type="button"
                    data-component={DISPLAY_NAME_INPUT_NAME}
                    aria-invalid={showErrorBorder || undefined}
                    aria-busy={aiProcessing || undefined}
                    disabled={readOnly || aiProcessing}
                    onClick={startEditing}
                    onFocus={startEditing}
                    className={cn(
                        'block w-full min-w-64 border-0 border-l-1 bg-transparent text-left text-[2rem] font-semibold',
                        'px-2.5 py-1 pl-4.5 rounded-none',
                        'hover:not-disabled:border-l-4 hover:not-disabled:pl-3.75',
                        'focus:outline-none focus:ring-0 focus:ring-offset-0',
                        'disabled:select-none disabled:cursor-not-allowed',
                        aiProcessing && 'cursor-progress animate-text-shimmer',
                        touched ? 'whitespace-pre-wrap break-words' : 'truncate',
                        !aiProcessing && isShowingPlaceholder && 'text-subtle/50',
                        showErrorBorder
                            ? 'border-l-error focus:border-l-error'
                            : aiProcessing
                                ? 'border-l-bdr-select'
                                : 'border-l-bdr-subtle focus:border-l-ring',
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
                    aria-invalid={showErrorBorder || undefined}
                    rows={1}
                    onChange={handleEditorChange}
                    onFocus={handleEditorFocus}
                    onBlur={handleEditorBlur}
                    onKeyDown={handleEditorKeyDown}
                    disabled={readOnly}
                    className={cn(
                        'block w-full min-w-64 resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent',
                        'border-0 border-l-1 text-[2rem] font-semibold px-2.5 py-1 pl-4.5',
                        '[&:hover,&:focus]:border-l-4 [&:hover,&:focus]:pl-3.75 placeholder:text-subtle/50 rounded-none',
                        'transition-highlight focus:outline-none disabled:select-none disabled:cursor-not-allowed',
                        'focus:ring-0 focus:ring-offset-0 focus:border-transparent',
                        showErrorBorder ? 'border-l-error focus:border-l-error' : 'border-l-bdr-subtle focus:border-l-ring',
                    )}
                />
            )}
            <FieldError className="mt-2" message={visibleError} />
        </div>
    );
};

DisplayNameInput.displayName = DISPLAY_NAME_INPUT_NAME;
