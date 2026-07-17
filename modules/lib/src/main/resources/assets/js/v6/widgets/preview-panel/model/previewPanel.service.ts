import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { $currentItem } from '../../../entities/content';
import { $mode } from '../../../shared/app-state/mode.store';
import { isDeletedTemplateForContent, isTemplateEventForContent } from '../../../shared/lib/page/templateEvent';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentCreated,
    $contentDeleted,
    $contentUpdated,
    type ContentEvent,
} from '../../../shared/socket/socket.store';
import { requestPreviewRefresh } from './previewPanel.store';

let unsubscribers: (() => void)[] = [];

// Wizard mode is excluded: the wizard reloads its own live edit on template
// events (ContentWizardPanel.handleTemplateUpdate).
const getBrowseContextContent = (): ContentSummary | null =>
    $mode.get() === 'browser' ? $currentItem.get() : null;

export const start = (): void => {
    if (unsubscribers.length > 0) return;

    const refreshDebounced = createDebounce(() => requestPreviewRefresh(), 300);

    const onTemplateEvent = (event: ContentEvent | null): void => {
        if (!event?.data) return;
        
        const content = getBrowseContextContent();

        if (!content) return;

        if (event.data.some((summary) => isTemplateEventForContent(summary, content))) refreshDebounced();
    };

    unsubscribers = [
        $contentCreated.subscribe(onTemplateEvent),
        $contentUpdated.subscribe(onTemplateEvent),
        $contentDeleted.subscribe((event) => {
            if (!event?.data) return;
            
            const content = getBrowseContextContent();

            if (!content) return;

            if (event.data.some((item) => isDeletedTemplateForContent(item.getPath(), content))) refreshDebounced();
        }),
        () => refreshDebounced.cancel(),
    ];
};

export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
