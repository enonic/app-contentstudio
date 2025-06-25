import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {StatusBarEntry} from './StatusBarEntry';
import {StatusBarEntryButton} from './StatusBarEntryButton';
import {StatusIcon} from '../../icons/StatusIcon';

type Props = {
    onReset: () => void;
};

const SCHEDULE_STATUS_BAR_NAME = 'ScheduleStatusBar';

export const ScheduleStatusBar = ({onReset}: Props): ReactElement => {
    const errorText = useI18n('field.schedule.invalid');
    const resetText = useI18n('action.reset');

    return (
        <div data-component={SCHEDULE_STATUS_BAR_NAME}>
            <StatusBarEntry className='bg-surface-error'>
                <StatusIcon className='w-6 h-6' status='invalid' />
                <span className='text-sm font-semibold'>{errorText}</span>
                <StatusBarEntryButton onClick={onReset}>
                    {resetText}
                </StatusBarEntryButton>
            </StatusBarEntry>
        </div>
    );
};

ScheduleStatusBar.displayName = SCHEDULE_STATUS_BAR_NAME;
