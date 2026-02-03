import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Checkbox, CheckboxChecked, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {RefreshCcw} from 'lucide-react';
import {ReactElement, useMemo} from 'react';
import {activateFilter, fetchRootChildrenIdsOnly, getFilterQuery} from '../../../api/content-fetcher';
import {useI18n} from '../../../hooks/useI18n';
import {$isFilterActive} from '../../../store/active-tree.store';
import {clearContentCache} from '../../../store/content.store';
import {$isAllLoadedSelected, $isNoneSelected, $selectionCount, clearSelection, selectAll} from '../../../store/contentTreeSelection.store';
import {$rootLoadingState, resetTree} from '../../../store/tree-list.store';

type TreeListToolbarProps = {
    enabled?: boolean;
};

const handleReload = (): void => {
    if ($isFilterActive.get()) {
        const query = getFilterQuery();
        if (query) void activateFilter(query);
    } else {
        resetTree();
        clearContentCache();
        void fetchRootChildrenIdsOnly();
    }
};

const TreeListToolbar = ({enabled = true}: TreeListToolbarProps): ReactElement => {
    const loadingState = useStore($rootLoadingState);
    const isLoading = loadingState === 'loading';
    const isAllSelected = useStore($isAllLoadedSelected);
    const totalSelected = useStore($selectionCount);
    const isNoneSelected = useStore($isNoneSelected);
    const selectAllLabel = isNoneSelected ? useI18n('field.treeListToolbar.selectAll') : useI18n('field.treeListToolbar.deselectAll',
        totalSelected);

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

            <IconButton icon={RefreshCcw} disabled={isLoading || !enabled} onClick={handleReload} />
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
