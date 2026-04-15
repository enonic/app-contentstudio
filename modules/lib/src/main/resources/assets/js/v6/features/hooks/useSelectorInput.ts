import {type SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {Reference} from '@enonic/lib-admin-ui/util/Reference';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {useCallback, useMemo} from 'react';
import {useI18n} from './useI18n';
import {useStore} from '@nanostores/preact';
import {$contextContent} from '../store/context/contextContent.store';
import {SITE_PATH} from '../utils/form/form';
import {type ContentSummary} from '../../../app/content/ContentSummary';

export type GeneralSelectorConfig = {
    allowContentType: string[];
    allowPath: string[];
    treeMode: boolean;
    hideToggleIcon: boolean;
};

export const useSelectorInput = <T extends Omit<GeneralSelectorConfig, 'allowContentType'>>({
    values,
    onMove,
    onAdd,
    onRemove,
    config,
    errors,
    occurrences,
}: SelfManagedComponentProps<T>) => {
    // Stores
    const contextContent = useStore($contextContent);

    // Constants
    const resolvedContextContent: ContentSummary | undefined = config.allowPath.some((path) => path !== SITE_PATH)
        ? contextContent
        : undefined;
    const resolvedSelectionMode: 'single' | 'multiple' = occurrences.getMaximum() === 1 ? 'single' : 'multiple';
    const resolvedListMode: 'tree' | 'flat' = config.treeMode ? 'tree' : 'flat';
    const resolvedHasErrors: boolean = errors.some((error) => error.breaksRequired || error.validationResults.length > 0);
    const resolvedHideToggleIcon: boolean = config.hideToggleIcon;

    // Selection
    const selection: string[] = useMemo(() => values.filter((v) => v.isNotNull()).map((v) => v.getReference().getNodeId()), [values]);

    // i18n
    const placeholder: string = useI18n('field.search.placeholder');
    const emptyLabel: string = useI18n('field.option.noitems');

    // Handler
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

    return {
        contextContent: resolvedContextContent,
        selectionMode: resolvedSelectionMode,
        hasErrors: resolvedHasErrors,
        hideToggleIcon: resolvedHideToggleIcon,
        listMode: resolvedListMode,
        selection,
        placeholder,
        emptyLabel,
        handleSelectionChange,
    };
};
