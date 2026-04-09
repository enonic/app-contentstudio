import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {useStore} from '@nanostores/preact';
import {useCallback, useMemo, useState} from 'react';
import {ContentId} from '../../../../../../../../../app/content/ContentId';
import {FragmentComponent} from '../../../../../../../../../app/page/region/FragmentComponent';
import {LayoutComponent} from '../../../../../../../../../app/page/region/LayoutComponent';
import {LayoutComponentType} from '../../../../../../../../../app/page/region/LayoutComponentType';
import {GetContentByIdRequest} from '../../../../../../../../../app/resource/GetContentByIdRequest';
import {
    $inspectedItem,
    $pageEditorLifecycle,
    requestSetFragmentComponent,
} from '../../../../../../../store/page-editor';
import {$pageVersion} from '../../../../../../../store/page-editor/store';
import {$fragmentOptions, $isFragmentInspectionLoading, $selectedFragmentId} from '../../../../../../../store/fragment-inspection.store';

//
// * Types
//

export type FragmentOption = {
    key: string;
    label: string;
    description: string;
};

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

    const noDescriptionLabel = i18n('text.noDescription');

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
        return fragments.map(f => ({
            key: f.getId(),
            label: f.getDisplayName(),
            description: f.getPath().toString() || noDescriptionLabel,
        }));
    }, [fragments, noDescriptionLabel]);

    const filteredOptions = useMemo(() => {
        if (!searchValue) return options;
        const lower = searchValue.toLowerCase();
        return options.filter(o =>
            o.label.toLowerCase().includes(lower) ||
            o.description.toLowerCase().includes(lower),
        );
    }, [searchValue, options]);

    const selectedOption = useMemo(
        () => options.find(o => o.key === selectedId),
        [options, selectedId],
    );

    const handleSelectionChange = useCallback(
        (newSelection: readonly string[]): void => {
            if (newSelection.length === 0 || !fragment) return;

            const newId = newSelection[0];
            if (newId === selectedId) return;

            setSearchValue(undefined);

            if (isInsideLayout) {
                new GetContentByIdRequest(new ContentId(newId))
                    .sendAndParse()
                    .done((content) => {
                        const fragmentComp = content.getPage()?.getFragment() ?? null;

                        if (fragmentComp?.getType() instanceof LayoutComponentType) {
                            showWarning(i18n('notify.nestedLayouts'));
                        } else {
                            requestSetFragmentComponent(fragment.getPath(), newId);
                        }
                    });
            } else {
                requestSetFragmentComponent(fragment.getPath(), newId);
            }
        },
        [fragment, selectedId, isInsideLayout],
    );

    const selection = selectedId ? [selectedId] : [];
    const isEmpty = options.length === 0;

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
