import {cn} from '@enonic/ui';
import {LoaderCircle} from 'lucide-react';
import {useI18n} from '../../../hooks/useI18n';
import {StatusIcon} from '../../icons/StatusIcon';
import {LegacyElement} from '../../LegacyElement';
import {StatusBarEntry} from './StatusBarEntry';
import {StatusBarEntryButton} from './StatusBarEntryButton';
import {StatusBarErrorEntry} from './StatusBarErrorEntry';

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

const SELECTION_STATUS_BAR_NAME = 'SelectionStatusBar';

export const SelectionStatusBar = ({className, onApply, onCancel, ...props}: Props): React.ReactElement => {
    const loadingText = useI18n('dialog.statusBar.loading');
    const failedText = useI18n('dialog.statusBar.error.failed.text');
    const editingText = useI18n('dialog.state.editing');
    const applyText = useI18n('action.apply');
    const cancelText = useI18n('action.cancel');
    const readyText = useI18n('dialog.statusBar.error.ready.text');
    const inProgressText = useI18n('dialog.statusBar.error.inProgress.text');
    const invalidText = useI18n('dialog.statusBar.error.invalid.text');
    const noPermissionsText = useI18n('dialog.statusBar.error.noPermissions.text');
    const excludeText = useI18n('action.exclude');
    const markAsReadyText = useI18n('action.markAsReady');

    const status = getStatus(props);

    if (status === 'none') {
        return null;
    }

    const {inProgress, invalid, noPermissions} = props.errors || {};

    return (
        <div data-component={SELECTION_STATUS_BAR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {status === 'loading' && <StatusBarEntry>
                <LoaderCircle className="w-7 h-7 animate-spin text-subtle" />
                <span className="text-sm font-semibold">{loadingText}</span>
            </StatusBarEntry>}

            {status === 'failed' && <StatusBarEntry className="bg-surface-error">
                <StatusIcon className="w-6 h-6" status='invalid' />
                <span className="text-sm font-semibold">{failedText}</span>
            </StatusBarEntry>}

            {status === 'editing' && <StatusBarEntry className="bg-surface-info">
                <StatusIcon className="w-6 h-6" status='info' />
                <span className="text-sm font-semibold">{editingText}</span>
                <StatusBarEntryButton onClick={onApply} className='[--color-ring-offset:var(--color-surface-info)]'>
                    {applyText}
                </StatusBarEntryButton>
                <StatusBarEntryButton onClick={onCancel} className='[--color-ring-offset:var(--color-surface-info)]'>
                    {cancelText}
                </StatusBarEntryButton>
            </StatusBarEntry>}

            {status === 'ready' && <StatusBarEntry className="bg-surface-success">
                <StatusIcon className="w-6 h-6" status='ready' />
                <span className="text-sm font-semibold">{readyText}</span>
            </StatusBarEntry>}

            {status === 'errors' && inProgress.count > 0 && <StatusBarErrorEntry status='in-progress' label={`${inProgressText} (${inProgress.count})`}>
                {!inProgress.disabled && <StatusBarEntryButton onClick={inProgress.onExclude}>
                    {excludeText}
                </StatusBarEntryButton>}
                {inProgress.onMarkAsReady && <StatusBarEntryButton onClick={inProgress.onMarkAsReady} className='[--color-ring-offset:var(--color-surface-warn)]'>
                    {markAsReadyText}
                </StatusBarEntryButton>}
            </StatusBarErrorEntry>}

            {status === 'errors' && invalid.count > 0 && <StatusBarErrorEntry status='invalid' label={`${invalidText} (${invalid.count})`} disabled={invalid.disabled}>
                <StatusBarEntryButton onClick={invalid.onExclude} className='[--color-ring-offset:var(--color-surface-error)]'>
                    {excludeText}
                </StatusBarEntryButton>
            </StatusBarErrorEntry>}

            {status === 'errors' && noPermissions.count > 0 && <StatusBarErrorEntry status='invalid' label={`${noPermissionsText} (${noPermissions.count})`} disabled={noPermissions.disabled}>
                <StatusBarEntryButton onClick={noPermissions.onExclude} className='[--color-ring-offset:var(--color-surface-error)]'>
                    {excludeText}
                </StatusBarEntryButton>
            </StatusBarErrorEntry>}

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
        const {inProgress, invalid, noPermissions} = this.props.get().errors;
        this.setProps({
            failed: false,
            editing: false,
            errors: {
                inProgress: {...inProgress, count: 0, disabled: false},
                invalid: {...invalid, count: 0, disabled: false},
                noPermissions: {...noPermissions, count: 0, disabled: false},
            },
        });
    }
}
