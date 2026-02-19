import {type PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {type Input} from '@enonic/lib-admin-ui/form/Input';
import {Button, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Plus, X} from 'lucide-react';
import {type ReactElement, useCallback, useMemo} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {getInputPath, toPathKey} from '../../../utils/cms/property/path';
import {useFormData} from './FormDataContext';
import {FormInputFactory} from './FormInputFactory';
import {getOccurrenceCount} from './formOccurrences';

export type FormInputViewProps = {
    input: Input;
    parentPath?: PropertyPath;
};

const REPEATABLE_BASIC_INPUT_TYPES = new Set<string>([
    'TextLine',
    'TextArea',
]);

export const FormInputView = ({input, parentPath}: FormInputViewProps): ReactElement => {
    const inputType = input.getInputType().toString();
    const supportsOccurrenceInputs = REPEATABLE_BASIC_INPUT_TYPES.has(inputType);
    const inputLabel = input.getLabel();
    const basePath = useMemo(() => getInputPath(input, parentPath, 0), [input, parentPath]);
    const basePathKey = toPathKey(basePath);
    const minimum = input.getOccurrences().getMinimum();
    const maximum = input.getOccurrences().getMaximum();
    const addLabel = useI18n('action.add');
    const removeLabel = useI18n('action.remove');
    const minimumVisibleOccurrences = Math.max(1, minimum);

    const {$draftData, $changedPaths, addOccurrence, removeOccurrence} = useFormData();

    const draftData = useStore($draftData);
    const changedPaths = useStore($changedPaths, {keys: [basePathKey]});
    const basePathVersion = changedPaths[basePathKey];

    const dataOccurrences = useMemo(() => {
        if (!supportsOccurrenceInputs) {
            return 1;
        }

        const treeOccurrences = getOccurrenceCount(basePath, draftData);
        const requiredOccurrences = Math.max(minimumVisibleOccurrences, treeOccurrences);
        return maximum > 0 ? Math.min(requiredOccurrences, maximum) : requiredOccurrences;
    }, [basePath, basePathVersion, draftData, maximum, minimumVisibleOccurrences, supportsOccurrenceInputs]);

    const occurrenceCount = dataOccurrences;
    const canRemoveOccurrence = supportsOccurrenceInputs && occurrenceCount > minimumVisibleOccurrences;
    const canAddOccurrence = maximum === 0 || occurrenceCount < maximum;
    const showAddButton = supportsOccurrenceInputs && input.getOccurrences().multiple() && canAddOccurrence;
    const occurrenceIndexes = useMemo(() => {
        return Array.from({length: occurrenceCount}, (_, index) => index);
    }, [occurrenceCount]);

    const handleAdd = useCallback(() => {
        if (!supportsOccurrenceInputs || (maximum > 0 && occurrenceCount >= maximum)) {
            return;
        }

        addOccurrence(basePath, occurrenceCount);
    }, [addOccurrence, basePath, maximum, occurrenceCount, supportsOccurrenceInputs]);

    const handleRemove = useCallback((occurrenceIndex: number) => {
        if (!canRemoveOccurrence) {
            return;
        }

        removeOccurrence(basePath, occurrenceIndex);
    }, [basePath, canRemoveOccurrence, removeOccurrence]);

    const occurrencePaths = useMemo(() => {
        return occurrenceIndexes.map((index) => getInputPath(input, parentPath, index));
    }, [input, occurrenceIndexes, parentPath]);

    return (
        <div className="flex flex-col gap-2">
            {inputLabel && (
                <span className="text-base font-semibold">{inputLabel}</span>
            )}
            {occurrencePaths.map((path, index) => {
                const occurrenceIndex = occurrenceIndexes[index];
                const pathString = path.toString();

                return (
                    <div key={pathString} className="flex items-center gap-2.5">
                        <div className="flex-1">
                            <FormInputFactory input={input} path={path} />
                        </div>
                        {canRemoveOccurrence && (
                            <IconButton
                                variant="text"
                                icon={X}
                                aria-label={removeLabel}
                                onClick={() => handleRemove(occurrenceIndex)}
                                className="shrink-0"
                            />
                        )}
                    </div>
                );
            })}
            {showAddButton && (
                <div className="flex justify-end mt-2">
                    <Button
                        variant="outline"
                        label={addLabel}
                        endIcon={Plus}
                        onClick={handleAdd}
                    />
                </div>
            )}
        </div>
    );
};

FormInputView.displayName = 'FormInputView';
