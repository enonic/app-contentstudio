import {Button, cn, Dialog, Separator, Toggle} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Calendar} from 'lucide-react';
import {useEffect, useId, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$config} from '../../../store/config.store';
import {
    $dependantPublishItems,
    $isPublishChecking,
    $isPublishReady,
    $isPublishSelectionSynced,
    $mainPublishItems,
    $publishCheckErrors,
    $publishDialog,
    $totalPublishableItems,
    applyDraftPublishDialogSelection,
    cancelDraftPublishDialogSelection,
    excludeInProgressPublishItems,
    excludeInvalidPublishItems,
    excludeNotPublishablePublishItems,
    markAllAsReadyInProgressPublishItems,
    setPublishDialogDependantItemSelected,
    setPublishDialogItemSelected,
    setPublishDialogItemWithChildrenSelected
} from '../../../store/dialogs/publishDialog.store';
import {ContentListItemSelectable} from '../../items/ContentListItemSelectable';
import {ContentListItemSelectableWithChildren} from '../../items/ContentListItemSelectableWithChildren';
import {SelectionStatusBar} from '../status-bar/SelectionStatusBar';

type PublishDialogMainContentProps = {
    onPublish: () => void;
    'data-component'?: string;
};

const PUBLISH_DIALOG_MAIN_CONTENT_NAME = 'PublishDialogMainContent';

export const PublishDialogMainContent = ({
    onPublish,
    'data-component': componentName = PUBLISH_DIALOG_MAIN_CONTENT_NAME,
}: PublishDialogMainContentProps): ReactElement => {
    const {failed} = useStore($publishDialog, {keys: ['failed']});
    const loading = useStore($isPublishChecking);
    const isPublishReady = useStore($isPublishReady);
    const {allowContentUpdate} = useStore($config, {keys: ['allowContentUpdate']});

    const mainItems = useStore($mainPublishItems);
    const dependantItems = useStore($dependantPublishItems);
    const publishCount = useStore($totalPublishableItems);

    const hasDependantItems = dependantItems.length > 0;

    const isSelectionSynced = useStore($isPublishSelectionSynced);

    const {invalid, inProgress, noPermissions} = useStore($publishCheckErrors);

    const [showExcluded, setShowExcluded] = useState(false);

    const visibleDependantItems = showExcluded
        ? dependantItems
        : dependantItems.filter(item => !item.excludedByDefault);
    const hasAnyExcludedDependantItems = dependantItems.some(item => item.excludedByDefault);
    const hasVisibleDependantItems = visibleDependantItems.length > 0;
    const showExcludedLabel = useI18n('dialog.publish.excluded.show');
    const hideExcludedLabel = useI18n('dialog.publish.excluded.hide');
    const toggleExcludedLabel = showExcluded ? hideExcludedLabel : showExcludedLabel;

    useEffect(() => {
        if (!hasAnyExcludedDependantItems) {
            setShowExcluded(false);
        }
    }, [hasAnyExcludedDependantItems]);

    const title = useI18n('dialog.publish');
    const separatorLabel = useI18n('dialog.publish.dependants');
    const scheduleLabel = useI18n('action.schedule');
    const publishLabelSingle = useI18n('action.publishNow');
    const publishLabelMultiple = useI18n('action.publishNowCount', publishCount);
    const publishLabel = publishCount > 1 ? publishLabelMultiple : publishLabelSingle;

    const handleSchedule = () => {
        // TODO: Add schedule support
    };

    const baseId = useId();
    const titleId = `${PUBLISH_DIALOG_MAIN_CONTENT_NAME}-${baseId}-title`;

    return (
        <Dialog.Content
            className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
            data-component={componentName}
        >
            <Dialog.DefaultHeader titleId={titleId} title={title} withClose />

            <SelectionStatusBar
                editing={!isSelectionSynced}
                failed={failed}
                loading={loading}
                showReady={isPublishReady}
                onApply={applyDraftPublishDialogSelection}
                onCancel={cancelDraftPublishDialogSelection}
                errors={{
                    inProgress: {
                        ...inProgress,
                        onMarkAsReady: allowContentUpdate ? () => void markAllAsReadyInProgressPublishItems() : undefined,
                        onExclude: () => excludeInProgressPublishItems(),
                    },
                    invalid: {
                        ...invalid,
                        onExclude: () => excludeInvalidPublishItems(),
                    },
                    noPermissions: {
                        ...noPermissions,
                        onExclude: () => excludeNotPublishablePublishItems(),
                    },
                }} />

            <Dialog.Body className="flex flex-col gap-y-10">
                <ul className='flex flex-col gap-y-2.5'>
                    {mainItems.map(({id, content, included, childrenIncluded, required, hasUnpublishedChildren}) => {
                        return <ContentListItemSelectableWithChildren
                            key={id}
                            id={`main-${id}`}
                            content={content}
                            checked={included}
                            onCheckedChange={(enabled) => setPublishDialogItemSelected(content.getContentId(), enabled)}
                            defaultIncludeChildren={childrenIncluded}
                            onIncludeChildrenChange={(enabled) => setPublishDialogItemWithChildrenSelected(content.getContentId(), enabled)}
                            readOnly={required || loading}
                            showIncludeChildren={hasUnpublishedChildren}
                        />;
                    })}
                </ul>
                <div className={cn("flex flex-col gap-y-7.5", !hasDependantItems && 'hidden')}>
                    <div className="flex items-center gap-2.5 -my-2.5 pr-1">
                        <Separator className="text-sm flex-1" label={separatorLabel} />
                        <Toggle size="sm" label={toggleExcludedLabel} pressed={showExcluded} onPressedChange={setShowExcluded} disabled={!hasAnyExcludedDependantItems} />
                    </div>
                    <ul className='flex flex-col gap-y-1.5'>
                        {visibleDependantItems.map(({id, content, included, required}) => {
                            return <ContentListItemSelectable
                                key={id}
                                id={`dependant-${id}`}
                                content={content}
                                checked={included}
                                onCheckedChange={(enabled) => setPublishDialogDependantItemSelected(content.getContentId(), enabled)}
                                readOnly={required || loading}
                            />;
                        })}
                        {!hasVisibleDependantItems && <li className="text-sm text-subtle italic">{useI18n('field.publish.dependencies.empty')}</li>}
                    </ul>
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <Button className="hidden" label={scheduleLabel} variant="outline" onClick={handleSchedule} endIcon={Calendar} disabled={loading} />
                <Button label={publishLabel} variant="solid" onClick={onPublish} disabled={!isPublishReady} />
            </Dialog.Footer>

        </Dialog.Content>
    );
};

PublishDialogMainContent.displayName = PUBLISH_DIALOG_MAIN_CONTENT_NAME;
