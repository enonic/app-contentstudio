import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {Button, Checkbox, cn, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {PenLine} from 'lucide-react';
import {TargetedMouseEvent} from 'preact';
import {ComponentPropsWithoutRef} from 'preact/compat';
import {useCallback, useMemo, useRef} from 'react';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {useI18n} from '../../../../hooks/useI18n';
import {openContextContentForEdit} from '../../../../store/context/contextContent.store';
import {
    $activeVersionId,
    $expandedVersion,
    $selectedVersions,
    $selectionModeOn,
    isVersionSelected, setExpandedVersion,
    toggleVersionSelection
} from '../../../../store/context/versionStore';
import {getOperationLabel, getVersionUser} from '../../../../utils/widget/versions/versions';
import {VersionsListItemPublishStatus} from './VersionsListItemPublishStatus';

export type VersionItemProps = {
    version: ContentVersion;
} & ComponentPropsWithoutRef<'div'>;

export const COMPONENT_NAME = 'VersionsListItem';

export const VersionsListItem = ({version, className, ...props}: VersionItemProps): React.ReactElement => {
    const expanded = useStore($expandedVersion);
    const selectedVersions = useStore($selectedVersions);
    const isSelectionModeOn = useStore($selectionModeOn);
    const activeVersionId = useStore($activeVersionId);

    const byLabel = useI18n('field.version.by', getVersionUser(version));
    const revertLabel = useI18n('field.version.revert');
    const compareLabel = useI18n('field.version.compare');

    const checkBoxDivRef = useRef<HTMLDivElement>(null);

    const isSelected = useMemo(() => {
        return isVersionSelected(version.getId());
    }, [version, selectedVersions]);
    const toggleSelection = useCallback(() => {
        toggleVersionSelection(version.getId());
    }, [version]);
    const isExpanded = useMemo(() => {
        return expanded === version.getId();
    }, [version, expanded]);
    const toggleExpand = useCallback((e: TargetedMouseEvent<HTMLDivElement>) => {
        if (e.target instanceof Node && checkBoxDivRef?.current?.contains(e.target)) { // Workaround until UI Checkbox is fixed
            return;
        }

        setExpandedVersion(isExpanded ? undefined : version.getId());
    }, [version, isExpanded]);
    const handleRestoreClick = useCallback((e: TargetedMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        // restoreVersion(version.getId());
    }, [version]);

    return (
        <div key={version.getId()}
            data-component={COMPONENT_NAME}
            className={cn(
                'p-2.5 flex flex-col gap-5 hover:bg-surface-neutral-hover cursor-pointer',
                isExpanded && 'shadow-sm shadow-btn-tertiary-hover',
                className)}
            onClick={toggleExpand}
            {...props}>
            <div className='w-full flex gap-2'>
                <div className='flex flex-col justify-start grow'>
                    <div className='flex gap-1'>
                        <span className='shrink-0 text-sm'>{DateHelper.getFormattedTimeFromDate(
                            version.getTimestamp())}</span>
                        <span className='text-bdr-soft text-sm'>|</span>
                        <span className='text-sm'>{getOperationLabel(version)}</span>
                    </div>
                    <div className='text-xs'>{byLabel}</div>
                </div>
                <VersionsListItemPublishStatus version={version} />
                {
                    activeVersionId === version.getId() && (
                        <IconButton icon={PenLine} size={'sm'} onClick={openContextContentForEdit} className='shrink-0 w-4 bg-transparent' />
                    )
                }
                {
                    isSelectionModeOn && !isExpanded && (
                        <div ref={checkBoxDivRef} className='flex items-center'>
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={toggleSelection}
                            />
                        </div>
                    )
                }

            </div>
            {
                isExpanded && (
                    <div className='w-full flex flex-col gap-5'>
                        <div className='flex'>
                            <Button
                                label={revertLabel}
                                size='sm'
                                variant='solid'
                                onClick={handleRestoreClick}
                            />
                            <div ref={checkBoxDivRef} className={'flex grow items-center justify-end'}>
                                <Checkbox
                                    className='text-sm'
                                    label={compareLabel}
                                    checked={isSelected}
                                    onCheckedChange={toggleSelection}
                                    align='right' />
                            </div>

                        </div>
                    </div>
                )}
        </div>
    );
}
