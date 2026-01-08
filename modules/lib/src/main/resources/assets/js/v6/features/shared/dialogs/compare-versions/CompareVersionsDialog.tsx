import {Dialog, Checkbox, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {DiffPatcher} from 'jsondiffpatch';
import {format, showUnchanged} from 'jsondiffpatch/formatters/html';
import {ReactElement, useEffect, useMemo, useRef, useState} from 'react';
import {ContentJson} from '../../../../../app/content/ContentJson';
import {ContentVersion} from '../../../../../app/ContentVersion';
import {ContentVersionHelper} from '../../../../../app/ContentVersionHelper';
import {GetContentVersionRequest} from '../../../../../app/resource/GetContentVersionRequest';
import {useI18n} from '../../../hooks/useI18n';
import {$versions} from '../../../store/context/versionStore';
import {
    $compareVersionsDialog,
    closeCompareVersionsDialog,
    setCompareVersionsShowAll,
} from '../../../store/dialogs/compareVersionsDialog.store';
import {SelectedVersionCard} from './SelectedVersionCard';

const COMPARE_VERSIONS_DIALOG_NAME = 'CompareVersionsDialog';

const stripContentMetadata = (contentJson: ContentJson): ContentJson => {
    const cleaned = {...contentJson};
    ['_id', 'creator', 'createdTime', 'hasChildren'].forEach((key) => {
        delete cleaned[key];
    });
    return cleaned;
};

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
    const cacheRef = useRef<Map<string, ContentJson>>(new Map());

    const [diffHtml, setDiffHtml] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEmpty, setIsEmpty] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const leftVersion = useMemo(
        () => (leftVersionId ? ContentVersionHelper.getVersionById(versions, leftVersionId) : null),
        [leftVersionId, versions]
    );
    const rightVersion = useMemo(
        () => (rightVersionId ? ContentVersionHelper.getVersionById(versions, rightVersionId) : null),
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

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            closeCompareVersionsDialog();
        }
    };

    const handleShowAllChange = (checked: boolean) => {
        setCompareVersionsShowAll(checked);
    };

    useEffect(() => {
        if (!open) {
            cacheRef.current.clear();
            setDiffHtml('');
            setError(null);
            setIsEmpty(false);
            setIsLoading(false);
            showUnchanged(false, null, 0);
            return;
        }

        showUnchanged(showAllContent, null, 0);
    }, [open, showAllContent]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (!leftVersionId || !rightVersionId || !leftVersion || !rightVersion) {
            closeCompareVersionsDialog();
        }
    }, [open, leftVersionId, rightVersionId, leftVersion, rightVersion]);

    useEffect(() => {
        if (!open || !contentId || !olderVersionId || !newerVersionId) {
            return;
        }

        let cancelled = false;

        const fetchVersion = async (versionId: string): Promise<ContentJson> => {
            const cached = cacheRef.current.get(versionId);
            if (cached) {
                return cached;
            }

            const content = await new GetContentVersionRequest(contentId)
                .setVersion(versionId)
                .sendRequest();

            const cleaned = stripContentMetadata(content);
            cacheRef.current.set(versionId, cleaned);
            return cleaned;
        };

        const loadDiff = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setDiffHtml('');

                const leftJson = await fetchVersion(olderVersionId);
                const rightJson = olderVersionId === newerVersionId
                    ? leftJson
                    : await fetchVersion(newerVersionId);

                if (cancelled) {
                    return;
                }

                const delta = diffPatcher.diff(leftJson, rightJson);
                if (delta) {
                    setDiffHtml(format(delta, rightJson));
                    setIsEmpty(false);
                } else {
                    setDiffHtml(`<h3>${versionsIdenticalLabel}</h3>`);
                    setIsEmpty(true);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error('Failed to load versions diff'));
                    setIsEmpty(false);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadDiff();

        return () => {
            cancelled = true;
        };
    }, [open, contentId, olderVersionId, newerVersionId, diffPatcher, versionsIdenticalLabel]);

    useEffect(() => {
        if (!open) {
            return;
        }

        showUnchanged(showAllContent, null, 0);
    }, [open, showAllContent, diffHtml]);

    if (open && !orderedVersions) {
        return (
            <Dialog.Root open={open} onOpenChange={handleOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                </Dialog.Portal>
            </Dialog.Root>
        );
    }

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
                        <Checkbox
                            label={showEntireLabel}
                            checked={showAllContent}
                            onCheckedChange={handleShowAllChange}
                        />
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

CompareVersionsDialog.displayName = COMPARE_VERSIONS_DIALOG_NAME;
