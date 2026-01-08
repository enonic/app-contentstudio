import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {Button, Checkbox, cn, useListbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ComponentPropsWithoutRef, ReactElement, useCallback, useMemo} from 'react';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {useI18n} from '../../../../hooks/useI18n';
import {VersionItemPublishStatus} from '../../../../shared/status/VersionItemPublishStatus';
import {
    $selectedVersions,
    $selectionModeOn,
    $versionsDisplayMode,
    $visualFocus,
    getOperationLabel,
    isVersionsComparable,
    revertToVersion,
    toggleVersionSelection,
    VisualTarget,
} from '../../../../store/context/versionStore';
import {VersionsListItemIcon} from './VersionListItemIcon';

const COMPONENT_NAME = 'VersionsListItem';

// ============================================================================
// Types
// ============================================================================

interface VersionsListItemProps extends ComponentPropsWithoutRef<'div'> {
    version: ContentVersion;
    isFocused?: boolean;
}

// ============================================================================
// Utility Hooks
// ============================================================================

const useVersionItemState = (version: ContentVersion, isFocused: boolean) => {
    const selectedVersions = useStore($selectedVersions);
    const isSelectionModeOn = useStore($selectionModeOn);
    const visualFocus = useStore($visualFocus);
    const displayMode = useStore($versionsDisplayMode);
    const {active, setActive} = useListbox();

    const versionId = version.getId();
    const isComparable = useMemo(() => isVersionsComparable(version), [version]);
    const isActive = active === versionId;
    const isSelected = useMemo(() => selectedVersions.has(versionId), [versionId, selectedVersions]);

    const showActiveControls = isFocused && isActive && displayMode === 'standard' && isComparable;
    const showInlineCheckbox = isSelectionModeOn && isComparable && (!isActive || !isFocused);

    return {
        versionId,
        isActive,
        isSelected,
        isComparable,
        visualFocus,
        showActiveControls,
        showInlineCheckbox,
        setActive,
    };
};

// ============================================================================
// Subcomponents
// ============================================================================

interface VersionItemHeaderProps {
    version: ContentVersion;
}

const VersionItemHeader = ({version}: VersionItemHeaderProps): ReactElement => {
    const modifierDisplayName = version.getModifierDisplayName() || version.getPublishInfo()?.getPublisherDisplayName();
    const modifierLabel = useI18n('field.version.by', modifierDisplayName ?? '');

    return (
        <div className='flex flex-col justify-center grow'>
            <div className='flex gap-1'>
                <span className='shrink-0 text-sm'>
                    {DateHelper.getFormattedTimeFromDate(version.getTimestamp())}
                </span>
                <span className='text-bdr-soft text-sm'>|</span>
                <span className='text-sm'>{getOperationLabel(version)}</span>
            </div>
            {modifierDisplayName && (
                <div className='text-xs'>{modifierLabel}</div>
            )}
        </div>
    );
};

interface VersionItemActionsProps {
    versionId: string;
    isActive: boolean;
    isSelected: boolean;
    visualFocus: VisualTarget | null;
    preventFocusChange: (e: React.MouseEvent<HTMLElement>) => void;
    onCheckboxClick: (e: React.MouseEvent<HTMLLabelElement>) => void;
}

const VersionItemActions = ({
    versionId,
    isActive,
    isSelected,
    visualFocus,
    preventFocusChange,
    onCheckboxClick,
}: VersionItemActionsProps): ReactElement => {
    const revertLabel = useI18n('field.version.revert');
    const compareLabel = useI18n('field.version.compare');

    const handleRestoreClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        revertToVersion(versionId);
    }, [versionId]);

    return (
        <div className='w-full flex flex-col gap-5'>
            <div className='flex'>
                <Button
                    label={revertLabel}
                    size='sm'
                    variant='solid'
                    onClick={handleRestoreClick}
                    onMouseDown={preventFocusChange}
                    tabIndex={-1}
                    className={cn(
                        isSelected && 'ring-1',
                        isActive && visualFocus === 'restore' && 'ring-2'
                    )}
                />
                <div className='flex grow items-center justify-end'>
                    <Checkbox
                        className={cn(
                            'text-sm',
                            isActive && visualFocus === 'compare' && 'outline-2 outline-offset-4 outline-solid'
                        )}
                        label={compareLabel}
                        checked={isSelected}
                        tabIndex={-1}
                        onMouseDown={preventFocusChange}
                        onClick={onCheckboxClick}
                        align='right'
                    />
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Component for displaying a single version item in the versions list
 * Shows version info, actions (restore, compare) with keyboard navigation support
 */
export const VersionsListItem = ({version, isFocused = false, ...props}: VersionsListItemProps): ReactElement => {
    const {
        versionId,
        isActive,
        isSelected,
        visualFocus,
        showActiveControls,
        showInlineCheckbox,
        setActive,
    } = useVersionItemState(version, isFocused);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!isActive) {
            setActive(versionId);
        }
    }, [versionId, isActive, setActive]);

    const handleCheckboxClick = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
        e.stopPropagation();
        e.preventDefault();
        toggleVersionSelection(versionId);
    }, [versionId]);

    const preventFocusChange = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
    }, []);

    return (
        <div
            data-component={COMPONENT_NAME}
            className='w-full p-2.5 flex flex-col gap-5 cursor-pointer rounded-sm'
            onClick={handleClick}
            {...props}
        >
            <div className='w-full flex items-center gap-2'>
                <VersionsListItemIcon version={version} />

                <VersionItemHeader version={version} />

                <VersionItemPublishStatus version={version} />

                {showInlineCheckbox && (
                    <div className='flex items-center'>
                        <Checkbox
                            checked={isSelected}
                            tabIndex={-1}
                            onMouseDown={preventFocusChange}
                            onClick={handleCheckboxClick}
                        />
                    </div>
                )}
            </div>

            {showActiveControls && (
                <VersionItemActions
                    versionId={versionId}
                    isActive={isActive}
                    isSelected={isSelected}
                    visualFocus={visualFocus}
                    preventFocusChange={preventFocusChange}
                    onCheckboxClick={handleCheckboxClick}
                />
            )}
        </div>
    );
};

VersionsListItem.displayName = COMPONENT_NAME;
