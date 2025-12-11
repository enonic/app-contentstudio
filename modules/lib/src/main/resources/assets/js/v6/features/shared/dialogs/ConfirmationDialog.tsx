import {Button, Dialog, cn} from '@enonic/ui';
import type {ComponentPropsWithoutRef, ReactElement, ReactNode} from 'react';
import {createContext, forwardRef, useContext, useMemo, useState} from 'react';
import {useI18n} from '../../hooks/useI18n';

//
// * ConfirmationDialogContext
//

type ConfirmationDialogContextValue = {
    confirmEnabled: boolean;
    setConfirmEnabled: (confirmEnabled: boolean) => void;
};

const ConfirmationDialogContext = createContext<ConfirmationDialogContextValue | null>(null);

export const useConfirmationDialog = (): ConfirmationDialogContextValue => {
    const ctx = useContext(ConfirmationDialogContext);
    if (!ctx) {
        throw new Error('useConfirmationDialog must be used within a ConfirmationDialogProvider');
        // return {confirmEnabled: true, setConfirmEnabled: () => void 0};
    }
    return ctx;
};

type ConfirmationDialogProviderProps = {
    defaultConfirmEnabled?: boolean;
    children?: ReactNode;
};

const ConfirmationDialogProvider = ({defaultConfirmEnabled = true, children}: ConfirmationDialogProviderProps): ReactElement => {
    const [confirmEnabled, setConfirmEnabled] = useState<boolean>(defaultConfirmEnabled);

    const value = useMemo<ConfirmationDialogContextValue>(() => ({confirmEnabled, setConfirmEnabled}), [confirmEnabled]);

    return <ConfirmationDialogContext.Provider value={value}>{children}</ConfirmationDialogContext.Provider>;
};

//
// * ConfirmationDialogContent
//

export type ConfirmationDialogContentProps = {
    defaultConfirmEnabled?: boolean;
    className?: string;
    children?: ReactNode;
} & ComponentPropsWithoutRef<typeof Dialog.Content>;

const ConfirmationDialogContent = forwardRef<HTMLDivElement, ConfirmationDialogContentProps>(
    ({defaultConfirmEnabled = true, className, children, ...props}, ref): ReactElement => {
        return (
            <Dialog.Content ref={ref}
                className={cn('max-w-180 w-fit sm:min-w-152 text-main gap-2.5', className)} {...props}>
                <ConfirmationDialogProvider defaultConfirmEnabled={defaultConfirmEnabled}>{children}</ConfirmationDialogProvider>
            </Dialog.Content>
        );
    }
);
ConfirmationDialogContent.displayName = 'ConfirmationDialog.Content';


//
// * ConfirmationDialogFooter
//

export type ConfirmationDialogFooterProps = {
    onCancel?: () => void;
    onConfirm?: () => void;
    intent?: 'default' | 'danger';
    className?: string;
} & ComponentPropsWithoutRef<'footer'>;

const ConfirmationDialogFooter = forwardRef<HTMLButtonElement, ConfirmationDialogFooterProps>(({
    onCancel,
    onConfirm,
    intent = 'default',
    className,
    ...props
}, ref): ReactElement => {
    const {confirmEnabled} = useConfirmationDialog();

    const cancel = useI18n('action.cancel');
    const confirm = useI18n('action.confirm');

    return (
        <Dialog.Footer {...props}>
            <Dialog.Close asChild>
                <Button size='lg' label={cancel} variant='outline' onClick={onCancel} />
            </Dialog.Close>
            <Dialog.Close asChild>
                <Button ref={ref}
                    onClick={onConfirm}
                    disabled={!confirmEnabled}
                    size='lg'
                    label={confirm}
                    variant='solid'
                    className={cn(intent === 'danger' && 'bg-btn-error text-alt hover:bg-btn-error-hover active:bg-btn-error-active focus-visible:ring-error/50')}
                />
            </Dialog.Close>
        </Dialog.Footer>
    );
});
ConfirmationDialogFooter.displayName = 'ConfirmationDialog.Footer';

export const ConfirmationDialog = {
    ...Dialog,
    Content: ConfirmationDialogContent,
    Footer: ConfirmationDialogFooter,
};
