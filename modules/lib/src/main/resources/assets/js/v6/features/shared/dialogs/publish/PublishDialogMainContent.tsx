import {Button, Checkbox, Dialog, GridList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Calendar, CornerDownRight} from 'lucide-react';
import {useEffect, useId, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ContentRow} from '../../lists';
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
    setPublishDialogItemWithChildrenSelected,
} from '../../../store/dialogs/publishDialog.store';
import {SplitList} from '../../lists/split-list';
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
    const emptyDependenciesMessage = useI18n('field.publish.dependencies.empty');
    const scheduleLabel = useI18n('action.schedule');
    const publishLabelSingle = useI18n('action.publishNow');
    const publishLabelMultiple = useI18n('action.publishNowCount', publishCount);
    const publishLabel = publishCount > 1 ? publishLabelMultiple : publishLabelSingle;
    const includeChildrenLabel = useI18n('field.content.includeChildren');

    const handleSchedule = () => {
        // TODO: Add schedule support
    };

    const baseId = useId();
    const titleId = `${PUBLISH_DIALOG_MAIN_CONTENT_NAME}-${baseId}-title`;

    return (
        <Dialog.Content
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
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

            <Dialog.Body className="flex flex-col gap-y-10" tabIndex={-1}>
                <SplitList>
                    <SplitList.Primary
                        items={mainItems}
                        getItemId={(item) => item.id}
                        disabled={loading}
                        renderRow={(item) => {
                            const showChildrenCheckbox = item.hasUnpublishedChildren && item.content.hasChildren();
                            return (
                                <>
                                    <ContentRow
                                        key={item.id}
                                        content={item.content}
                                        id={item.id}
                                        disabled={item.required || loading}
                                    >
                                        <ContentRow.Checkbox
                                            checked={item.included}
                                            onCheckedChange={(checked) => setPublishDialogItemSelected(item.content.getContentId(), checked)}
                                        />
                                        <ContentRow.Label action="edit" />
                                        <ContentRow.Status variant="diff" />
                                    </ContentRow>

                                    {showChildrenCheckbox && (
                                        <GridList.Row
                                            id={`${item.id}-children`}
                                            disabled={item.required || loading || !item.included}
                                            className="gap-3 px-2.5 -mt-1"
                                        >
                                            <GridList.Cell className="pl-2.5 flex items-center gap-2.5">
                                                <CornerDownRight className="size-4 shrink-0" />
                                                <GridList.Action>
                                                    <Checkbox
                                                        className="font-semibold"
                                                        checked={item.childrenIncluded}
                                                        onCheckedChange={(enabled) => setPublishDialogItemWithChildrenSelected(item.content.getContentId(), enabled === true)}
                                                        disabled={item.required || loading || !item.included}
                                                        label={includeChildrenLabel}
                                                    />
                                                </GridList.Action>
                                            </GridList.Cell>
                                        </GridList.Row>
                                    )}
                                </>
                            );
                        }}
                    />

                    <SplitList.Separator hidden={!hasDependantItems}>
                        <SplitList.SeparatorLabel>{separatorLabel}</SplitList.SeparatorLabel>
                        <SplitList.SeparatorToggle
                            label={toggleExcludedLabel}
                            pressed={showExcluded}
                            onPressedChange={setShowExcluded}
                            disabled={!hasAnyExcludedDependantItems}
                        />
                    </SplitList.Separator>

                    <SplitList.Secondary
                        items={visibleDependantItems}
                        getItemId={(item) => item.id}
                        emptyMessage={hasDependantItems ? emptyDependenciesMessage : undefined}
                        disabled={loading}
                        renderRow={(item) => (
                            <ContentRow
                                key={item.id}
                                content={item.content}
                                id={item.id}
                                disabled={item.required || loading}
                            >
                                <ContentRow.Checkbox
                                    checked={item.included}
                                    onCheckedChange={(checked) => setPublishDialogDependantItemSelected(item.content.getContentId(), checked)}
                                />
                                <ContentRow.Label action="edit" />
                                <ContentRow.Status variant="diff" />
                            </ContentRow>
                        )}
                    />
                </SplitList>
            </Dialog.Body>
            <Dialog.Footer>
                <Button className="hidden" label={scheduleLabel} variant="outline" onClick={handleSchedule} endIcon={Calendar} disabled={loading} />
                <Button label={publishLabel} variant="solid" onClick={onPublish} disabled={!isPublishReady} />
            </Dialog.Footer>

        </Dialog.Content>
    );
};

PublishDialogMainContent.displayName = PUBLISH_DIALOG_MAIN_CONTENT_NAME;
