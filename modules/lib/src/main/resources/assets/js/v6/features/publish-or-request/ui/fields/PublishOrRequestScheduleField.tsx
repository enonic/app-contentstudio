// Scheduled publish field of the publish or request dialog's second step: a checkbox that,
// once ticked, asks for when the items go online and when they go offline.

import { Checkbox } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useEffect, useId } from 'react';
import { $config } from '../../../../shared/config/config.store';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { DateTimeSelector } from '../../../shared/selectors/date/DateTimeSelector';
import {
    setPublishOrRequestScheduleChecked,
    setPublishOrRequestScheduleFrom,
    setPublishOrRequestScheduleFromError,
    setPublishOrRequestScheduleTo,
    setPublishOrRequestScheduleToError,
} from '../../model/commands/fields';
import {
    $isPublishOrRequestScheduleOpen,
    $publishOrRequestFields,
    $publishOrRequestScheduleProblem,
} from '../../model/publishOrRequestFields.store';

const PUBLISH_OR_REQUEST_SCHEDULE_FIELD_NAME = 'PublishOrRequestScheduleField';

export const PublishOrRequestScheduleField = (): ReactElement => {
    const { scheduleChecked } = useStore($publishOrRequestFields, { keys: ['scheduleChecked'] });
    const isOpen = useStore($isPublishOrRequestScheduleOpen);

    const helpId = useId();

    const label = useI18n('dialog.publishOrRequest.schedule');
    const helpText = useI18n('dialog.publishOrRequest.schedule.help');

    return (
        <div data-component={PUBLISH_OR_REQUEST_SCHEDULE_FIELD_NAME} className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
                <Checkbox
                    className="font-semibold"
                    checked={scheduleChecked}
                    onCheckedChange={(checked) => setPublishOrRequestScheduleChecked(checked === true)}
                    label={label}
                    aria-describedby={helpId}
                />
                {/* ? Indented by the box of the checkbox and the gap after it, as the inputs below. */}
                <p id={helpId} className="pl-6 text-sm text-subtle">
                    {helpText}
                </p>
            </div>

            {isOpen && <ScheduleInputs />}
        </div>
    );
};

PublishOrRequestScheduleField.displayName = PUBLISH_OR_REQUEST_SCHEDULE_FIELD_NAME;

// *
// * Internal
// *

// The two date inputs. They keep their own text, and start from the dates last entered.
function ScheduleInputs(): ReactElement {
    const { scheduleFrom, scheduleTo, scheduleFromError, scheduleToError } = useStore($publishOrRequestFields, {
        keys: ['scheduleFrom', 'scheduleTo', 'scheduleFromError', 'scheduleToError'],
    });
    const problem = useStore($publishOrRequestScheduleProblem);
    const { defaultPublishFromTime, requiredPublishFrom } = useStore($config, {
        keys: ['defaultPublishFromTime', 'requiredPublishFrom'],
    });

    const onlineFromLabel = useI18n('field.onlineFrom');
    const onlineToLabel = useI18n('field.onlineTo');
    const nowLabel = useI18n('text.now');
    const toInPastError = useI18n('field.schedule.invalid.past');
    const toNotAfterFromError = useI18n('field.schedule.invalid');

    // The errors are about the text typed in the inputs, so they go when the inputs go.
    useEffect(() => {
        return () => {
            setPublishOrRequestScheduleFromError(undefined);
            setPublishOrRequestScheduleToError(undefined);
        };
    }, []);

    // What an input says about its own text comes first. The order of the two dates is told
    // under "online from", as in the publish dialog.
    const fromError = scheduleFromError ?? (problem === 'to-not-after-from' ? toNotAfterFromError : undefined);
    const toError = scheduleToError ?? (problem === 'to-in-past' ? toInPastError : undefined);

    return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 pl-6 md:gap-y-4">
            <DateTimeSelector
                label={onlineFromLabel}
                placeholder={requiredPublishFrom ? undefined : nowLabel}
                initialValue={scheduleFrom}
                onChange={setPublishOrRequestScheduleFrom}
                onError={setPublishOrRequestScheduleFromError}
                error={fromError}
                defaultTimeValue={defaultPublishFromTime}
            />
            <DateTimeSelector
                label={onlineToLabel}
                initialValue={scheduleTo}
                onChange={setPublishOrRequestScheduleTo}
                onError={setPublishOrRequestScheduleToError}
                error={toError}
                defaultTimeValue={defaultPublishFromTime}
            />
        </div>
    );
}
