import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { okAsync, ResultAsync } from 'neverthrow';
import type { Content } from '../../../../app/content/Content';
import { ContentId } from '../../../../app/content/ContentId';
import { ContentRequiresSaveEvent } from '../../../../app/event/ContentRequiresSaveEvent';
import { $applications, loadApplications } from '../../../entities/application';
import { AppError } from '../../../shared/api/errors';
import { fetchApplicationMixins, fetchContentMixins } from '../api/mixins.api';
import { $contextContent } from '../../../widgets/context-panel/model/contextContent.store';
import {
    $contentType,
    $mixinsDescriptors,
    onMixinSeedRequested,
    onWizardPersistedContentSet,
    onWizardServerMixinsChanged,
    markMixinsAsUserChanged,
    setMixinsDescriptors,
} from './wizardContent.store';

//
// * State
//

let unsubscribePersistedContent: (() => void) | null = null;
let unsubscribeApplications: (() => void) | null = null;
let unsubscribeMixinSeed: (() => void) | null = null;
let unsubscribeServerMixinsChanged: (() => void) | null = null;

let wizardContentId: ContentId | null = null;
let lastAppSignature: string | null = null;
let pendingToken = 0;

//
// * Private
//

function buildAppSignature(): string {
    const { applications, loaded } = $applications.get();
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

    const result = await fetchContentMixins(contentId);
    if (token !== pendingToken) {
        return;
    }

    if (result.isErr()) {
        DefaultErrorHandler.handle(result.error);
        return;
    }

    setMixinsDescriptors(result.value.slice());
}

function seedMixinsForApplications(applicationKeys: string[]): ResultAsync<void, AppError> {
    const contentType = $contentType.get();
    if (!contentType || applicationKeys.length === 0) {
        return okAsync(undefined);
    }

    const contentTypeName = contentType.getContentTypeName();

    const requests = applicationKeys.map((key) =>
        fetchApplicationMixins(contentTypeName, ApplicationKey.fromString(key)),
    );

    return ResultAsync.combine(requests).map((results) => {
        const previousNames = new Set($mixinsDescriptors.get().map((descriptor) => descriptor.getName()));
        const byName = new Map($mixinsDescriptors.get().map((descriptor) => [descriptor.getName(), descriptor]));
        for (const descriptors of results) {
            for (const descriptor of descriptors) {
                byName.set(descriptor.getName(), descriptor);
            }
        }

        markMixinsAsUserChanged([...byName.keys()].filter((name) => !previousNames.has(name)));
        setMixinsDescriptors([...byName.values()]);
    });
}

function fireContentRequiresSave(): void {
    const id = $contextContent.get()?.getId();
    if (!id) {
        return;
    }
    new ContentRequiresSaveEvent(new ContentId(id)).fire();
}

async function handleMixinSeedRequest(applicationKeys: string[]): Promise<void> {
    const result = await seedMixinsForApplications(applicationKeys);
    if (result.isErr()) {
        console.error(result.error.message);
    }
    fireContentRequiresSave();
}

//
// * Public API
//

export function initWizardMixinsService(): void {
    cleanupWizardMixinsService();

    void loadApplications();

    unsubscribePersistedContent = onWizardPersistedContentSet((content: Content) => {
        wizardContentId ??= content.getContentId();
        void loadDescriptors(wizardContentId);
    });

    unsubscribeMixinSeed = onMixinSeedRequested((applicationKeys) => {
        void handleMixinSeedRequest(applicationKeys);
    });

    unsubscribeServerMixinsChanged = onWizardServerMixinsChanged(() => {
        if (wizardContentId) {
            void loadDescriptors(wizardContentId);
        }
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

    unsubscribeMixinSeed?.();
    unsubscribeMixinSeed = null;

    unsubscribeServerMixinsChanged?.();
    unsubscribeServerMixinsChanged = null;

    wizardContentId = null;
    lastAppSignature = null;
    pendingToken += 1;
}
