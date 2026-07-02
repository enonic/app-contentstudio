import { DateHelper } from '@enonic/lib-admin-ui/util/DateHelper';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { Button, Checkbox, cn, Tooltip, useListbox } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ComponentPropsWithoutRef, ReactElement, useCallback, useMemo } from 'react';
import { ContentId } from '../../../../../../app/content/ContentId';
import { ContentVersion } from '../../../../../../app/ContentVersion';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { VersionItemPublishStatus } from '../../../../shared/status/VersionItemPublishStatus';
import {
    getVersionOperationTime,
    isVersionComparable,
    isVersionRevertable,
    $publishBadgeByVersionId,
    VersionPublishStatus,
    $activeVersionId,
    $comparableVersionsCount,
    $selectedVersions,
    toggleVersionSelection,
} from '../../../../../entities/content/version';
import { getOperationLabel, getVersionBranch, VersionBranch } from './labels';
import { useRevertActions } from './revert/useRevertActions';

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

const useVersionItemState = (version: ContentVersion) => {
    const selectedVersions = useStore($selectedVersions);
    const currentVersionId = useStore($activeVersionId);
    const comparableVersionsCount = useStore($comparableVersionsCount);
    const { active, setActive } = useListbox();

    const versionId = version.getId();
    const isActive = active === versionId;
    const isSelected = useMemo(() => selectedVersions.has(versionId), [versionId, selectedVersions]);
    const isRevertable = version.getId() !== currentVersionId && isVersionRevertable(version);
    const isComparable = isVersionComparable(version) && comparableVersionsCount > 1;

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

type VersionBranchMarkerProps = {
    branch: VersionBranch;
};

// Compact (D)/(M) tag whose tooltip names the target branch (draft/master).
const VersionBranchMarker = ({ branch }: VersionBranchMarkerProps): ReactElement => (
    <Tooltip delay={300} value={branch} asChild>
        <span className="text-subtle text-sm font-semibold">({branch.charAt(0).toUpperCase()})</span>
    </Tooltip>
);

type VersionItemMainInfoProps = {
    version: ContentVersion;
};

const VersionItemMainInfo = ({ version }: VersionItemMainInfoProps): ReactElement => {
    const modifierDisplayName = version.getActions()[0]?.getUserDisplayName();
    const modifierLabel = useI18n('field.version.by', modifierDisplayName ?? '');
    const branch = getVersionBranch(version);

    return (
        <div className="flex flex-col justify-center grow">
            <div className="flex gap-1">
                <span className="shrink-0 text-sm font-semibold">
                    {DateHelper.getFormattedTimeFromDate(getVersionOperationTime(version))}
                </span>
                <span className="text-bdr-soft text-sm">|</span>
                <span className="text-sm font-semibold">{getOperationLabel(version)}</span>
                {branch && <VersionBranchMarker branch={branch} />}
            </div>
            {modifierDisplayName && <div className="text-xs">{modifierLabel}</div>}
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
    const { versionId, isActive, isSelected, isRevertable, isComparable, setActive } = useVersionItemState(version);

    const revertActions = useRevertActions();
    const revertLabel = useI18n('field.version.revert');

    const handleMouseDown = useCallback(() => {
        if (!isActive) {
            setActive(versionId);
        }
    }, [versionId, isActive, setActive]);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            onToggleExpanded?.(versionId);
        },
        [versionId, onToggleExpanded],
    );

    const handleCheckboxClick = useCallback(
        (e: React.MouseEvent<HTMLLabelElement>) => {
            e.stopPropagation();
            e.preventDefault();
            toggleVersionSelection(versionId);
        },
        [versionId],
    );

    const handleRestoreClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            revertActions?.requestRevert(contentId, versionId);
        },
        [revertActions, contentId, versionId],
    );

    const publishMessage = version.getPublishInfo() ? version.getComment() : undefined;
    const publishBadges = useStore($publishBadgeByVersionId);
    const badge = useMemo(() => publishBadges.get(versionId), [versionId, publishBadges]);
    const showRestoreButton = revertActions != null && isExpanded && isRevertable;

    const publishStatusMessage = useMemo(() => {
        if (!badge) return undefined;

        if (badge.status === VersionPublishStatus.SCHEDULED && badge.publishedFrom) {
            return i18n('widget.versionhistory.scheduled', DateHelper.formatDateTime(badge.publishedFrom));
        }

        if (badge.status === VersionPublishStatus.EXPIRED && badge.publishedTo) {
            return i18n('widget.versionhistory.expired', DateHelper.formatDateTime(badge.publishedTo));
        }

        // Online version with a scheduled expiry keeps the "Published until" message.
        if (badge.isOnline && badge.status === VersionPublishStatus.PUBLISHED && badge.publishedTo) {
            return i18n('widget.versionhistory.publishedUntil', DateHelper.formatDateTime(badge.publishedTo));
        }

        // A published version shows its publish (and, if unpublished, unpublish) date.
        if (badge.publishedFrom) {
            if (badge.unpublishedAt) {
                return i18n(
                    'widget.versionhistory.publishedFromTo',
                    DateHelper.formatDateTime(badge.publishedFrom),
                    DateHelper.formatDateTime(badge.unpublishedAt),
                );
            }
            return i18n('widget.versionhistory.publishedFrom', DateHelper.formatDateTime(badge.publishedFrom));
        }

        return undefined;
    }, [badge]);

    return (
        <div
            data-component={COMPONENT_NAME}
            className="group w-full p-2.5 flex flex-col gap-5 cursor-pointer rounded-sm"
            onMouseDownCapture={handleMouseDown}
            onClick={handleClick}
            {...props}
        >
            <div className="w-full flex items-center gap-2">
                <div className="w-7.5 h-full flex justify-center items-center">
                    {isComparable && (
                        <Checkbox
                            checked={isSelected}
                            tabIndex={-1}
                            onMouseDown={preventFocusChange}
                            onClick={handleCheckboxClick}
                        />
                    )}
                </div>

                <VersionItemMainInfo version={version} />

                <VersionItemPublishStatus version={version} />
            </div>

            {isExpanded && publishMessage && <div className="text-sm font-normal">{publishMessage}</div>}

            {showRestoreButton ? (
                <div className="w-full flex items-center gap-2">
                    {publishStatusMessage && <span className="text-xs font-normal">{publishStatusMessage}</span>}
                    <Button
                        label={revertLabel}
                        size="sm"
                        variant="solid"
                        onClick={handleRestoreClick}
                        onMouseDown={preventFocusChange}
                        tabIndex={-1}
                        className={cn('ml-auto shrink-0', isRestoreFocused && 'ring-2')}
                    />
                </div>
            ) : (
                isExpanded && publishStatusMessage && <div className="text-xs font-normal ">{publishStatusMessage}</div>
            )}
        </div>
    );
};

VersionsListItem.displayName = COMPONENT_NAME;
