import {Input, InputProps, cn} from '@enonic/ui';
import type {ComponentPropsWithoutRef, ReactElement} from 'react';
import {useEffect, useRef, useState} from 'react';
import {useI18n} from '../hooks/useI18n';
import {useConfirmationDialog} from './ConfirmationDialog';

const ERROR_DELAY_MS = 500;

export type GateHintProps = ComponentPropsWithoutRef<'p'> & {
    value: string | number;
};

export type GateInputProps = {
    validate?: (value: string) => boolean;
    normalize?: (value: string) => string;
    expected?: string | number;
} & InputProps;

export const GateRoot = ({className, children, ...props}: ComponentPropsWithoutRef<'div'>): ReactElement => (
    <div className={cn('flex flex-col gap-2.5 p-7.5 bg-surface-primary rounded-lg', className)} {...props}>
        {children}
    </div>
);
GateRoot.displayName = 'Gate.Root';

export const GateHint = ({value, className, ...props}: GateHintProps): ReactElement => {
    const enter = useI18n('dialog.confirmValue.enterValue');
    const ending = useI18n('dialog.confirmValue.enterValue.ending');

    // TODO: Enonic UI - Make it possible to pass components to i18n hook
    // It might be useful for languages, where {value} can be placed differently
    return (
        <p className={cn('text-xl', className)} {...props}>
            {enter} <strong>{value}</strong> {ending}
        </p>
    );
};
GateHint.displayName = 'Gate.Hint';

const defaultNormalize = (value: string): string => value.trim();

export const GateInput = ({
    validate,
    normalize = defaultNormalize,
    expected,
    className,
    autoFocus,
    ...props
}: GateInputProps): ReactElement => {
    const {setConfirmEnabled} = useConfirmationDialog();
    const [value, setValue] = useState<string>('');
    const [showError, setShowError] = useState<boolean>(false);
    const timerRef = useRef<number | undefined>(undefined);

    const entered = normalize(value);
    const hasValue = entered !== '';
    const expectedValue = String(expected ?? '');
    const valid = validate ? validate(entered) : entered === expectedValue;

    useEffect(() => {
        setConfirmEnabled(valid);
    }, [valid, setConfirmEnabled]);

    useEffect(() => {
        if (!hasValue || valid) {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = undefined;
            }
            setShowError(false);
            return;
        }
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => setShowError(true), ERROR_DELAY_MS);
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = undefined;
            }
        };
    }, [hasValue, valid, value]);

    useEffect(() => () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
    }, []);

    const errorMismatch = useI18n('dialog.confirmValue.error.mismatch', expectedValue, entered);
    const errorMessage = showError && hasValue && expected !== undefined && !valid ? errorMismatch : undefined;

    return (
        <Input
            value={value}
            onChange={(e) => {
                setShowError(false);
                setValue(e.currentTarget.value);
            }}
            readOnly={valid}
            inputMode='numeric'
            autoFocus={autoFocus}
            error={errorMessage}
            className={cn('w-1/2', className)}
            {...props}
        />
    );
};
GateInput.displayName = 'Gate.Input';

export const Gate = {
    Root: GateRoot,
    Hint: GateHint,
    Input: GateInput,
};

