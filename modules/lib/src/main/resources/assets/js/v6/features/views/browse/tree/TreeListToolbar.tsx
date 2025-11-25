import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Checkbox, CheckboxChecked, cn, IconButton, Toggle} from '@enonic/ui';
import {RefreshCcw} from 'lucide-react';
import {ReactElement, useMemo, useState} from 'react';
import {useStore} from '@nanostores/preact';
import {useI18n} from '../../../hooks/useI18n';
import {$contentTreeRootLoadingState, reload} from '../../../store/contentTreeLoadingStore';
import {resetSelection, selectAllItems, setMultipleSelectionMode} from '../../../store/contentTreeSelectionStore';
import {$isAllSelected, $isNoneSelected, $numberOfSelected} from '../../../store/contentTreeSelectionToolbarStore';

type TreeListToolbarProps = {
    enabled?: boolean;
    handleToggleClick?: (pressed: boolean) => void;
};

type TogglerProps = Pick<TreeListToolbarProps, 'handleToggleClick'>;

const Toggler = ({handleToggleClick}: TogglerProps): ReactElement => {
    const selectedLabel = useI18n('field.treeListToolbar.selected');
    const showSelectedLabel = useI18n('field.treeListToolbar.showSelected');
    const showAllLabel = useI18n('field.treeListToolbar.showAll');

    const [togglePressed, setTogglePressed] = useState(false);

    const numberOfSelectedContents = useStore($numberOfSelected);

    return (
        <Toggle
            className="flex items-center gap-2"
            variant="filled"
            aria-label={togglePressed ? showSelectedLabel : showAllLabel}
            pressed={togglePressed}
            onPressedChange={(pressed) => {
                setTogglePressed(pressed);
                handleToggleClick(pressed);
            }}
        >
            <span
                className={cn(
                    'flex items-center justify-center rounded-full shrink-0 text-xs text-main bg-surface-neutral',
                    numberOfSelectedContents < 10 ? 'size-6' : 'px-2',
                    numberOfSelectedContents === 0 && 'hidden'
                )}
            >
                {numberOfSelectedContents}
            </span>

            <span>{selectedLabel}</span>
        </Toggle>
    );
};

const TreeListToolbar = ({enabled = true, handleToggleClick = () => { }}: TreeListToolbarProps): ReactElement => {
    const loadingState = useStore($contentTreeRootLoadingState);
    const isLoading = loadingState === 'loading';
    const isAllSelected = useStore($isAllSelected);
    const totalSelected = useStore($numberOfSelected);
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
            setMultipleSelectionMode();
            selectAllItems();
            return;
        }

        resetSelection();
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
                {/*{numberOfSelectedContents > 0 && <Toggler handleToggleClick={handleToggleClick} />}*/}
            </div>

            <IconButton icon={RefreshCcw} disabled={isLoading || !enabled} onClick={reload} />
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
