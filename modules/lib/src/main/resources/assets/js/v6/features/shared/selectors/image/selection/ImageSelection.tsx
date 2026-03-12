import {useEffect, useState, type ReactElement} from 'react';
import {ImageSelectionItem} from './ImageSelectionItem';
import {type ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {fetchContentByIds} from '../../../../api/content-fetcher';
import {type ImageSelectorMode} from '../image-selector.types';
import {SortableList} from '../../../lists';
import {$activeProject} from '../../../../store/projects.store';
import {useStore} from '@nanostores/preact';

export type ImageSelectionProps = {
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Selection mode */
    selectionMode?: ImageSelectorMode;
    /** Whether the selection is disabled */
    disabled?: boolean;
    /** Additional CSS class */
    className?: string;
};

const IMAGE_SELECTION_NAME = 'ImageSelection';

// Get a list of content ids, fetch those contents, render them and allow selection reordering.
export const ImageSelection = ({selectionMode, disabled, selection, onSelectionChange, className}: ImageSelectionProps): ReactElement => {
    // States
    const activeProject = useStore($activeProject);
    const [contents, setContents] = useState<ContentSummaryAndCompareStatus[]>([]);

    // Fetch contents
    useEffect(() => {
        const contentIds = selection as string[];
        fetchContentByIds(contentIds).then(setContents);
    }, [selection]);

    // Handlers
    const handleReorder = (fromIndex: number, toIndex: number) => {
        const newContents = [...contents];
        const [movedContent] = newContents.splice(fromIndex, 1);
        newContents.splice(toIndex, 0, movedContent);
        setContents(newContents);
    };

    if (!contents || contents.length === 0) return null;

    return (
        <SortableList
            data-component={IMAGE_SELECTION_NAME}
            items={contents}
            enabled={!disabled}
            onReorder={handleReorder}
            className={className}
            renderItem={(content, context) => (
                <ImageSelectionItem
                    key={content.getId()}
                    project={activeProject}
                    content={content}
                    context={context}
                    disabled={disabled}
                    selection={selection}
                    selectionMode={selectionMode}
                    onSelectionChange={onSelectionChange}
                />
            )}
        />
    );
};

ImageSelection.displayName = IMAGE_SELECTION_NAME;
