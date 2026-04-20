import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Button, Checkbox, cn, useListbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ComponentPropsWithoutRef, ReactElement, useCallback, useMemo} from 'react';
import {ContentId} from '../../../../../../app/content/ContentId';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {useI18n} from '../../../../hooks/useI18n';
import {VersionItemPublishStatus} from '../../../../shared/status/VersionItemPublishStatus';
import {
    $activePublishedFrom,
    $activePublishedTo,
    $activePublishStatus,
    $activePublishVersionId,
    $activeVersionId,
    $pastPublishBadges,
    $selectedVersions,
    getOperationLabel,
    isVersionComparable,
    isVersionRevertable,
    requestRevert,
    toggleVersionSelection,
    VersionPublishStatus,
} from '../../../../store/context/versionStore';

const COMPONENT_NAME = 'VersionsListItem';

const preventFocusChange = (e: React.MouseEvent<HTMLElement>): void => {
    e.preventDefault();
};

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
    const currentVersionId = useStore($activeVersionId);
    const {active, setActive} = useListbox();

    const versionId = version.getId();
    const isActive = active === versionId;
    const isSelected = useMemo(() => selectedVersions.has(versionId), [versionId, selectedVersions]);
    const isRevertable = version.getId() !== currentVersionId && isVersionRevertable(version);
    const isComparable = isVersionComparable(version);

    return {
        versionId,
        isActive,
        isSelected,
        isRevertable,
        isComparable,
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
    const modifierDisplayName = version.getActions()[0]?.getUserDisplayName();
    const modifierLabel = useI18n('field.version.by', modifierDisplayName ?? '');

    return (
        <div className='flex flex-col justify-center grow'>
            <div className='flex gap-1'>
                <span className='shrink-0 text-sm font-semibold'>
                    {DateHelper.getFormattedTimeFromDate(version.getTimestamp())}
                </span>
                <span className='text-bdr-soft text-sm'>|</span>
                <span className='text-sm font-semibold'>{getOperationLabel(version)}</span>
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
        isComparable,
        setActive,
    } = useVersionItemState(version, isFocused);

    const revertLabel = useI18n('field.version.revert');

    const handleMouseDown = useCallback(() => {
        if (!isActive) {
            setActive(versionId);
        }
    }, [versionId, isActive, setActive]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onToggleExpanded?.(versionId);
    }, [versionId, onToggleExpanded]);

    const handleCheckboxClick = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
        e.stopPropagation();
        e.preventDefault();
        toggleVersionSelection(versionId);
    }, [versionId]);

    const handleRestoreClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        requestRevert(contentId, versionId);
    }, [contentId, versionId]);

    const publishMessage = version.getPublishInfo() ? version.getComment() : undefined;
    const activePublishVersionId = useStore($activePublishVersionId);
    const publishStatus = useStore($activePublishStatus);
    const publishedFrom = useStore($activePublishedFrom);
    const publishedTo = useStore($activePublishedTo);
    const pastPublishBadges = useStore($pastPublishBadges);
    const showRestoreButton = isExpanded && isRevertable;

    const pastBadge = useMemo(
        () => pastPublishBadges.get(versionId),
        [versionId, pastPublishBadges],
    );

    const publishStatusMessage = useMemo(() => {
        if (versionId === activePublishVersionId) {
            if (publishStatus === VersionPublishStatus.PUBLISHED) {
                return publishedTo ? i18n('widget.versionhistory.publishedUntil', DateHelper.formatDateTime(publishedTo)) : undefined;
            }
            if (publishStatus === VersionPublishStatus.SCHEDULED) {
                return publishedFrom ? i18n('widget.versionhistory.scheduled', DateHelper.formatDateTime(publishedFrom)) : undefined;
            }
            if (publishStatus === VersionPublishStatus.EXPIRED) {
                return publishedTo ? i18n('widget.versionhistory.expired', DateHelper.formatDateTime(publishedTo)) : undefined;
            }
        }

        if (pastBadge?.publishStatus === VersionPublishStatus.EXPIRED && pastBadge.publishedTo) {
            return i18n('widget.versionhistory.expired', DateHelper.formatDateTime(pastBadge.publishedTo));
        }

        return undefined;
    }, [versionId, activePublishVersionId, publishStatus, publishedFrom, publishedTo, pastBadge]);

    return (
        <div
            data-component={COMPONENT_NAME}
            className='group w-full p-2.5 flex flex-col gap-5 cursor-pointer rounded-sm'
            onMouseDownCapture={handleMouseDown}
            onClick={handleClick}
            {...props}
        >
            <div className='w-full flex items-center gap-2'>
                <div className='w-7.5 h-full flex justify-center items-center'>
                    {isComparable ? (
                        <Checkbox
                            checked={isSelected}
                            tabIndex={-1}
                            onMouseDown={preventFocusChange}
                            onClick={handleCheckboxClick}
                        />
                    ) : (
                        <></>// <VersionsListItemIcon version={version} />
                    )}
                </div>

                <VersionItemMainInfo version={version} />

                <VersionItemPublishStatus version={version} />

            </div>

            {isExpanded && publishMessage && (
                <div className='text-sm font-normal'>{publishMessage}</div>
            )}

            {isExpanded && publishStatusMessage && (
                <div className='text-sm font-normal'>{publishStatusMessage}</div>
            )}

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
