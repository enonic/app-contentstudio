import {Button, Checkbox, cn, IconButton, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ArrowDown, ArrowUp} from 'lucide-react';
import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {suppressHtmlAreaBlur} from '../../../../app/inputtype/ui/text/HtmlAreaOverlayState';
import type {SearchPopupParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';
import type {DialogOverrides} from '../form/input-types/html-area/setupEditor';
import {useCkEditorFocusManager} from '../../hooks/htmlarea/useCkEditorFocusManager';
import {useI18n} from '../../hooks/useI18n';
import {usePopupDismiss} from '../../hooks/htmlarea/usePopupDismiss';
import {usePopupPosition} from '../../hooks/htmlarea/usePopupPosition';
import {
    $searchPopup,
    closeSearchPopup,
    getSearchPopupTriggerElement,
    goToNextSearchPopupResult,
    goToPreviousSearchPopupResult,
    openSearchPopup,
    replaceAllSearchPopupResults,
    replaceCurrentSearchPopupResult,
    setSearchPopupFindValue,
    setSearchPopupMatchCase,
    setSearchPopupMode,
    setSearchPopupReplaceValue,
    setSearchPopupWholeWords,
} from '../../store/dialogs/searchPopup.store';

const SEARCH_POPUP_NAME = 'SearchPopup';

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
    const replacedLabel = useI18n('dialog.search.result.replaced', replacedCount ?? 0);
    const noResultsLabel = useI18n('dialog.search.result.noResults');
    const entriesLabel = useI18n('dialog.search.result.entries', currentIndex + 1, total);
    const counterLabel = replacedCount != null ? replacedLabel : total === 0 ? noResultsLabel : entriesLabel;
    const isReplaceMode = mode === 'replace';
    const isPreviousDisabled = total === 0 || currentIndex === 0;
    const isNextDisabled = total === 0 || currentIndex >= total - 1;
    const isReplaceDisabled = total === 0;

    const getAnchorElement = useCallback(
        () => getSearchPopupTriggerElement(triggerButtonId, editor),
        [triggerButtonId, editor],
    );

    useCkEditorFocusManager(
        editor,
        [
            popupRef,
            toggleModeButtonRef,
            findInputRef,
            getCheckboxElement(matchCaseRef.current),
            getCheckboxElement(wholeWordsRef.current),
            previousButtonRef,
            nextButtonRef,
            replaceInputRef,
            replaceButtonRef,
            replaceAllButtonRef,
        ],
        [open, isReplaceMode],
    );

    const position = usePopupPosition({
        open,
        popupRef,
        getAnchorElement,
        isRtl: editor?.lang.dir === 'rtl',
        deps: [triggerButtonId, isReplaceMode],
        onMissingAnchor: closeSearchPopup,
    });

    usePopupDismiss({
        open,
        popupRef,
        editor,
        getAnchorElement,
        onClose: closeSearchPopup,
        deps: [triggerButtonId],
    });

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

export function createSearchPopupOverride(): DialogOverrides {
    return {
        [HtmlAreaDialogType.SEARCH_POPUP]: (event: CreateHtmlAreaDialogEvent) => {
            openSearchPopup(event.getConfig() as SearchPopupParams);
        },
    };
}
