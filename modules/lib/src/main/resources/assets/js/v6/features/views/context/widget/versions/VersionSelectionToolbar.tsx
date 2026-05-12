import {Button} from '@enonic/ui';
import React, {useCallback} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {type ContentVersion} from '../../../../../../app/ContentVersion';
import {useI18n} from '../../../../hooks/useI18n';
import {resetVersionsSelection} from '../../../../store/context/versionStore';
import {openCompareVersionsDialog} from './compare/store';

const COMPONENT_NAME = 'VersionSelectionToolbar';

/**
 * Toolbar component for version selection actions.
 * Shows "Compare" and "Cancel" buttons when versions are selected.
 */
interface VersionSelectionToolbarProps {
    selectionSize: number;
    selectedVersions: ContentVersion[];
    content?: ContentSummary | null;
    onCancel?: () => void;
}

export const VersionSelectionToolbar = ({
    selectionSize,
    selectedVersions,
    content,
    onCancel,
}: VersionSelectionToolbarProps): React.ReactElement => {
    const showChangesButtonLabel = useI18n('text.versions.showChanges');
    const cancelButtonLabel = useI18n('action.cancel');

    const handleShowChanges = useCallback(() => {
        if (!content || selectedVersions.length !== 2) {
            return;
        }

        openCompareVersionsDialog(content, [selectedVersions[0], selectedVersions[1]]);
    }, [content, selectedVersions]);

    const handleCancel = useCallback(() => {
        resetVersionsSelection();
        onCancel?.();
    }, [onCancel]);

    return (
        <div
            className='flex justify-center items-center gap-2.5 sticky top-0 bg-surface-neutral min-h-16 z-1'
            data-component={COMPONENT_NAME}
        >
            <Button
                label={showChangesButtonLabel}
                variant='filled'
                onClick={handleShowChanges}
                disabled={selectionSize !== 2}
            />
            <Button
                label={cancelButtonLabel}
                variant='outline'
                onClick={handleCancel}
            />
        </div>
    );
};

VersionSelectionToolbar.displayName = COMPONENT_NAME;
