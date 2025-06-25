import {type ReactElement, type RefObject, useEffect, useRef} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {DateTimeSelector} from '../../selectors/date/DateTimeSelector';

const COMPONENT_NAME = 'IssueScheduleForm';

type IssueScheduleFormProps = {
    publishFrom?: Date;
    publishTo?: Date;
    fromError?: string;
    toError?: string;
    onFromChange: (value: Date | undefined) => void;
    onToChange: (value: Date | undefined) => void;
    onFromError: (error: string | undefined) => void;
    onToError: (error: string | undefined) => void;
    firstInputRef?: RefObject<HTMLInputElement>;
    defaultTimeValue?: string;
};

export const IssueScheduleForm = ({
    publishFrom,
    publishTo,
    fromError,
    toError,
    onFromChange,
    onToChange,
    onFromError,
    onToError,
    firstInputRef,
    defaultTimeValue,
}: IssueScheduleFormProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement>(null);

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
            className='flex flex-wrap justify-between gap-x-6 gap-y-4 rounded-lg bg-surface-primary p-7.5'
        >
            <DateTimeSelector
                label={onlineFromLabel}
                placeholder={nowLabel}
                initialValue={publishFrom}
                onChange={onFromChange}
                onError={onFromError}
                error={fromError}
                inputRef={firstInputRef}
                defaultTimeValue={defaultTimeValue}
            />
            <DateTimeSelector
                label={onlineToLabel}
                initialValue={publishTo}
                onChange={onToChange}
                onError={onToError}
                error={toError}
                defaultTimeValue={defaultTimeValue}
            />
        </div>
    );
};

IssueScheduleForm.displayName = COMPONENT_NAME;
