import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {Button, Checkbox, cn, IconButton, useListbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {PenLine} from 'lucide-react';
import {ComponentPropsWithoutRef} from 'preact/compat';
import {useCallback, useMemo} from 'react';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {useI18n} from '../../../../hooks/useI18n';
import {openContextContentForEdit} from '../../../../store/context/contextContent.store';
import {
    $activeVersionId,
    $selectedVersions,
    $selectionModeOn, $versionsListFilter,
    $visualFocus,
    revertToVersion,
    toggleVersionSelection,
} from '../../../../store/context/versionStore';
import {getOperationLabel} from '../../../../utils/widget/versions/versions';
import {VersionsListItemPublishStatus} from './VersionsListItemPublishStatus';

const COMPONENT_NAME = 'VersionsListItem';

/**
 * Component for displaying a single version item in the versions list
 * Shows version info, actions (edit, restore, compare) with keyboard navigation support
 */
interface VersionsListItemProps extends ComponentPropsWithoutRef<'div'> {
    version: ContentVersion;
    isFocused?: boolean;
}

export const VersionsListItem = ({version, isFocused, ...props}: VersionsListItemProps): React.ReactElement => {
    const selectedVersions = useStore($selectedVersions);
    const isSelectionModeOn = useStore($selectionModeOn);
    const latestVersionId = useStore($activeVersionId);
    const visualFocus = useStore($visualFocus);
    const versionsListFilter = useStore($versionsListFilter);

    const {active, setActive} = useListbox();

    const versionId = version.getId();
    const isLatestVersion = latestVersionId === versionId;
    const isActiveListItem = active === versionId;
    const isSelected = useMemo(() => selectedVersions.has(versionId), [versionId, selectedVersions]);
    const showActiveControls = isFocused && isActiveListItem && versionsListFilter === 'data';
    const showCheckboxInline = isSelectionModeOn && (!isActiveListItem || !isFocused);

    const modifierDisplayName = version.getModifierDisplayName() || version.getPublishInfo()?.getPublisherDisplayName();
    const modifierLabel = useI18n('field.version.by', modifierDisplayName ?? '');
    const revertLabel = useI18n('field.version.revert');
    const compareLabel = useI18n('field.version.compare');

    const handleRestoreClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        revertToVersion(versionId);
    }, [versionId]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!isActiveListItem) {
            setActive(versionId);
        }
    }, [versionId, isActiveListItem, setActive]);

    const handleCheckboxClick = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
        e.stopPropagation();
        e.preventDefault();
        toggleVersionSelection(versionId);

        if (!isActiveListItem) {
            setActive(versionId);
        }
    }, [versionId, setActive, isActiveListItem]);

    const preventFocusChange = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
    }, []);

    return (
        <div
            data-component={COMPONENT_NAME}
            className='w-full p-2.5 flex flex-col gap-5 hover:bg-surface-neutral-hover cursor-pointer rounded-sm'
            onClick={handleClick}
            {...props}
        >
            <div className='w-full flex items-center gap-2'>
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

                <VersionsListItemPublishStatus version={version} />

                {isLatestVersion && (
                    <IconButton
                        icon={PenLine}
                        size='sm'
                        tabIndex={-1}
                        onMouseDown={preventFocusChange}
                        onClick={openContextContentForEdit}
                        className={cn('shrink-0 w-4 bg-transparent', isActiveListItem && visualFocus === 'edit' && 'ring-2')}
                    />
                )}

                {showCheckboxInline && (
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
                <div className='w-full flex flex-col gap-5'>
                    <div className='flex'>
                        <Button
                            label={revertLabel}
                            size='sm'
                            variant='solid'
                            onClick={handleRestoreClick}
                            onMouseDown={preventFocusChange}
                            tabIndex={-1}
                            className={cn(isSelected && 'ring-1', isActiveListItem && visualFocus === 'restore' && 'ring-2')}
                        />
                        <div className='flex grow items-center justify-end'>
                            <Checkbox
                                className={cn('text-sm', isActiveListItem && visualFocus === 'compare' && 'outline-2 outline-offset-4 outline-solid')}
                                label={compareLabel}
                                checked={isSelected}
                                tabIndex={-1}
                                onMouseDown={preventFocusChange}
                                onClick={handleCheckboxClick}
                                align='right'
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

VersionsListItem.displayName = COMPONENT_NAME;
