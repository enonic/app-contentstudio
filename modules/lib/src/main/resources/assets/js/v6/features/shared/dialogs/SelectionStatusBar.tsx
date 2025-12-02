import {Button, ButtonProps, cn} from '@enonic/ui';
import {StatusIcon} from '../icons/StatusIcon';
import {LoaderCircle} from 'lucide-react';
import {useI18n} from '../../hooks/useI18n';
import {LegacyElement} from '../LegacyElement';

type StatusEntryProps = {
    className?: string;
    children: React.ReactNode;
};

type ErrorEntryProps = {
    className?: string;
    status: 'in-progress' | 'invalid';
    label: string;
    disabled?: boolean;
    children: React.ReactNode;
};

type Props = {
    className?: string;
    loading?: boolean;
    editing?: boolean;
    failed?: boolean;
    showReady?: boolean;
    onApply: () => void;
    onCancel: () => void;
    errors: {
        inProgress: {
            count: number;
            disabled?: boolean;
            onExclude: () => void;
            onMarkAsReady?: () => void;
        };
        invalid: {
            count: number;
            disabled?: boolean;
            onExclude: () => void;
        };
        noPermissions: {
            count: number;
            disabled?: boolean;
            onExclude: () => void;
        };
        inbound?: {
            count: number;
            onIgnore: () => void;
        };
    },
};

type ErrorKind = keyof Props['errors'];

type Status = 'loading' | 'failed' | 'editing' | 'ready' | 'errors' | 'none';

function getStatus({loading, failed, editing, showReady, errors}: Omit<Props, 'className' | 'onApply' | 'onCancel'>): Status {
    if (loading) {
        return 'loading';
    }
    if (failed) {
        return 'failed';
    }
    if (editing) {
        return 'editing';
    }
    if (Object.values(errors).some(({count}) => count > 0)) {
        return 'errors';
    }
    if (showReady) {
        return 'ready';
    }
    return 'none';
}

const StatusEntry = ({className, children}: StatusEntryProps): React.ReactElement => {
    return <div className={cn('grid grid-flow-col auto-cols-max grid-cols-[max-content_1fr] items-center gap-2 min-h-19 p-5 rounded-lg', className)}>
        {children}
    </div>;
};

const ErrorEntry = ({className, status, label, disabled, children}: ErrorEntryProps): React.ReactElement => {
    return <StatusEntry className={cn(status === 'in-progress' ? 'bg-surface-warn' : 'bg-surface-error', className)}>
        <StatusIcon className="w-6 h-6" status={status} />
        <span className="text-sm font-semibold">{label}</span>
        {disabled || children}
    </StatusEntry>
}

const EntryButton = ({className, children, ...props}: Pick<ButtonProps, 'className' | 'onClick' | 'children'>): React.ReactElement => {
    return <Button {...props} className={cn('bg-transparent hover:bg-btn-primary-hover/50', className)} variant="outline" size="sm">
        {children}
    </Button>
}

const SELECTION_STATUS_BAR_NAME = 'SelectionStatusBar';

export const SelectionStatusBar = ({className, onApply, onCancel, ...props}: Props): React.ReactElement => {
    const status = getStatus(props);

    if (status === 'none') {
        return null;
    }

    const {inProgress, invalid, noPermissions, inbound} = props.errors || {};

    return (
        <div className={cn('flex flex-col gap-2.5', className)}>
            {status === 'loading' && <StatusEntry>
                <LoaderCircle className="w-7 h-7 animate-spin text-subtle" />
                <span className="text-sm font-semibold">{useI18n('dialog.publish.resolving')}</span>
            </StatusEntry>}

            {status === 'failed' && <StatusEntry className="bg-surface-error">
                <StatusIcon className="w-6 h-6" status='invalid' />
                <span className="text-sm font-semibold">{useI18n('dialog.publish.error.loadFailed')}</span>
            </StatusEntry>}

            {status === 'editing' && <StatusEntry className="bg-surface-info">
                <StatusIcon className="w-6 h-6" status='info' />
                <span className="text-sm font-semibold">{useI18n('dialog.state.editing')}</span>
                <EntryButton onClick={onApply}>
                    {useI18n('action.apply')}
                </EntryButton>
                <EntryButton onClick={onCancel}>
                    {useI18n('action.cancel')}
                </EntryButton>
            </StatusEntry>}

            {status === 'ready' && <StatusEntry className="bg-surface-success">
                <StatusIcon className="w-6 h-6" status='ready' />
                <span className="text-sm font-semibold">{useI18n('dialog.publish.error.resolved')}</span>
            </StatusEntry>}

            {status === 'errors' && inProgress.count > 0 && <ErrorEntry status='in-progress' label={useI18n('dialog.publish.error.inProgress') + ` (${inProgress.count})`}>
                {!inProgress.disabled && <EntryButton onClick={inProgress.onExclude}>
                    {useI18n('dialog.publish.exclude')}
                </EntryButton>}
                {inProgress.onMarkAsReady && <EntryButton onClick={inProgress.onMarkAsReady}>
                    {useI18n('action.markAsReady')}
                </EntryButton>}
            </ErrorEntry>}

            {status === 'errors' && invalid.count > 0 && <ErrorEntry status='invalid' label={useI18n('dialog.publish.error.invalid') + ` (${invalid.count})`} disabled={invalid.disabled}>
                <EntryButton onClick={invalid.onExclude}>
                    {useI18n('dialog.publish.exclude')}
                </EntryButton>
            </ErrorEntry>}

            {status === 'errors' && noPermissions.count > 0 && <ErrorEntry status='invalid' label={useI18n('dialog.publish.error.noPermissions') + ` (${noPermissions.count})`} disabled={noPermissions.disabled}>
                <EntryButton onClick={noPermissions.onExclude}>
                    {useI18n('dialog.publish.exclude')}
                </EntryButton>
            </ErrorEntry>}

            {status === 'errors' && inbound && inbound.count > 0 && <ErrorEntry status='invalid' label={useI18n('dialog.archive.warning.text') + ` (${inbound.count})`}>
                <EntryButton onClick={inbound.onIgnore}>
                    {useI18n('dialog.archive.warning.ignore')}
                </EntryButton>
            </ErrorEntry>}
        </div>
    );
};

SelectionStatusBar.displayName = SELECTION_STATUS_BAR_NAME;

export class SelectionStatusBarElement extends LegacyElement<typeof SelectionStatusBar, Props> {
    constructor(props: Props) {
        super(props, SelectionStatusBar);
    }

    setEditing(editing: boolean): void {
        this.setProps({editing});
    }

    setLoading(loading: boolean): void {
        this.setProps({loading});
    }

    setFailed(failed: boolean): void {
        this.setProps({failed});
    }

    setErrorCount(kind: ErrorKind, count: number): void {
        const {errors} = this.props.get();
        const error = errors[kind];
        this.setProps({errors: {...errors, [kind]: {...error, count}}});
    }

    setErrorDisabled(kind: Exclude<ErrorKind, 'inbound'>, disabled: boolean): void {
        const {errors} = this.props.get();
        const error = errors[kind];
        this.setProps({errors: {...errors, [kind]: {...error, disabled}}});
    }

    reset(): void {
        const {inProgress, invalid, noPermissions, inbound} = this.props.get().errors;
        this.setProps({
            failed: false,
            editing: false,
            errors: {
                inProgress: {...inProgress, count: 0, disabled: false},
                invalid: {...invalid, count: 0, disabled: false},
                noPermissions: {...noPermissions, count: 0, disabled: false},
                inbound: {...inbound, count: 0},
            },
        });
    }
}
