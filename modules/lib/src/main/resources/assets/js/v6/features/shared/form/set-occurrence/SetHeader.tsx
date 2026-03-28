import type {Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {FieldError} from '@enonic/lib-admin-ui/form2';
import {type ReactElement} from 'react';

type SetHeaderProps = {
    label: string;
    occurrences: Occurrences;
    occurrenceError?: string;
};

export const SetHeader = ({label, occurrences, occurrenceError}: SetHeaderProps): ReactElement => {
    const isRequired = occurrences.getMinimum() > 0;

    return (
        <div className="flex flex-col gap-1" data-component="SetHeader">
            <div className="flex items-baseline gap-1">
                <span className="text-base font-semibold">{label}</span>
                {isRequired && <span className="text-destructive text-sm">*</span>}
            </div>
            {occurrenceError != null && <FieldError message={occurrenceError} />}
        </div>
    );
};

SetHeader.displayName = 'SetHeader';
