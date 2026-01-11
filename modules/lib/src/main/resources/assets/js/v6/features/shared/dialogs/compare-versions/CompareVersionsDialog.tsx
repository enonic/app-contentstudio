import {Dialog, Checkbox, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {DiffPatcher} from 'jsondiffpatch';
import {format, showUnchanged} from 'jsondiffpatch/formatters/html';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {ContentVersion} from '../../../../../app/ContentVersion';
import {useI18n} from '../../../hooks/useI18n';
import {$versions} from '../../../store/context/versionStore';
import {
    $compareVersionsDialog,
    closeCompareVersionsDialog,
    setCompareVersionsShowAll,
} from '../../../store/dialogs/compareVersionsDialog.store';
import {findById} from '../../../utils/array/find';
import {useVersionsJson} from '../../../views/context/widget/versions/hooks/useVersionsJson';
import {SelectedVersionCard} from './SelectedVersionCard';

const COMPARE_VERSIONS_DIALOG_NAME = 'CompareVersionsDialog';

type OrderedVersions = {
    older: ContentVersion;
    newer: ContentVersion;
};

const orderVersions = (left: ContentVersion, right: ContentVersion): OrderedVersions => {
    return left.getTimestamp() <= right.getTimestamp()
        ? {older: left, newer: right}
        : {older: right, newer: left};
};

export const CompareVersionsDialog = (): ReactElement => {
    const {
        open,
        contentId,
        leftVersionId,
        rightVersionId,
        showAllContent,
    } = useStore($compareVersionsDialog);
    const versions = useStore($versions);

    const title = useI18n('dialog.compareVersions.comparingVersions');
    const olderLabel = useI18n('dialog.compareVersions.olderVersion');
    const newerLabel = useI18n('dialog.compareVersions.newerVersion');
    const showEntireLabel = useI18n('field.content.showEntire');
    const loadingLabel = useI18n('widget.versions.loading');
    const versionsIdenticalLabel = useI18n('dialog.compareVersions.versionsIdentical');

    const diffPatcher = useMemo(() => new DiffPatcher(), []);

    const [diffHtml, setDiffHtml] = useState<string>('');
    const [isEmpty, setIsEmpty] = useState(false);

    const leftVersion = useMemo(
        () => (leftVersionId ? findById(versions, leftVersionId) : null),
        [leftVersionId, versions]
    );
    const rightVersion = useMemo(
        () => (rightVersionId ? findById(versions, rightVersionId) : null),
        [rightVersionId, versions]
    );
    const orderedVersions = useMemo(() => {
        if (!leftVersion || !rightVersion) {
            return null;
        }
        return orderVersions(leftVersion, rightVersion);
    }, [leftVersion, rightVersion]);

    const olderVersionId = orderedVersions?.older.getId();
    const newerVersionId = orderedVersions?.newer.getId();

    const {
        olderVersionJson,
        newerVersionJson,
        isLoading,
        error,
    } = useVersionsJson(
        open ? contentId : undefined,
        open ? olderVersionId : undefined,
        open ? newerVersionId : undefined
    );

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        if (!nextOpen) {
            closeCompareVersionsDialog();
        }
    }, []);

    const handleShowAllChange = useCallback((checked: boolean) => {
        setCompareVersionsShowAll(checked);
    }, []);

    useEffect(() => {
        if (!open) {
            setDiffHtml('');
            setIsEmpty(false);
            showUnchanged(false, null, 0);
        }
    }, [open]);

    const delta = useMemo(() => {
        if (!olderVersionJson || !newerVersionJson) {
            return null;
        }
        return diffPatcher.diff(olderVersionJson, newerVersionJson);
    }, [olderVersionJson, newerVersionJson, diffPatcher]);


    // Generate diff HTML when version JSONs are loaded
    useEffect(() => {
        if (!olderVersionJson || !newerVersionJson) {
            return;
        }

        if (delta) {
            setDiffHtml(format(delta, newerVersionJson));
            setIsEmpty(false);
        } else {
            setDiffHtml(`<h3>${versionsIdenticalLabel}</h3>`);
            setIsEmpty(true);
        }
    }, [olderVersionJson, newerVersionJson, delta, versionsIdenticalLabel]);

    // Apply showUnchanged when diffHtml is updated or showAllContent changes
    useEffect(() => {
        if (open && diffHtml) {
            showUnchanged(showAllContent, null, 0);
        }
    }, [open, showAllContent, diffHtml]);

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    className="w-full h-full gap-5 sm:h-fit md:min-w-184 md:max-w-220 md:max-h-[85vh]"
                    data-component={COMPARE_VERSIONS_DIALOG_NAME}
                >
                    <Dialog.DefaultHeader title={title} withClose />

                    <Dialog.Body className="flex flex-col gap-5 min-h-0">
                        <div className="grid gap-10 md:grid-cols-2">
                            {orderedVersions && (
                                <>
                                    <SelectedVersionCard label={olderLabel} version={orderedVersions.older} />
                                    <SelectedVersionCard label={newerLabel} version={orderedVersions.newer} />
                                </>
                            )}
                        </div>

                        <div className="flex-1 min-h-0 overflow-auto bg-surface-neutral/40 py-3">
                            {isLoading && (
                                <div className="text-sm text-subtle">{loadingLabel}</div>
                            )}

                            {!isLoading && error && (
                                <div className="text-sm text-red-600">{error.message}</div>
                            )}

                            {!isLoading && !error && (
                                <div
                                    className={cn('jsondiffpatch-delta text-sm', isEmpty && 'empty')}
                                    dangerouslySetInnerHTML={{__html: diffHtml}}
                                />
                            )}
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="flex items-center justify-between">
                        {orderedVersions && !isLoading && (
                            <Checkbox
                                label={showEntireLabel}
                                checked={showAllContent}
                                onCheckedChange={handleShowAllChange}
                            />
                        )}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

CompareVersionsDialog.displayName = COMPARE_VERSIONS_DIALOG_NAME;
