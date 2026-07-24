import { LegacyElement } from '@enonic/lib-admin-ui/ui2/LegacyElement';
import { Checkbox, type CheckboxChecked, IconButton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { RefreshCcw } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';
import {
    $isAllLoadedSelected,
    $isNoneSelected,
    $isReloading,
    $selectionCount,
    clearSelection,
    reloadContentTree,
    selectAll,
    $rootLoadingState,
} from '../../entities/content';
import { useI18n } from '../../shared/lib/hooks/useI18n';

type TreeListToolbarProps = {
    enabled?: boolean;
};

const TreeListToolbar = ({ enabled = true }: TreeListToolbarProps): ReactElement => {
    const loadingState = useStore($rootLoadingState);
    const isReloading = useStore($isReloading);
    const isLoading = loadingState === 'loading' || isReloading;
    const isAllSelected = useStore($isAllLoadedSelected);
    const totalSelected = useStore($selectionCount);
    const isNoneSelected = useStore($isNoneSelected);
    const reloadLabel = useI18n('action.reload.content');
    const selectAllLabel = isNoneSelected
        ? useI18n('field.selection.selectAll')
        : useI18n('field.selection.clear', totalSelected);

    const checkedStatus = useMemo<CheckboxChecked>(() => {
        if (isAllSelected) return true;
        if (isNoneSelected) return false;
        return 'indeterminate';
    }, [isAllSelected, isNoneSelected]);

    const handleCheckboxClick = () => {
        if (isNoneSelected) {
            selectAll();
        } else {
            clearSelection();
        }
    };

    return (
        <div className="bg-surface-neutral flex items-center justify-between px-5 py-2.5 gap-2">
            <div className="ml-2.5 flex items-center gap-2.5">
                <Checkbox
                    aria-label={selectAllLabel}
                    label={selectAllLabel}
                    defaultChecked={false}
                    checked={checkedStatus}
                    disabled={isLoading || !enabled}
                    onClick={handleCheckboxClick}
                />
            </div>

            <IconButton
                aria-label={reloadLabel}
                icon={RefreshCcw}
                disabled={isLoading || !enabled}
                onClick={() => void reloadContentTree()}
            />
        </div>
    );
};

TreeListToolbar.displayName = 'TreeListToolbar';

export class TreeListToolbarElement extends LegacyElement<typeof TreeListToolbar, TreeListToolbarProps> {
    constructor(props?: TreeListToolbarProps) {
        super(props ?? {}, TreeListToolbar);
    }

    disable() {
        this.props.setKey('enabled', false);
    }

    enable() {
        this.props.setKey('enabled', true);
    }
}
