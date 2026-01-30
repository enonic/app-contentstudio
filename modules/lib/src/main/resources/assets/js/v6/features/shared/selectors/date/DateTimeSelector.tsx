import {Button, DatePicker, Input, TimePicker, usePrefixedId} from '@enonic/ui';
import {ReactElement, type RefObject, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {combineDateAndTime, formatDateTimeValue, getTimeFromDate, parseDateTimeInput} from '../../../utils/date/format';

export type DateTimeSelectorProps = {
    label?: string;
    placeholder?: string;
    defaultTimeValue?: string;
    initialValue?: Date;
    onChange?: (value: Date | undefined) => void;
    onError?: (error: string | undefined) => void;
    error?: string;
    className?: string;
    inputRef?: RefObject<HTMLInputElement>;
}

export const DateTimeSelector = ({
    label,
    placeholder,
    defaultTimeValue,
    initialValue,
    onChange,
    onError,
    error,
    className,
    inputRef: externalInputRef,
}: DateTimeSelectorProps): ReactElement => {
    const rootRef = useRef<HTMLDivElement>(null);
    const fallbackInputRef = useRef<HTMLInputElement>(null);
    const inputRef = externalInputRef ?? fallbackInputRef;
    const contentRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [valueDate, setValueDate] = useState<Date | null>(initialValue ?? null);
    const [valueTime, setValueTime] = useState<string | null>(
        initialValue ? getTimeFromDate(initialValue) : defaultTimeValue ?? null,
    );
    const [inputValue, setInputValue] = useState(() => formatDateTimeValue(initialValue ?? null, initialValue ? getTimeFromDate(initialValue) : null));
    const [draftDate, setDraftDate] = useState<Date | null>(valueDate);
    const [draftTime, setDraftTime] = useState<string | null>(valueTime);
    const okLabel = useI18n('field.ok');
    const invalidFormatError = useI18n('field.datetime.invalidFormat');
    const inputId = usePrefixedId(null, 'datetime-selector-input-');

    const focusGrid = (): void => {
        requestAnimationFrame(() => {
            const grid = contentRef.current?.querySelector('[role="grid"]');
            if (grid instanceof HTMLElement) {
                grid.focus();
            }
        });
    };

    useEffect(() => {
        if (open) {
            focusGrid();
        }
    }, [open]);


    const handleOpenChange = (nextOpen: boolean): void => {
        if (nextOpen) {
            setDraftDate(valueDate);
            setDraftTime(valueTime ?? defaultTimeValue ?? null);
        }
        setOpen(nextOpen);
    };

    const handleInputChange = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        const newValue = (event.target as HTMLInputElement).value;
        setInputValue(newValue);

        if (!newValue.trim()) {
            setValueDate(null);
            setValueTime(defaultTimeValue ?? null);
            onError?.(undefined);
            onChange?.(undefined);
            return;
        }

        const parsed = parseDateTimeInput(newValue);
        if (parsed) {
            setValueDate(parsed.date);
            setValueTime(parsed.time);
            onError?.(undefined);
            onChange?.(combineDateAndTime(parsed.date, parsed.time));
        } else {
            onError?.(invalidFormatError);
        }
    };

    const handleInputBlur = (): void => {
        if (!inputValue.trim()) {
            return;
        }

        const parsed = parseDateTimeInput(inputValue);
        if (parsed) {
            setInputValue(formatDateTimeValue(parsed.date, parsed.time));
        }
    };

    const handleInputKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Enter' || event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) {
                handleOpenChange(true);
            }
        }
    };

    const handleConfirm = (): void => {
        const date = draftDate ?? new Date();
        const time = draftTime ?? getTimeFromDate(date);
        setValueDate(date);
        setValueTime(time);
        setInputValue(formatDateTimeValue(date, time));
        onError?.(undefined);
        onChange?.(combineDateAndTime(date, time));
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleContentKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            handleOpenChange(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div
            ref={rootRef}
            className={`flex max-w-90 flex-1 flex-col gap-3 ${className ?? ''}`}
        >
            <DatePicker
                value={draftDate}
                onValueChange={setDraftDate}
                open={open}
                onOpenChange={handleOpenChange}
                closeOnSelect={false}
                focusOnCloseRef={inputRef}
                className='w-full'
            >
                <div ref={inputWrapperRef}>
                <Input
                    id={inputId}
                    ref={inputRef}
                    label={label}
                    placeholder={placeholder ?? 'YYYY-MM-DD hh:mm'}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    error={error}
                    className={'datetime-selector-input'}
                    endAddon={<DatePicker.Trigger className={'size-8'} aria-label='Open date and time picker' />}
                />
                </div>
                    <DatePicker.Content
                        ref={contentRef}
                        className='max-w-90'
                        align='end'
                        onKeyDown={handleContentKeyDown}
                        anchorRef={inputWrapperRef}
                    >
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col gap-2'>
                                <DatePicker.Header />
                                <div className='flex flex-col gap-2'>
                                    <DatePicker.Weekdays />
                                    <DatePicker.Grid />
                                </div>
                            </div>
                            <div className='border-bdr-subtle border-t pt-3'>
                                <div className='flex items-center justify-between gap-3'>
                                    <TimePicker
                                        value={draftTime}
                                        onValueChange={setDraftTime}
                                        referenceDate={draftDate ?? new Date()}
                                    >
                                        <div className='flex items-center gap-2'>
                                            <TimePicker.HourSelect className='w-20' />
                                            <span className='font-bold text-lg text-main'>:</span>
                                            <TimePicker.MinuteSelect className='w-20' />
                                        </div>
                                    </TimePicker>
                                    <Button size='sm' variant='solid' onClick={handleConfirm}>
                                        {okLabel}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DatePicker.Content>
            </DatePicker>
        </div>
    );
}

DateTimeSelector.displayName = 'DateTimeSelector';
