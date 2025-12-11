import {cn} from '@enonic/ui';
import {LoaderCircle} from 'lucide-react';
import {useI18n} from '../../../hooks/useI18n';
import {StatusIcon} from '../../icons/StatusIcon';
import {StatusBarEntry} from './StatusBarEntry';
import {StatusBarEntryButton} from './StatusBarEntryButton';
import {StatusBarErrorEntry} from './StatusBarErrorEntry';

type Props = {
    className?: string;
    loading?: boolean;
    failed?: boolean;
    errors: {
        inbound: {
            count: number;
            onIgnore: () => void;
        };
    },
};

type Status = 'loading' | 'failed' | 'ready' | 'errors' | 'none';

function getStatus({loading, failed, errors}: Omit<Props, 'className'>): Status {
    if (loading) {
        return 'loading';
    }
    if (failed) {
        return 'failed';
    }
    if (Object.values(errors).some(({count}) => count > 0)) {
        return 'errors';
    }
    return 'none';
}

const INBOUND_STATUS_BAR_NAME = 'InboundStatusBar';

export const InboundStatusBar = ({className, ...props}: Props): React.ReactElement => {
    const loadingText = useI18n('dialog.statusBar.loading');
    const failedText = useI18n('dialog.statusBar.error.failed.text');
    const inboundText = useI18n('dialog.statusBar.error.inbound.text');
    const ignoreActionText = useI18n('dialog.statusBar.error.inbound.action');

    const status = getStatus(props);

    if (status === 'none') {
        return null;
    }

    const inbound = props.errors?.inbound;

    return (
        <div data-component={INBOUND_STATUS_BAR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {status === 'loading' && <StatusBarEntry>
                <LoaderCircle className="w-7 h-7 animate-spin text-subtle" />
                <span className="text-sm font-semibold">{loadingText}</span>
            </StatusBarEntry>}

            {status === 'failed' && <StatusBarEntry className="bg-surface-error">
                <StatusIcon className="w-6 h-6" status='invalid' />
                <span className="text-sm font-semibold">{failedText}</span>
            </StatusBarEntry>}

            {status === 'errors' && inbound.count > 0 && <StatusBarErrorEntry status='invalid' label={`${inboundText} (${inbound.count})`}>
                <StatusBarEntryButton onClick={inbound.onIgnore}>
                    {ignoreActionText}
                </StatusBarEntryButton>
            </StatusBarErrorEntry>}
        </div>
    );
};

InboundStatusBar.displayName = INBOUND_STATUS_BAR_NAME;
