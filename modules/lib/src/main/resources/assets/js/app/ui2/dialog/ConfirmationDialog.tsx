import {Button, Dialog, cn} from '@enonic/ui';
import type {ComponentPropsWithoutRef, ReactElement, ReactNode} from 'react';
import {createContext, useContext, useMemo, forwardRef, useState} from 'react';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {useI18n} from '../hooks/useI18n';

//
// * ConfirmationDialogContext
//

type ConfirmationDialogContextValue = {
    submitEnabled: boolean;
    setSubmitEnabled: (submitEnabled: boolean) => void;
};

const ConfirmationDialogContext = createContext<ConfirmationDialogContextValue | null>(null);

export const useConfirmationDialog = (): ConfirmationDialogContextValue => {
    const ctx = useContext(ConfirmationDialogContext);
    if (!ctx) {
        return {submitEnabled: true, setSubmitEnabled: () => void 0};
    }
    return ctx;
};

type ConfirmationDialogProviderProps = {
    defaultSubmitEnabled?: boolean;
    children?: ReactNode;
};

const ConfirmationDialogProvider = ({defaultSubmitEnabled = true, children}: ConfirmationDialogProviderProps): ReactElement => {
    const [submitEnabled, setSubmitEnabled] = useState<boolean>(defaultSubmitEnabled);

    const value = useMemo<ConfirmationDialogContextValue>(() => ({submitEnabled, setSubmitEnabled}), [submitEnabled]);

    return <ConfirmationDialogContext.Provider value={value}>{children}</ConfirmationDialogContext.Provider>;
};

//
// * ConfirmationDialogContent
//

export type ConfirmationDialogContentProps = {
    defaultSubmitEnabled?: boolean;
    className?: string;
    children?: ReactNode;
} & ComponentPropsWithoutRef<typeof Dialog.Content>;

const ConfirmationDialogContent = forwardRef<HTMLDivElement, ConfirmationDialogContentProps>(
    ({defaultSubmitEnabled = true, className, children, ...props}, ref): ReactElement => {
        return (
            <Dialog.Content ref={ref}
                            className={cn('gap-3 min-w-170 max-w-fit', className)} {...props}>
                <ConfirmationDialogProvider defaultSubmitEnabled={defaultSubmitEnabled}>{children}</ConfirmationDialogProvider>
            </Dialog.Content>
        );
    }
);
ConfirmationDialogContent.displayName = 'ConfirmationDialog.Content';

//
// * ConfirmationDialogFooter
//

export type ConfirmationDialogFooterProps = {
    cancelLabel?: ReactNode;
    submitLabel?: ReactNode;
    onCancel?: () => void;
    onSubmit?: () => void;
    intent?: 'default' | 'danger';
    className?: string;
} & ComponentPropsWithoutRef<'footer'>;

const ConfirmationDialogFooter = ({
    onCancel,
    onSubmit,
    intent = 'default',
    className,
    ...props
}: ConfirmationDialogFooterProps): ReactElement => {
    const {submitEnabled} = useConfirmationDialog();

    const cancel = useI18n('action.cancel');
    const submit = useI18n('action.submit');

    return (
        <Dialog.Footer {...props}>
            <Dialog.Close asChild>
                <Button label={cancel} variant='outline' onClick={onCancel}/>
            </Dialog.Close>
            <Dialog.Close asChild>
                <Button className={cn(intent === 'danger' && 'bg-btn-error text-alt hover:bg-btn-error-hover active:bg-btn-error-active focus-visible:ring-error/50')} label={submit} variant='solid' onClick={onSubmit} disabled={!submitEnabled}/>
            </Dialog.Close>
        </Dialog.Footer>
    );
};
ConfirmationDialogFooter.displayName = 'ConfirmationDialog.Footer';

export const ConfirmationDialog = {
    ...Dialog,
    Content: ConfirmationDialogContent,
    Footer: ConfirmationDialogFooter,
};
