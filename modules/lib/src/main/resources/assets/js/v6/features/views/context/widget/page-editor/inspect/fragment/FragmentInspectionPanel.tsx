import {Button} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useCallback, type ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../../../../../app/event/EditContentEvent';
import {FragmentComponent} from '../../../../../../../../app/page/region/FragmentComponent';
import {useI18n} from '../../../../../../hooks/useI18n';
import {$inspectedItem, $pageEditorLifecycle} from '../../../../../../store/page-editor';
import {$pageVersion} from '../../../../../../store/page-editor/store';
import {FragmentContentSelector} from './FragmentContentSelector';

const FRAGMENT_INSPECTION_PANEL_NAME = 'FragmentInspectionPanel';

export const FragmentInspectionPanel = (): ReactElement | null => {
    const item = useStore($inspectedItem);
    useStore($pageVersion);
    const lifecycle = useStore($pageEditorLifecycle);

    const editLabel = useI18n('action.editFragment');

    const fragment = item instanceof FragmentComponent ? item : null;

    const handleEditFragment = useCallback((): void => {
        const contentId = fragment?.getFragment();
        if (!contentId) return;
        new EditContentEvent([ContentSummaryAndCompareStatus.fromId(contentId)]).fire();
    }, [fragment]);

    if (!fragment) return null;

    const hasFragment = fragment.hasFragment();
    const disabled = lifecycle.isPageLocked;

    return (
        <div data-component={FRAGMENT_INSPECTION_PANEL_NAME} className="flex flex-col gap-5">
            <div className="flex flex-col -mx-5 p-5 bg-surface-primary gap-5">
                <FragmentContentSelector />

                {hasFragment && (
                    <Button
                        label={editLabel}
                        variant="outline"
                        onClick={handleEditFragment}
                        disabled={disabled}
                        className="w-full"
                    />
                )}
            </div>
        </div>
    );
};

FragmentInspectionPanel.displayName = FRAGMENT_INSPECTION_PANEL_NAME;
