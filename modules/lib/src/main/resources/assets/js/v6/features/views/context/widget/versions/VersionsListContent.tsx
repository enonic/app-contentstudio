import {Listbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {KeyboardEvent, ReactElement, RefObject} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../../../app/ContentVersion';
import {$versionsDisplayMode} from '../../../../store/context/versionStore';
import {VersionsListItem} from './VersionsListItem';

const COMPONENT_NAME = 'VersionsListContent';

type VersionsListContentProps = {
    content: ContentSummaryAndCompareStatus;
    versionsByDate: Record<string, ContentVersion[]>;
    activeVersionId: string | null;
    expandedVersionId: string | null;
    restoreFocusVersionId: string | null;
    isFocused: boolean;
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
    onToggleExpanded: (versionId: string) => void;
    listRef: RefObject<HTMLDivElement>;
};

export const VersionsListContent = ({
    content,
    versionsByDate,
    activeVersionId,
    expandedVersionId,
    restoreFocusVersionId,
    isFocused,
    onKeyDown,
    onToggleExpanded,
    listRef
}: VersionsListContentProps): ReactElement => {
    const displayMode = useStore($versionsDisplayMode);

    return (
        <Listbox.Content
            className='flex flex-col gap-7.5 max-h-none p-0 overflow-y-visible'
            onKeyDownCapture={onKeyDown}
            ref={listRef}
            data-component={COMPONENT_NAME}
        >
            {Object.entries(versionsByDate).map(([date, versions]) => (
                <div key={date} className='flex flex-col gap-3 w-full'>
                    <div className='text-base font-semibold'>{date}</div>

                    <div className='flex flex-col gap-1.25'>
                        {versions.map((version) => (
                            <Listbox.Item
                                key={`${version.getId()}-${displayMode}`}
                                value={version.getId()}
                                className='p-0 rounded-sm'
                                data-active={isFocused && activeVersionId === version.getId()}
                            >
                                <VersionsListItem
                                    contentId={content.getContentId()}
                                    version={version}
                                    isFocused={isFocused}
                                    isExpanded={expandedVersionId === version.getId()}
                                    isRestoreFocused={restoreFocusVersionId === version.getId()}
                                    onToggleExpanded={onToggleExpanded}
                                />
                            </Listbox.Item>
                        ))}
                    </div>
                </div>
            ))}
        </Listbox.Content>
    );
};

VersionsListContent.displayName = COMPONENT_NAME;
