import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { useStore } from '@nanostores/preact';
import { useCallback, useMemo, useState } from 'react';
import { FragmentComponent } from '../../../../../../../../app/page/region/FragmentComponent';
import { LayoutComponent } from '../../../../../../../../app/page/region/LayoutComponent';
import { LayoutComponentType } from '../../../../../../../../app/page/region/LayoutComponentType';
import { fetchContentById } from '../../../../../../../entities/content';
import { useI18n } from '../../../../../../../shared/lib/hooks/useI18n';
import { $inspectedItem, $pageEditorLifecycle, requestSetFragmentComponent } from '../../../../../model/page-editor';
import { $pageVersion } from '../../../../../model/page-editor/store';
import {
    $fragmentOptions,
    $isFragmentInspectionLoading,
    $selectedFragmentId,
} from '../../../../../model/fragment-inspection.store';

//
// * Types
//

export type FragmentOption = {
    key: string;
    label: string;
    description: string;
    isInvalid?: boolean;
};

const compareOptionsByLabel = (a: FragmentOption, b: FragmentOption): number =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }) || a.key.localeCompare(b.key);

type UseFragmentContentSelectorResult = {
    filteredOptions: FragmentOption[];
    selectedOption: FragmentOption | undefined;
    searchValue: string | undefined;
    setSearchValue: (value: string | undefined) => void;
    selection: string[];
    handleSelectionChange: (selection: readonly string[]) => void;
    disabled: boolean;
    isLoading: boolean;
    isEmpty: boolean;
};

//
// * Hook
//

export function useFragmentContentSelector(): UseFragmentContentSelectorResult {
    const item = useStore($inspectedItem);
    useStore($pageVersion);
    const lifecycle = useStore($pageEditorLifecycle);
    const fragments = useStore($fragmentOptions);
    const selectedId = useStore($selectedFragmentId);
    const isLoading = useStore($isFragmentInspectionLoading);

    const noDescriptionLabel = useI18n('text.noDescription');
    const notFoundLabel = useI18n('notify.fragment.component.content.notfound');
    const nestedLayoutsWarning = useI18n('notify.nestedLayouts');

    const [searchValue, setSearchValue] = useState<string | undefined>();

    const fragment = item instanceof FragmentComponent ? item : null;
    const disabled = lifecycle.isPageLocked;

    const isInsideLayout = useMemo((): boolean => {
        if (!fragment) return false;
        const parentRegion = fragment.getParent();
        if (!parentRegion) return false;
        return parentRegion.getParent() instanceof LayoutComponent;
    }, [fragment]);

    const options = useMemo((): FragmentOption[] => {
        const real = fragments.map((f) => ({
            key: f.getId(),
            label: f.getDisplayName(),
            description: f.getPath().toString() || noDescriptionLabel,
        }));

        if (!selectedId || real.some((o) => o.key === selectedId)) {
            return real;
        }

        const fallbackLabel = fragment?.getName()?.toString() || selectedId;
        const placeholderOption: FragmentOption = {
            key: selectedId,
            label: fallbackLabel,
            description: notFoundLabel,
            isInvalid: true,
        };
        return [placeholderOption, ...real];
    }, [fragments, selectedId, fragment, notFoundLabel, noDescriptionLabel]);

    const filteredOptions = useMemo(() => {
        if (!searchValue) return options.toSorted(compareOptionsByLabel);

        const lower = searchValue.toLowerCase();
        return options
            .filter((o) => o.label.toLowerCase().includes(lower) || o.description.toLowerCase().includes(lower))
            .toSorted(compareOptionsByLabel);
    }, [searchValue, options]);

    const selectedOption = useMemo(() => options.find((o) => o.key === selectedId), [options, selectedId]);

    const handleSelectionChange = useCallback(
        (newSelection: readonly string[]): void => {
            if (newSelection.length === 0 || !fragment) return;

            const newId = newSelection[0];
            if (newId === selectedId) return;

            setSearchValue(undefined);

            const optionLabel = options.find((o) => o.key === newId)?.label;

            if (isInsideLayout) {
                void fetchContentById(newId).match(
                    (content) => {
                        const fragmentComp = content.getPage()?.getFragment() ?? null;

                        if (fragmentComp?.getType() instanceof LayoutComponentType) {
                            showWarning(nestedLayoutsWarning);
                        } else {
                            requestSetFragmentComponent(fragment.getPath(), newId, content.getDisplayName());
                        }
                    },
                    (error) => {
                        console.error(error);
                    },
                );
            } else {
                requestSetFragmentComponent(fragment.getPath(), newId, optionLabel);
            }
        },
        [fragment, selectedId, isInsideLayout, options, nestedLayoutsWarning],
    );

    const selection = selectedId ? [selectedId] : [];
    const isEmpty = options.length === 0 && !selectedId;

    return {
        filteredOptions,
        selectedOption,
        searchValue,
        setSearchValue,
        selection,
        handleSelectionChange,
        disabled,
        isLoading,
        isEmpty,
    };
}
