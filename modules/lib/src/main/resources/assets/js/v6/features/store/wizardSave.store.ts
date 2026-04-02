import {atom, computed} from 'nanostores';
import type Q from 'q';
import type {Content} from '../../../app/content/Content';
import type {CompareStatus} from '../../../app/content/CompareStatus';
import type {PublishStatus} from '../../../app/publish/PublishStatus';
import {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {UpdatePersistedContentWithStoreRoutine} from '../../../app/wizard/UpdatePersistedContentWithStoreRoutine';
import {type RoutineContext} from '../../../app/wizard/Flow';
import {setPersistedContent as setWizardContentPersistedState} from './wizardContent.store';

//
// * State
//

export const $wizardPersistedContent = atom<Content | null>(null);

export const $wizardCompareStatus = atom<CompareStatus | null>(null);

export const $wizardPublishStatus = atom<PublishStatus | null>(null);

export const $wizardRequireValid = atom<boolean>(false);

export const $wizardIsNew = atom<boolean>(true);

export const $wizardContentExistsInParentProject = atom<boolean>(false);

//
// * Derived
//

export const $wizardContentSummary = computed(
    [$wizardPersistedContent, $wizardCompareStatus, $wizardPublishStatus],
    (content, compareStatus, publishStatus): ContentSummaryAndCompareStatus | null => {
        if (!content) {
            return null;
        }

        const summary = ContentSummaryAndCompareStatus.fromContentSummary(content);

        if (compareStatus != null) {
            summary.setCompareStatus(compareStatus);
        }

        if (publishStatus != null) {
            summary.setPublishStatus(publishStatus);
        }

        return summary;
    },
);

//
// * Public API
//

export function setSavePersistedContent(content: Content | null): void {
    $wizardPersistedContent.set(content);
}

export function setWizardCompareStatus(status: CompareStatus | null): void {
    $wizardCompareStatus.set(status);
}

export function setWizardPublishStatus(status: PublishStatus | null): void {
    $wizardPublishStatus.set(status);
}

export function setWizardRequireValid(value: boolean): void {
    $wizardRequireValid.set(value);
}

export function setWizardIsNew(value: boolean): void {
    $wizardIsNew.set(value);
}

export function setWizardContentExistsInParentProject(value: boolean): void {
    $wizardContentExistsInParentProject.set(value);
}

export async function saveWizardContent(): Promise<RoutineContext> {
    const persistedContent = $wizardPersistedContent.get();

    if (!persistedContent) {
        throw new Error('Cannot save: no persisted content');
    }

    const requireValid = $wizardRequireValid.get();

    const routine = new UpdatePersistedContentWithStoreRoutine(persistedContent)
        .setRequireValid(requireValid);

    const context = await routine.execute();

    if (context.content) {
        $wizardPersistedContent.set(context.content);
        setWizardContentPersistedState(context.content);
    }

    return context;
}

/**
 * Handler for the full wizard save flow (data + UI work).
 * Registered by ContentWizardPanel at initialization.
 */
export const $wizardFullSaveHandler = atom<((clearInspection?: boolean) => Q.Promise<Content>) | null>(null);

export function setWizardFullSaveHandler(handler: (clearInspection?: boolean) => Q.Promise<Content>): void {
    $wizardFullSaveHandler.set(handler);
}

export function requestFullWizardSave(clearInspection?: boolean): Q.Promise<Content> {
    const handler = $wizardFullSaveHandler.get();
    if (!handler) {
        throw new Error('No save handler registered');
    }
    return handler(clearInspection);
}

export function resetWizardSave(): void {
    $wizardPersistedContent.set(null);
    $wizardCompareStatus.set(null);
    $wizardPublishStatus.set(null);
    $wizardRequireValid.set(false);
    $wizardIsNew.set(true);
    $wizardContentExistsInParentProject.set(false);
    $wizardFullSaveHandler.set(null);
}
