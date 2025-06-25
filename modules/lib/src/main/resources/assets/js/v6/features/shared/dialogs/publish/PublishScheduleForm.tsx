import {useStore} from '@nanostores/preact';
import {ReactElement, type RefObject, useEffect, useRef} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $publishDialog,
    $scheduleFromError,
    $scheduleToError,
    setPublishScheduleFrom,
    setPublishScheduleFromError,
    setPublishScheduleTo,
    setPublishScheduleToError,
} from '../../../store/dialogs/publishDialog.store';
import {DateTimeSelector} from '../../selectors/date/DateTimeSelector';

const COMPONENT_NAME = 'PublishScheduleForm';

type PublishScheduleFormProps = {
    firstInputRef?: RefObject<HTMLInputElement>;
    defaultTimeValue?: string;
};

export const PublishScheduleForm = ({firstInputRef, defaultTimeValue}: PublishScheduleFormProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement>(null);
    const {schedule} = useStore($publishDialog, {keys: ['schedule']});
    const fromError = useStore($scheduleFromError);
    const toError = useStore($scheduleToError);

    const onlineFromLabel = useI18n('field.onlineFrom');
    const onlineToLabel = useI18n('field.onlineTo');
    const nowLabel = useI18n('text.now');

    useEffect(() => {
        containerRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
    }, []);

    return (
        <div
            ref={containerRef}
            data-component={COMPONENT_NAME}
            className='flex flex-wrap gap-x-6 gap-y-4 rounded-lg bg-surface-primary p-7.5'
        >
            <DateTimeSelector
                label={onlineFromLabel}
                placeholder={nowLabel}
                initialValue={schedule?.from}
                onChange={setPublishScheduleFrom}
                onError={setPublishScheduleFromError}
                error={fromError}
                inputRef={firstInputRef}
                defaultTimeValue={defaultTimeValue}
            />
            <DateTimeSelector
                label={onlineToLabel}
                initialValue={schedule?.to}
                onChange={setPublishScheduleTo}
                onError={setPublishScheduleToError}
                error={toError}
                defaultTimeValue={defaultTimeValue}
            />
        </div>
    );
}

PublishScheduleForm.displayName = COMPONENT_NAME;
