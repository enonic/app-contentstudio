import {Button} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useCallback} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$selectedVersions, resetVersionsSelection} from '../../../../store/context/versionStore';

const COMPONENT_NAME = 'VersionSelectionToolbar';

export const VersionSelectionToolbar = (): React.ReactElement => {
    const selection = useStore($selectedVersions);
    const showChangesButtonLabel = useI18n('text.versions.showChanges');
    const cancelButtonLabel = useI18n('action.cancel');

    const cancelHandler = useCallback(() => {
        resetVersionsSelection();
    }, []);

    return (
        <div className='flex justify-center items-center gap-2.5 sticky top-0 bg-surface-neutral/85 py-3 z-1' data-component={COMPONENT_NAME}>
            <Button label={showChangesButtonLabel} variant='filled' disabled={selection.size !== 2} />
            <Button label={cancelButtonLabel} variant='outline' onClick={cancelHandler} />
        </div>
    )
}
