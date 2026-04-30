import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import type {Content} from '../../../app/content/Content';
import type {ContentId} from '../../../app/content/ContentId';
import {GetContentMixinsRequest} from '../../../app/resource/GetContentMixinsRequest';
import {$applications} from '../store/applications.store';
import {onWizardPersistedContentSet, setMixinsDescriptors} from '../store/wizardContent.store';

//
// * State
//

let unsubscribePersistedContent: (() => void) | null = null;
let unsubscribeApplications: (() => void) | null = null;

let wizardContentId: ContentId | null = null;
let lastAppSignature: string | null = null;
let pendingToken = 0;

//
// * Private
//

function buildAppSignature(): string {
    const {applications, loaded} = $applications.get();
    if (!loaded) {
        return '';
    }
    return applications
        .map((app) => `${app.getApplicationKey().toString()}:${app.getState()}`)
        .sort()
        .join('|');
}

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

    unsubscribePersistedContent = onWizardPersistedContentSet((content: Content) => {
        wizardContentId ??= content.getContentId();
        void loadDescriptors(wizardContentId);
    });

    lastAppSignature = buildAppSignature();
    unsubscribeApplications = $applications.listen(() => {
        const next = buildAppSignature();
        if (next === lastAppSignature) {
            return;
        }
        if (lastAppSignature === '') {
            lastAppSignature = next;
            return;
        }
        lastAppSignature = next;

        if (wizardContentId) {
            void loadDescriptors(wizardContentId);
        }
    });
}

export function cleanupWizardMixinsService(): void {
    unsubscribePersistedContent?.();
    unsubscribePersistedContent = null;

    unsubscribeApplications?.();
    unsubscribeApplications = null;

    wizardContentId = null;
    lastAppSignature = null;
    pendingToken += 1;
}
