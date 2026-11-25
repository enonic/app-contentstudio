import type { ContentState } from '../../../../../app/content/ContentState';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { calcContentState } from '../../../../shared/lib/cms/content/workflow';

/** Workflow status displayed by a media selection item. */
export function getMediaSelectorStatus(content: ContentSummary, hideStatus = false): ContentState | null {
    if (hideStatus || !content.getPath() || content.getPublishTime()) return null;
    return calcContentState(content);
}
