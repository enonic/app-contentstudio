import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { useMemo } from 'react';
import { type ContentId } from '../../../../../../app/content/ContentId';
import { useVersionsConfig } from '../config/VersionsConfigContext';
import { hasPatchVersionsBefore } from './patchDetection';
import { $pendingRevert, cancelRevert } from './revertStore';

export type RevertActions = {
    requestRevert: (contentId: ContentId, versionId: string) => void;
    confirmRevert: () => void;
    cancelRevert: () => void;
};

export const useRevertActions = (): RevertActions | undefined => {
    const { services, notify, handleError } = useVersionsConfig();
    const revertService = services.revert;

    return useMemo(() => {
        if (!revertService) {
            return undefined;
        }

        const runRevert = (contentId: ContentId, versionId: string): void => {
            revertService(contentId, versionId).then((result) => {
                if (result.isOk()) {
                    notify?.showSuccess(i18n('notify.version.changed', result.value));
                } else if (result.isErr()) {
                    handleError?.(result.error);
                }
            });
        };

        return {
            requestRevert: (contentId, versionId) => {
                if (hasPatchVersionsBefore(versionId)) {
                    $pendingRevert.set({ contentId, versionId });
                } else {
                    runRevert(contentId, versionId);
                }
            },
            confirmRevert: () => {
                const pending = $pendingRevert.get();
                if (pending) {
                    $pendingRevert.set(undefined);
                    runRevert(pending.contentId, pending.versionId);
                }
            },
            cancelRevert,
        };
    }, [revertService, notify, handleError]);
};
