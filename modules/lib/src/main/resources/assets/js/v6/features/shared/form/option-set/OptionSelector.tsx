import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import type {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {Checkbox, RadioGroup} from '@enonic/ui';
import {type ReactElement, useCallback, useMemo} from 'react';

type OptionSelectorProps = {
    optionSet: FormOptionSet;
    selectedNames: string[];
    isSelected: (name: string) => boolean;
    onSelect: (name: string) => void;
    onDeselect: (name: string) => void;
    onToggle: (name: string) => void;
    enabled: boolean;
};

export const OptionSelector = ({
    optionSet,
    selectedNames,
    isSelected,
    onSelect,
    onToggle,
    enabled,
}: OptionSelectorProps): ReactElement => {
    const isRadio = optionSet.isRadioSelection();
    const options: FormOptionSetOption[] = useMemo(() => optionSet.getOptions(), [optionSet]);
    const multiselection = optionSet.getMultiselection();
    const isAtMax = !isRadio && multiselection.getMaximum() > 0
        && selectedNames.length >= multiselection.getMaximum();

    const handleRadioChange = useCallback(
        (value: string) => {
            onSelect(value);
        },
        [onSelect],
    );

    if (isRadio) {
        return (
            <RadioGroup
                name={optionSet.getName()}
                value={selectedNames[0] ?? ''}
                onValueChange={handleRadioChange}
            >
                {options.map(option => (
                    <RadioGroup.Item
                        key={option.getName()}
                        value={option.getName()}
                        disabled={!enabled}
                    >
                        <RadioGroup.Indicator />
                        <span>{option.getLabel() || option.getName()}</span>
                    </RadioGroup.Item>
                ))}
            </RadioGroup>
        );
    }

    return (
        <div className="flex flex-col gap-2" data-component="OptionSelector">
            {options.map(option => {
                const name = option.getName();
                const checked = isSelected(name);
                return (
                    <Checkbox
                        key={name}
                        checked={checked}
                        onCheckedChange={() => onToggle(name)}
                        disabled={!enabled || (isAtMax && !checked)}
                        label={option.getLabel() || name}
                    />
                );
            })}
        </div>
    );
};

OptionSelector.displayName = 'OptionSelector';
