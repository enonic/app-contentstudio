import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {fetchVersion, revert} from '../../../../../api/versions';
import {$versionsCacheInvalidated, registerCacheInvalidationHandlers} from '../../../../../utils/widget/versions/versionsCache';
import {loadContentVersions} from '../../../../../utils/widget/versions/versionsLoader';
import {type VersionsConfig} from './VersionsConfig';

let cacheHandlersRegistered = false;

const ensureCacheHandlersRegistered = (): void => {
    if (cacheHandlersRegistered) {
        return;
    }
    registerCacheInvalidationHandlers();
    cacheHandlersRegistered = true;
};

const subscribeContentInvalidation = (handler: (contentId: string) => void): (() => void) => {
    ensureCacheHandlersRegistered();
    return $versionsCacheInvalidated.subscribe((event) => {
        if (event) {
            handler(event.id);
        }
    });
};

export const createContentStudioDefaults = (): VersionsConfig => ({
    services: {
        loadVersions: loadContentVersions,
        fetchVersion,
        revert,
        subscribeContentInvalidation,
    },
    notify: {
        showSuccess: (message) => NotifyManager.get().showSuccess(message),
    },
    handleError: (err) => DefaultErrorHandler.handle(err),
});

