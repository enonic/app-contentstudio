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
    $latestVersionId,
    $selectedVersions,
    $selectionModeOn,
    $visualFocus,
    revertToVersion,
    toggleVersionSelection,
} from '../../../../store/context/versionStore';
import {getOperationLabel} from '../../../../utils/widget/versions/versions';
import {VersionsListItemPublishStatus} from './VersionsListItemPublishStatus';


export type VersionItemProps = {
    version: ContentVersion;
    isFocused?: boolean;
} & ComponentPropsWithoutRef<'div'>;

export const COMPONENT_NAME = 'VersionsListItem';

export const VersionsListItem = ({version, isFocused, ...props}: VersionItemProps): React.ReactElement => {
    const selectedVersions = useStore($selectedVersions);
    const isSelectionModeOn = useStore($selectionModeOn);

    const latestVersionId = useStore($latestVersionId);
    const isLatestVersion = latestVersionId === version.getId();

    const modifierDisplayName = version.getModifierDisplayName() || version.getPublishInfo()?.getPublisherDisplayName();
    const modifierLabel = useI18n('field.version.by', modifierDisplayName ?? '');

    const {active, setActive} = useListbox();
    const isActiveListItem = active === version.getId();

    const visualFocus = useStore($visualFocus);

    const isSelected = useMemo(() => {
        return selectedVersions.has(version.getId());
    }, [version, selectedVersions]);

    const handleRestoreClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        revertToVersion(version.getId());
    }, [version]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();

        if (!isActiveListItem) {
            setActive(version.getId());
        }
    }, [version, isActiveListItem, setActive]);

    const handleCheckboxClick = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
        e.stopPropagation();
        e.preventDefault();
        toggleVersionSelection(version.getId());

        if (!isActiveListItem) {
            setActive(version.getId());
        }
    }, [version, setActive, isActiveListItem]);


    const handleCheckboxMouseDown = useCallback((e: React.MouseEvent<HTMLLabelElement>) => {
        e.preventDefault();
    }, []);

    const handleButtonMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
    }, []);

    return (
        <div
            data-component={COMPONENT_NAME}
            className={cn(
                'w-full p-2.5 flex flex-col gap-5 hover:bg-surface-neutral-hover cursor-pointer rounded-sm',
            )}
            onClick={handleClick}
            {...props}>
            <div className='w-full flex items-center gap-2'>
                <div className='flex flex-col justify-center grow'>
                    <div className='flex gap-1'>
                                                <span className='shrink-0 text-sm'>{DateHelper.getFormattedTimeFromDate(
                                                    version.getTimestamp())}</span>
                        <span className='text-bdr-soft text-sm'>|</span>
                        <span className='text-sm'>{getOperationLabel(version)}</span>
                    </div>
                    {modifierDisplayName && <div className='text-xs'>{modifierLabel}</div>}
                </div>
                <VersionsListItemPublishStatus version={version}/>
                {
                    isLatestVersion && (
                                        <IconButton
                                            icon={PenLine} size={'sm'}
                                            tabIndex={-1}
                                            onMouseDown={handleButtonMouseDown}
                                            onClick={openContextContentForEdit}
                                            className={cn(
                                                'shrink-0 w-4 bg-transparent',
                                                isActiveListItem && visualFocus === 'edit' && 'ring-2'
                                            )}
                                        />
                                    )
                }
                {
                    isSelectionModeOn && (!isActiveListItem || !isFocused) && (
                                          <div className='flex items-center'>
                                              <Checkbox checked={isSelected} tabIndex={-1} onMouseDown={handleCheckboxMouseDown} onClick={handleCheckboxClick}/>
                                          </div>
                                      )
                }

            </div>
            {
                isFocused && isActiveListItem && (
                                     <div className='w-full flex flex-col gap-5'>
                                         <div className='flex'>
                                             <Button
                                                 label={useI18n('field.version.revert')}
                                                 size='sm'
                                                 variant='solid'
                                                 onClick={handleRestoreClick}
                                                 onMouseDown={handleButtonMouseDown}
                                                 tabIndex={-1}
                                                 className={cn(isSelected && 'ring-1', isActiveListItem && visualFocus === 'restore' && 'ring-2')}
                                             />
                                             <div className={'flex grow items-center justify-end'}>
                                                 <Checkbox
                                                     className={cn('text-sm', isActiveListItem && visualFocus === 'compare' && 'outline-2 outline-offset-4 outline-solid')}
                                                     label={useI18n('field.version.compare')}
                                                     checked={isSelected}
                                                     tabIndex={-1}
                                                     onMouseDown={handleCheckboxMouseDown}
                                                     onClick={handleCheckboxClick}
                                                     align='right'/>
                                             </div>

                                         </div>
                                     </div>
                                 )}
        </div>
    );
}
