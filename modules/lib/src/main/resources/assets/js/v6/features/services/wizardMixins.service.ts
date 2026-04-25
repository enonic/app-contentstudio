import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import type {Content} from '../../../app/content/Content';
import type {ContentId} from '../../../app/content/ContentId';
import {GetContentMixinsRequest} from '../../../app/resource/GetContentMixinsRequest';
import {onWizardPersistedContentSet, setMixinsDescriptors} from '../store/wizardContent.store';

//
// * State
//

let unsubscribe: (() => void) | null = null;

// Token guards against stale fetches overwriting the latest result when
// setPersistedContent fires several times in quick succession (e.g. save
// followed by a server event).
let pendingToken = 0;

//
// * Private
//

async function loadDescriptors(contentId: ContentId): Promise<void> {
    const token = ++pendingToken;

    try {
        const descriptors = await new GetContentMixinsRequest(contentId).sendAndParse();
        if (token !== pendingToken) {
            return;
        }
        setMixinsDescriptors(descriptors.slice());
    } catch (error) {
        if (token === pendingToken) {
            DefaultErrorHandler.handle(error);
        }
    }
}

//
// * Public API
//

export function initWizardMixinsService(): void {
    cleanupWizardMixinsService();

    unsubscribe = onWizardPersistedContentSet((content: Content) => {
        void loadDescriptors(content.getContentId());
    });
}

export function cleanupWizardMixinsService(): void {
    unsubscribe?.();
    unsubscribe = null;
    pendingToken += 1;
}
