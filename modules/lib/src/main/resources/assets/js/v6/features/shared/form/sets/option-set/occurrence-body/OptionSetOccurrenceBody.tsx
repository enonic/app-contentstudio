import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {useValidationVisibility} from '@enonic/lib-admin-ui/form2';
import {type ReactElement, useCallback, useState} from 'react';
import {useOptionSetMultiselectionError} from '../../set-errors';
import {useOptionSetSelection} from '../useOptionSetSelection';
import {LockedSingleRadioBody} from './LockedSingleRadioBody';
import {MultiSelectOptionsBody} from './MultiSelectOptionsBody';
import {RadioSelectedOptionBody} from './RadioSelectedOptionBody';

type OptionSetOccurrenceBodyProps = {
    optionSet: FormOptionSet;
    occurrencePropertySet: PropertySet;
    enabled: boolean;
};

const OPTION_SET_OCCURRENCE_BODY_NAME = 'OptionSetOccurrenceBody';

export const OptionSetOccurrenceBody = ({
    optionSet,
    occurrencePropertySet,
    enabled,
}: OptionSetOccurrenceBodyProps): ReactElement => {
    const visibility = useValidationVisibility();
    const [interacted, setInteracted] = useState(false);
    const {selectedNames, toggle} = useOptionSetSelection(optionSet, occurrencePropertySet);
    const showErrors = visibility === 'all' || (visibility === 'interactive' && interacted);
    const error = useOptionSetMultiselectionError(optionSet, showErrors, selectedNames);

    const handleToggle = useCallback(
        (name: string) => {
            setInteracted(true);
            toggle(name);
        },
        [toggle]
    );

    if (optionSet.isRadioSelection()) {
        const occurrences = optionSet.getOccurrences();
        const isLockedSingle = occurrences.getMinimum() === 1 && occurrences.getMaximum() === 1;

        if (isLockedSingle) {
            return (
                <div data-component={OPTION_SET_OCCURRENCE_BODY_NAME}>
                    <LockedSingleRadioBody
                        enabled={enabled}
                        optionSet={optionSet}
                        occurrencePropertySet={occurrencePropertySet}
                        error={error}
                    />
                </div>
            );
        }

        return (
            <div data-component={OPTION_SET_OCCURRENCE_BODY_NAME}>
                <RadioSelectedOptionBody optionSet={optionSet} occurrencePropertySet={occurrencePropertySet} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4" data-component={OPTION_SET_OCCURRENCE_BODY_NAME}>
            <MultiSelectOptionsBody
                enabled={enabled}
                optionSet={optionSet}
                occurrencePropertySet={occurrencePropertySet}
                onToggle={handleToggle}
                error={error}
            />
        </div>
    );
};

OptionSetOccurrenceBody.displayName = OPTION_SET_OCCURRENCE_BODY_NAME;
