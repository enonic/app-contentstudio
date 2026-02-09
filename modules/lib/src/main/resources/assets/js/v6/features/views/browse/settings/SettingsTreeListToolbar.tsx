import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Checkbox, CheckboxChecked, IconButton} from '@enonic/ui';
import {RefreshCcw} from 'lucide-react';
import {ReactElement, useMemo} from 'react';
import {useStore} from '@nanostores/preact';
import {useI18n} from '../../../hooks/useI18n';
import {reloadProjects} from '../../../store/projects.store';
import {$isAllSelected, $isNoneSelected, $selectionCount, clearSelection, selectAll, setActive} from '../../../store/settingsTreeSelection.store';
import {resetSettingsTreeForReload} from '../../../store/settings-tree.store';

type SettingsTreeListToolbarProps = {
    enabled?: boolean;
};

const handleReload = (): void => {
    clearSelection();
    setActive(null);
    resetSettingsTreeForReload();
    reloadProjects();
};

const SettingsTreeListToolbar = ({enabled = true}: SettingsTreeListToolbarProps): ReactElement => {
    const isAllSelected = useStore($isAllSelected);
    const totalSelected = useStore($selectionCount);
    const isNoneSelected = useStore($isNoneSelected);
    const selectAllLabel = isNoneSelected
        ? useI18n('field.treeListToolbar.selectAll')
        : useI18n('field.treeListToolbar.deselectAll', totalSelected);

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
                    disabled={!enabled}
                    onClick={handleCheckboxClick}
                />
            </div>

            <IconButton icon={RefreshCcw} disabled={!enabled} onClick={handleReload} />
        </div>
    );
};

SettingsTreeListToolbar.displayName = 'SettingsTreeListToolbar';

export class SettingsTreeListToolbarElement extends LegacyElement<typeof SettingsTreeListToolbar, SettingsTreeListToolbarProps> {
    constructor(props?: SettingsTreeListToolbarProps) {
        super(props ?? {}, SettingsTreeListToolbar);
    }

    disable() {
        this.props.setKey('enabled', false);
    }

    enable() {
        this.props.setKey('enabled', true);
    }
}
