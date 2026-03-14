import {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {ImageSelectorConfig} from './ImageSelectorConfig';
import {ReactElement, useCallback, useMemo} from 'react';
import {ImageSelector} from '../../../selectors/image';
import {Reference} from '@enonic/lib-admin-ui/util/Reference';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {useI18n} from '../../../../hooks/useI18n';

export const ImageSelectorInput = ({
    values,
    onMove,
    onAdd,
    onRemove,
    config,
    enabled,
    errors,
    occurrences,
}: SelfManagedComponentProps<ImageSelectorConfig>): ReactElement => {
    // Constants
    const selectionMode = occurrences.getMaximum() === 1 ? 'single' : 'multiple';
    const hasErrors = errors.some((error) => error.breaksRequired || error.validationResults.length > 0);
    const hideToggleIcon = config.hideToggleIcon;
    const listMode = config.treeMode ? 'tree' : 'flat';

    // Selection
    const selection = useMemo(() => values.filter((v) => v.isNotNull()).map((v) => v.getReference().getNodeId()), [values]);

    // i18n
    const placeholder = useI18n('field.search.placeholder');
    const emptyLabel = useI18n('field.option.noitems');

    // Handler
    // TODO: move to a reusable hook, so it can be used in other selectors (content, custom, ...)
    const handleSelectionChange = useCallback(
        (newSelection: readonly string[]) => {
            const currentIds = new Set(selection);
            const newIds = new Set(newSelection);
            const sameItems = selection.length === newSelection.length && selection.every((id) => newIds.has(id));

            if (sameItems) {
                // Reorder: find the moved item's old and new positions
                for (let i = 0; i < selection.length; i++) {
                    if (selection[i] !== newSelection[i]) {
                        const movedId = newSelection[i];
                        const fromIndex = selection.indexOf(movedId);
                        onMove(fromIndex, i);
                        break;
                    }
                }
                return;
            }

            // Remove deselected items (iterate backwards to keep indices stable)
            for (let i = selection.length - 1; i >= 0; i--) {
                if (!newIds.has(selection[i])) {
                    onRemove(i);
                }
            }

            // Add newly selected items
            for (const id of newSelection) {
                if (!currentIds.has(id)) {
                    const ref = new Reference(id);
                    const value = new Value(ref, ValueTypes.REFERENCE);
                    onAdd(value);
                }
            }
        },
        [selection, onAdd, onRemove, onMove]
    );

    return (
        <ImageSelector
            selection={selection}
            onSelectionChange={handleSelectionChange}
            selectionMode={selectionMode}
            placeholder={placeholder}
            emptyLabel={emptyLabel}
            error={hasErrors}
            hideToggleIcon={hideToggleIcon}
            listMode={listMode}
            disabled={!enabled}
            withUpload
        />
    );
};

ImageSelectorInput.displayName = 'ImageSelectorInput';
