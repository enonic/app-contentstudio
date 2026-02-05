import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {Button, Checkbox, cn, useListbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ComponentPropsWithoutRef, ReactElement, useCallback, useMemo} from 'react';
import {ContentId} from '../../../../../../app/content/ContentId';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {useI18n} from '../../../../hooks/useI18n';
import {VersionItemPublishStatus} from '../../../../shared/status/VersionItemPublishStatus';
import {
    $activeVersionId,
    $selectedVersions,
    $selectionModeOn,
    getOperationLabel,
    isVersionRevertable,
    revertToVersion,
    toggleVersionSelection,
} from '../../../../store/context/versionStore';
import {VersionsListItemIcon} from './VersionListItemIcon';

const COMPONENT_NAME = 'VersionsListItem';

// ============================================================================
// Types
// ============================================================================

type VersionsListItemProps = {
    contentId: ContentId;
    version: ContentVersion;
    isFocused?: boolean;
    isExpanded?: boolean;
    isRestoreFocused?: boolean;
    onToggleExpanded?: (versionId: string) => void;
} & ComponentPropsWithoutRef<'div'>;

// ============================================================================
// Utility Hooks
// ============================================================================

const useVersionItemState = (version: ContentVersion, isFocused: boolean) => {
    const selectedVersions = useStore($selectedVersions);
    const isSelectionModeOn = useStore($selectionModeOn);
    const currentVersionId = useStore($activeVersionId);
    const {active, setActive} = useListbox();

    const versionId = version.getId();
    const isActive = active === versionId;
    const isSelected = useMemo(() => selectedVersions.has(versionId), [versionId, selectedVersions]);
    const isRevertable = version.getId() !== currentVersionId && isVersionRevertable(version);

    const forceShowCheckbox = isSelectionModeOn || (isFocused && isActive);

    return {
        versionId,
        isActive,
        isSelected,
        isRevertable,
        forceShowCheckbox,
        setActive,
    };
};

// ============================================================================
// Subcomponents
// ============================================================================

type VersionItemMainInfoProps = {
    version: ContentVersion;
};

const VersionItemMainInfo = ({version}: VersionItemMainInfoProps): ReactElement => {
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

// ============================================================================
// Main Component
// ============================================================================

/**
 * Component for displaying a single version item in the versions list
 * Shows version info with keyboard navigation support
 * Click to expand/collapse, Space to toggle selection
 */
export const VersionsListItem = ({
    contentId,
    version,
    isFocused = false,
    isExpanded = false,
    isRestoreFocused = false,
    onToggleExpanded,
    ...props
}: VersionsListItemProps): ReactElement => {
    const {
        versionId,
        isActive,
        isSelected,
        isRevertable,
        forceShowCheckbox,
        setActive,
    } = useVersionItemState(version, isFocused);

    const revertLabel = useI18n('field.version.revert');

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!isActive) {
            setActive(versionId);
        }
        onToggleExpanded?.(versionId);
    }, [versionId, isActive, setActive, onToggleExpanded]);

    const handleCheckboxClick = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
        e.stopPropagation();
        e.preventDefault();
        toggleVersionSelection(versionId);
    }, [versionId]);

    const handleRestoreClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        revertToVersion(contentId, versionId);
    }, [contentId, versionId]);

    const preventFocusChange = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
    }, []);

    const showRestoreButton = isExpanded && isRevertable;

    return (
        <div
            data-component={COMPONENT_NAME}
            className='group w-full p-2.5 flex flex-col gap-5 cursor-pointer rounded-sm'
            onClick={handleClick}
            {...props}
        >
            <div className='w-full flex items-center gap-2'>
                <div className='w-7.5 h-full flex justify-center items-center'>
                    <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        onMouseDown={preventFocusChange}
                        onClick={handleCheckboxClick}
                        className={cn(forceShowCheckbox ? 'flex' : 'hidden group-hover:flex')}
                    />
                    <div className={cn(forceShowCheckbox ? 'hidden' : 'flex group-hover:hidden')}>
                        <VersionsListItemIcon version={version} />
                    </div>
                </div>

                <VersionItemMainInfo version={version} />

                <VersionItemPublishStatus version={version} />

            </div>

            {showRestoreButton && (
                <div className='w-full flex justify-end'>
                    <Button
                        label={revertLabel}
                        size='sm'
                        variant='solid'
                        onClick={handleRestoreClick}
                        onMouseDown={preventFocusChange}
                        tabIndex={-1}
                        className={cn(isRestoreFocused && 'ring-2')}
                    />
                </div>
            )}
        </div>
    );
};

VersionsListItem.displayName = COMPONENT_NAME;
