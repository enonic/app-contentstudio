import {Button, Checkbox, cn, IconButton, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ArrowDown, ArrowUp} from 'lucide-react';
import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import {suppressHtmlAreaBlur} from '../../../../app/inputtype/ui/text/HtmlAreaOverlayState';
import {useI18n} from '../../hooks/useI18n';
import {
    $searchPopup,
    closeSearchPopup,
    getSearchPopupTriggerElement,
    goToNextSearchPopupResult,
    goToPreviousSearchPopupResult,
    replaceAllSearchPopupResults,
    replaceCurrentSearchPopupResult,
    setSearchPopupFindValue,
    setSearchPopupMatchCase,
    setSearchPopupMode,
    setSearchPopupReplaceValue,
    setSearchPopupWholeWords,
} from '../../store/dialogs/searchPopup.store';

const SEARCH_POPUP_NAME = 'SearchPopup';
const POPUP_OFFSET = 8;
const VIEWPORT_OFFSET = 8;

type PopupPosition = {
    top: number;
    left: number;
    side: 'top' | 'bottom';
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

const getCheckboxElement = (container: HTMLDivElement | null): HTMLButtonElement | HTMLInputElement | null => {
    const element = container?.querySelector('button, input, [role="checkbox"]');

    return element instanceof HTMLButtonElement || element instanceof HTMLInputElement ? element : null;
};

const preventButtonMouseDown = (event: MouseEvent<HTMLButtonElement>): void => {
    suppressHtmlAreaBlur($searchPopup.get().editor);
    event.preventDefault();
};

const isActivationKey = (key: string): boolean => key === 'Enter' || key === ' ';

const focusElement = (element: HTMLButtonElement | HTMLInputElement | null): void => {
    element?.focus({preventScroll: true});
};

export const SearchPopup = (): ReactElement | null => {
    const {
        open,
        mode,
        findValue,
        replaceValue,
        matchCase,
        wholeWords,
        total,
        currentIndex,
        replacedCount,
        triggerButtonId,
        editor,
    } = useStore($searchPopup, {
        keys: [
            'open',
            'mode',
            'findValue',
            'replaceValue',
            'matchCase',
            'wholeWords',
            'total',
            'currentIndex',
            'replacedCount',
            'triggerButtonId',
            'editor',
        ],
    });
    const popupRef = useRef<HTMLDivElement | null>(null);
    const toggleModeButtonRef = useRef<HTMLButtonElement | null>(null);
    const findInputRef = useRef<HTMLInputElement | null>(null);
    const matchCaseRef = useRef<HTMLDivElement | null>(null);
    const wholeWordsRef = useRef<HTMLDivElement | null>(null);
    const previousButtonRef = useRef<HTMLButtonElement | null>(null);
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const replaceInputRef = useRef<HTMLInputElement | null>(null);
    const replaceButtonRef = useRef<HTMLButtonElement | null>(null);
    const replaceAllButtonRef = useRef<HTMLButtonElement | null>(null);
    const [position, setPosition] = useState<PopupPosition | null>(null);

    const title = useI18n('dialog.search.title');
    const findLabel = useI18n('dialog.search.find');
    const findPlaceholder = useI18n('dialog.search.find.tooltip');
    const replaceLabel = useI18n('dialog.search.replace');
    const replacePlaceholder = useI18n('dialog.search.replace.tooltip');
    const replaceAllLabel = useI18n('dialog.search.replaceAll');
    const matchCaseLabel = useI18n('dialog.search.matchcase');
    const wholeWordsLabel = useI18n('dialog.search.wholewords');
    const previousLabel = useI18n('dialog.search.find.previous');
    const nextLabel = useI18n('dialog.search.find.next');
    const switchLabel = useI18n('dialog.search.switch');
    const counterLabel = replacedCount != null
        ? useI18n('dialog.search.result.replaced', replacedCount)
        : total === 0
            ? useI18n('dialog.search.result.noResults')
            : useI18n('dialog.search.result.entries', currentIndex + 1, total);
    const isReplaceMode = mode === 'replace';
    const isPreviousDisabled = total === 0 || currentIndex === 0;
    const isNextDisabled = total === 0 || currentIndex >= total - 1;
    const isReplaceDisabled = total === 0;

    const isWithinPopupContext = (target: Node | null): boolean => {
        if (!target) {
            return false;
        }

        const anchorElement = getSearchPopupTriggerElement(triggerButtonId, editor);
        const editorContainer = editor?.container?.$;

        return popupRef.current?.contains(target) ||
            anchorElement?.contains(target) ||
            editorContainer?.contains(target) ||
            false;
    };

    useLayoutEffect(() => {
        if (!open || !popupRef.current || !editor || editor['destroyed']) {
            return;
        }

        const elements = [
            popupRef.current,
            toggleModeButtonRef.current,
            findInputRef.current,
            getCheckboxElement(matchCaseRef.current),
            getCheckboxElement(wholeWordsRef.current),
            previousButtonRef.current,
            nextButtonRef.current,
            replaceInputRef.current,
            replaceButtonRef.current,
            replaceAllButtonRef.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement | HTMLInputElement => !!element);

        const ckElements = elements.map((element) => new CKEDITOR.dom.element(element));

        ckElements.forEach((element) => editor.focusManager.add(element, true));

        return () => {
            if (editor['destroyed']) {
                return;
            }

            ckElements.forEach((element) => editor.focusManager.remove(element));
        };
    }, [open, editor, isReplaceMode]);

    useEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }

        const popupElement = popupRef.current;
        const anchorElement = getSearchPopupTriggerElement(triggerButtonId, editor);

        if (!popupElement || !anchorElement) {
            closeSearchPopup();
            return;
        }

        const updatePosition = (): void => {
            if (!popupRef.current) {
                return;
            }

            const nextAnchorElement = getSearchPopupTriggerElement(triggerButtonId, editor);

            if (!nextAnchorElement) {
                closeSearchPopup();
                return;
            }

            const popupRect = popupRef.current.getBoundingClientRect();
            const anchorRect = nextAnchorElement.getBoundingClientRect();
            const maxLeft = Math.max(VIEWPORT_OFFSET, window.innerWidth - popupRect.width - VIEWPORT_OFFSET);
            const left = clamp(
                editor?.lang.dir === 'rtl' ? anchorRect.right - popupRect.width : anchorRect.left,
                VIEWPORT_OFFSET,
                maxLeft,
            );
            const placeAbove =
                window.innerHeight - anchorRect.bottom < popupRect.height + POPUP_OFFSET &&
                anchorRect.top > popupRect.height + POPUP_OFFSET;
            const top = placeAbove
                ? Math.max(VIEWPORT_OFFSET, anchorRect.top - popupRect.height - POPUP_OFFSET)
                : Math.min(window.innerHeight - popupRect.height - VIEWPORT_OFFSET, anchorRect.bottom + POPUP_OFFSET);

            setPosition({
                top,
                left,
                side: placeAbove ? 'top' : 'bottom',
            });
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, editor, triggerButtonId, isReplaceMode]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const editable = editor?.editable();

        const handleClose = (): void => {
            closeSearchPopup();
        };

        const handleFocusIn = (event: FocusEvent): void => {
            const target = event.target as Node | null;

            if (!target || isWithinPopupContext(target)) {
                return;
            }

            handleClose();
        };

        const handlePointerDown = (event: PointerEvent): void => {
            const target = event.target as Node | null;

            if (!target || isWithinPopupContext(target)) {
                return;
            }

            handleClose();
        };

        const handleWindowBlur = (): void => {
            handleClose();
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('blur', handleWindowBlur);
        editable?.on('mousedown', handleClose);
        editor?.on('destroy', handleClose);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('blur', handleWindowBlur);
            editable?.removeListener('mousedown', handleClose);
            editor?.removeListener('destroy', handleClose);
        };
    }, [open, editor, triggerButtonId]);

    useEffect(() => {
        if (!open) {
            return;
        }

        requestAnimationFrame(() => {
            findInputRef.current?.focus({preventScroll: true});
        });
    }, [open]);

    const handleEscape = (event: KeyboardEvent<HTMLElement>): void => {
        if (event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        closeSearchPopup({focusTrigger: true});
    };

    const handleFindInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            suppressHtmlAreaBlur(editor);

            if (event.shiftKey) {
                goToPreviousSearchPopupResult();
                return;
            }

            goToNextSearchPopupResult();
            return;
        }

        handleEscape(event);
    };

    const handleReplaceInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            suppressHtmlAreaBlur(editor);
            replaceCurrentSearchPopupResult();
            return;
        }

        handleEscape(event);
    };

    const handleToggleMode = (): void => {
        suppressHtmlAreaBlur(editor);
        setSearchPopupMode(isReplaceMode ? 'find' : 'replace');
    };

    const queueFocus = (element: HTMLButtonElement | HTMLInputElement | null): void => {
        requestAnimationFrame(() => {
            focusElement(element);
        });
    };

    const queueNavigationFocus = (button: HTMLButtonElement | null): void => {
        queueFocus(button && !button.disabled ? button : findInputRef.current);
    };

    const queueReplaceFocus = (button: HTMLButtonElement | null): void => {
        queueFocus(button && !button.disabled ? button : replaceInputRef.current ?? findInputRef.current);
    };

    const handlePreviousClick = (): void => {
        suppressHtmlAreaBlur(editor);
        goToPreviousSearchPopupResult();
        queueNavigationFocus(previousButtonRef.current);
    };

    const handleNextClick = (): void => {
        suppressHtmlAreaBlur(editor);
        goToNextSearchPopupResult();
        queueNavigationFocus(nextButtonRef.current);
    };

    const handleReplaceClick = (): void => {
        suppressHtmlAreaBlur(editor);
        focusElement(replaceInputRef.current ?? findInputRef.current);
        replaceCurrentSearchPopupResult();
        queueReplaceFocus(replaceButtonRef.current);
    };

    const handleReplaceAllClick = (): void => {
        suppressHtmlAreaBlur(editor);
        focusElement(replaceInputRef.current ?? findInputRef.current);
        replaceAllSearchPopupResults();
        queueFocus(findInputRef.current);
    };

    const handleActionButtonKeyDown = (
        event: KeyboardEvent<HTMLButtonElement>,
        action: () => void,
    ): void => {
        if (!isActivationKey(event.key)) {
            handleEscape(event);
            return;
        }

        event.preventDefault();
        action();
    };

    if (!open) {
        return null;
    }

    return (
        <div
            ref={popupRef}
            role='dialog'
            aria-label={title}
            tabIndex={-1}
            data-component={SEARCH_POPUP_NAME}
            data-side={position?.side}
            className={cn(
                'fixed z-50 flex w-88 max-w-[calc(100vw-1rem)] flex-col gap-3 rounded-sm border border-bdr-subtle bg-surface-neutral p-3 shadow-lg outline-none',
                'data-[side=top]:origin-bottom data-[side=bottom]:origin-top',
                'data-[side=top]:animate-in data-[side=bottom]:animate-in',
                'data-[side=top]:fade-in-0 data-[side=bottom]:fade-in-0',
                'data-[side=top]:zoom-in-95 data-[side=bottom]:zoom-in-95',
                !position && 'pointer-events-none opacity-0',
            )}
            style={position ? ({top: position.top, left: position.left} as CSSProperties) : undefined}
            onKeyDownCapture={handleEscape}
        >
            <div className='flex items-center gap-2'>
                <Button
                    ref={toggleModeButtonRef}
                    type='button'
                    size='sm'
                    variant='outline'
                    label={isReplaceMode ? findLabel : replaceLabel}
                    title={switchLabel}
                    className='shrink-0'
                    onMouseDown={preventButtonMouseDown}
                    onClick={handleToggleMode}
                    onKeyDown={(event) => handleActionButtonKeyDown(event, handleToggleMode)}
                />
                <div className='min-w-0 flex-1 text-xs leading-tight font-medium text-subtle'>{counterLabel}</div>
                <div className='ml-auto flex items-center gap-1'>
                    <IconButton
                        ref={previousButtonRef}
                        size='sm'
                        variant='text'
                        icon={ArrowUp}
                        aria-label={previousLabel}
                        title={previousLabel}
                        disabled={isPreviousDisabled}
                        className='shrink-0'
                        onMouseDown={preventButtonMouseDown}
                        onClick={handlePreviousClick}
                        onKeyDown={(event) => handleActionButtonKeyDown(event, handlePreviousClick)}
                    />
                    <IconButton
                        ref={nextButtonRef}
                        size='sm'
                        variant='text'
                        icon={ArrowDown}
                        aria-label={nextLabel}
                        title={nextLabel}
                        disabled={isNextDisabled}
                        className='shrink-0'
                        onMouseDown={preventButtonMouseDown}
                        onClick={handleNextClick}
                        onKeyDown={(event) => handleActionButtonKeyDown(event, handleNextClick)}
                    />
                </div>
            </div>
            <Input
                ref={findInputRef}
                aria-label={findLabel}
                value={findValue}
                placeholder={findPlaceholder}
                onChange={(event) => {
                    setSearchPopupFindValue(event.currentTarget.value);
                }}
                onKeyDown={handleFindInputKeyDown}
            />
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                <div ref={matchCaseRef}>
                    <Checkbox
                        className='text-xs font-medium'
                        checked={matchCase}
                        label={matchCaseLabel}
                        onCheckedChange={(checked) => {
                            setSearchPopupMatchCase(checked === true);
                        }}
                    />
                </div>
                <div ref={wholeWordsRef}>
                    <Checkbox
                        className='text-xs font-medium'
                        checked={wholeWords}
                        label={wholeWordsLabel}
                        onCheckedChange={(checked) => {
                            setSearchPopupWholeWords(checked === true);
                        }}
                    />
                </div>
            </div>
            {isReplaceMode && (
                <>
                    <Input
                        ref={replaceInputRef}
                        aria-label={replaceLabel}
                        value={replaceValue}
                        placeholder={replacePlaceholder}
                        onChange={(event) => {
                            setSearchPopupReplaceValue(event.currentTarget.value);
                        }}
                        onKeyDown={handleReplaceInputKeyDown}
                    />
                    <div className='flex items-center justify-end gap-2'>
                        <Button
                            ref={replaceButtonRef}
                            type='button'
                            size='sm'
                            variant='outline'
                            label={replaceLabel}
                            disabled={isReplaceDisabled}
                            onMouseDown={preventButtonMouseDown}
                            onClick={handleReplaceClick}
                            onKeyDown={(event) => handleActionButtonKeyDown(event, handleReplaceClick)}
                        />
                        <Button
                            ref={replaceAllButtonRef}
                            type='button'
                            size='sm'
                            variant='solid'
                            label={replaceAllLabel}
                            disabled={isReplaceDisabled}
                            onMouseDown={preventButtonMouseDown}
                            onClick={handleReplaceAllClick}
                            onKeyDown={(event) => handleActionButtonKeyDown(event, handleReplaceAllClick)}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

SearchPopup.displayName = SEARCH_POPUP_NAME;
