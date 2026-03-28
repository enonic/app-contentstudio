import {Button, Dialog, Input, Selector} from '@enonic/ui';
import type {Value} from '@enonic/lib-admin-ui/data/Value';
import {LongInput} from '@enonic/lib-admin-ui/form2';
import {useStore} from '@nanostores/preact';
import {type FormEvent, type ReactElement, useLayoutEffect, useRef} from 'react';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import type {DialogOverrides} from '../form/input-types/html-area/setupEditor';
import {useI18n} from '../../hooks/useI18n';
import {
    $tableDialog,
    TABLE_DIALOG_HEADER_NONE_VALUE,
    TABLE_DIALOG_COLS_LONG_INPUT,
    TABLE_DIALOG_LONG_INPUT_CONFIG,
    TABLE_DIALOG_ROWS_LONG_INPUT,
    closeTableDialog,
    finalizeTableDialogClose,
    isTableDialogSubmittable,
    openTableDialog,
    setTableDialogCaption,
    setTableDialogCols,
    setTableDialogHeaders,
    setTableDialogRows,
    submitTableDialog,
    toExternalTableDialogHeaderValue,
    toInternalTableDialogHeaderValue,
    toTableDialogLongInputErrors,
    toTableDialogLongInputNextValue,
    toTableDialogLongInputValue,
    validateTableDialogField,
} from '../../store/dialogs/tableDialog.store';

const TABLE_DIALOG_NAME = 'TableDialog';

const getLongInputElement = (container: HTMLDivElement | null): HTMLInputElement | null => {
    return container?.querySelector('input') ?? null;
};

type LongInputValueCache = {
    rawValue: string;
    value: Value;
};

const useStableLongInputValue = (rawValue: string): Value => {
    const cacheRef = useRef<LongInputValueCache | null>(null);

    if (!cacheRef.current || cacheRef.current.rawValue !== rawValue) {
        cacheRef.current = {
            rawValue,
            value: toTableDialogLongInputValue(rawValue),
        };
    }

    return cacheRef.current.value;
};

export const TableDialog = (): ReactElement => {
    const {open, mode, rows, cols, headers, caption, validationErrors} = useStore($tableDialog, {
        keys: ['open', 'mode', 'rows', 'cols', 'headers', 'caption', 'validationErrors'],
    });
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const rowsInputContainerRef = useRef<HTMLDivElement | null>(null);
    const colsInputContainerRef = useRef<HTMLDivElement | null>(null);
    const headersTriggerRef = useRef<HTMLButtonElement | null>(null);
    const captionInputRef = useRef<HTMLInputElement | null>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const title = useI18n('dialog.table.title');
    const rowsLabel = useI18n('dialog.table.formitem.rows');
    const columnsLabel = useI18n('dialog.table.formitem.columns');
    const headersLabel = useI18n('dialog.table.formitem.headers');
    const captionLabel = useI18n('dialog.table.formitem.caption');
    const headerNoneLabel = useI18n('dialog.table.headers.none');
    const headerRowLabel = useI18n('dialog.table.headers.row');
    const headerColumnLabel = useI18n('dialog.table.headers.col');
    const headerBothLabel = useI18n('dialog.table.headers.both');
    const submitLabel = useI18n('action.ok');

    const isPropertiesMode = mode === 'tableProperties';
    const rowsLongInputValue = useStableLongInputValue(rows);
    const colsLongInputValue = useStableLongInputValue(cols);
    const isSubmitDisabled = !isTableDialogSubmittable(mode, rows, cols);
    const headerLabels = {
        [TABLE_DIALOG_HEADER_NONE_VALUE]: headerNoneLabel,
        row: headerRowLabel,
        col: headerColumnLabel,
        both: headerBothLabel,
    };
    const headerOptions = Object.entries(headerLabels).map(([value, label]) => ({value, label}));
    const selectedHeaderValue = toInternalTableDialogHeaderValue(headers);

    useLayoutEffect(() => {
        if (!open || !contentRef.current) {
            return;
        }

        const {editor} = $tableDialog.get();

        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = [
            contentRef.current,
            closeButtonRef.current,
            getLongInputElement(rowsInputContainerRef.current),
            getLongInputElement(colsInputContainerRef.current),
            headersTriggerRef.current,
            captionInputRef.current,
            submitButtonRef.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement | HTMLInputElement => !!element);

        const ckElements = elements.map((element) => new CKEDITOR.dom.element(element));

        ckElements.forEach((element) => editor.focusManager.add(element, true));

        return () => {
            if (editor['destroyed']) {
                return;
            }

            ckElements.forEach((element) => editor.focusManager.remove(element));
        };
    }, [open, isPropertiesMode]);

    const focusInitialElement = (): void => {
        if (isPropertiesMode) {
            headersTriggerRef.current?.focus({focusVisible: true});
            return;
        }

        getLongInputElement(rowsInputContainerRef.current)?.focus({focusVisible: true});
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        submitTableDialog();
    };

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            closeTableDialog();
        }
    };

    const preventOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        focusInitialElement();
    };

    const handleCloseAutoFocus = (event: Event): void => {
        event.preventDefault();
        requestAnimationFrame(finalizeTableDialogClose);
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    ref={contentRef}
                    onOpenAutoFocus={preventOpenAutoFocus}
                    onCloseAutoFocus={handleCloseAutoFocus}
                    className='w-full gap-5.5 h-fit py-5 px-3 sm:py-10 sm:px-8 max-w-full md:max-w-160'
                    data-component={TABLE_DIALOG_NAME}
                >
                    <Dialog.Header className='px-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5'>
                        <Dialog.Title className='col-start-1 row-start-1 min-w-0 font-semibold text-2xl'>{title}</Dialog.Title>
                        <Dialog.DefaultClose
                            ref={closeButtonRef}
                            className='col-start-2 row-start-1 self-start justify-self-end'
                        />
                    </Dialog.Header>
                    <form className='contents' onSubmit={handleSubmit}>
                        <Dialog.Body className='grid gap-4 p-2 md:grid-cols-2'>
                            <label className='flex flex-col gap-2.5'>
                                <span className='font-semibold'>{rowsLabel}</span>
                                <div ref={rowsInputContainerRef}>
                                    <LongInput
                                        value={rowsLongInputValue}
                                        onChange={(value, rawValue) => {
                                            setTableDialogRows(toTableDialogLongInputNextValue(value, rawValue));
                                        }}
                                        onBlur={() => {
                                            validateTableDialogField('rows');
                                        }}
                                        config={TABLE_DIALOG_LONG_INPUT_CONFIG}
                                        input={TABLE_DIALOG_ROWS_LONG_INPUT}
                                        enabled={!isPropertiesMode}
                                        index={0}
                                        errors={toTableDialogLongInputErrors(validationErrors.rows)}
                                    />
                                </div>
                            </label>
                            <label className='flex flex-col gap-2.5'>
                                <span className='font-semibold'>{columnsLabel}</span>
                                <div ref={colsInputContainerRef}>
                                    <LongInput
                                        value={colsLongInputValue}
                                        onChange={(value, rawValue) => {
                                            setTableDialogCols(toTableDialogLongInputNextValue(value, rawValue));
                                        }}
                                        onBlur={() => {
                                            validateTableDialogField('cols');
                                        }}
                                        config={TABLE_DIALOG_LONG_INPUT_CONFIG}
                                        input={TABLE_DIALOG_COLS_LONG_INPUT}
                                        enabled={!isPropertiesMode}
                                        index={0}
                                        errors={toTableDialogLongInputErrors(validationErrors.cols)}
                                    />
                                </div>
                            </label>
                            <div className='flex flex-col gap-2.5 md:col-span-2'>
                                <span className='font-semibold'>{headersLabel}</span>
                                <Selector.Root
                                    value={selectedHeaderValue}
                                    onValueChange={(value) => {
                                        setTableDialogHeaders(toExternalTableDialogHeaderValue(value));
                                    }}
                                >
                                    <Selector.Trigger ref={headersTriggerRef} aria-label={headersLabel}>
                                        <Selector.Value placeholder={headerNoneLabel}>
                                            {(value) => headerLabels[value] ?? headerNoneLabel}
                                        </Selector.Value>
                                        <Selector.Icon />
                                    </Selector.Trigger>
                                    <Selector.Content portal={false} onPointerDown={(event) => event.stopPropagation()}>
                                        <Selector.Viewport>
                                            {headerOptions.map((option) => (
                                                <Selector.Item
                                                    key={option.value}
                                                    value={option.value}
                                                    textValue={option.label}
                                                >
                                                    <Selector.ItemText>{option.label}</Selector.ItemText>
                                                    <Selector.ItemIndicator />
                                                </Selector.Item>
                                            ))}
                                        </Selector.Viewport>
                                    </Selector.Content>
                                </Selector.Root>
                            </div>
                            <div className='md:col-span-2'>
                                <Input
                                    ref={captionInputRef}
                                    label={captionLabel}
                                    value={caption}
                                    onChange={(event) => {
                                        setTableDialogCaption(event.currentTarget.value);
                                    }}
                                />
                            </div>
                        </Dialog.Body>
                        <Dialog.Footer className='px-2'>
                            <Button
                                ref={submitButtonRef}
                                type='submit'
                                size='lg'
                                variant='solid'
                                label={submitLabel}
                                disabled={isSubmitDisabled}
                            />
                        </Dialog.Footer>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

TableDialog.displayName = TABLE_DIALOG_NAME;

export function createTableDialogOverride(): DialogOverrides {
    return {
        [HtmlAreaDialogType.TABLE]: (event: CreateHtmlAreaDialogEvent) => {
            openTableDialog(event.getConfig() as CKEDITOR.eventInfo);
        },
    };
}
