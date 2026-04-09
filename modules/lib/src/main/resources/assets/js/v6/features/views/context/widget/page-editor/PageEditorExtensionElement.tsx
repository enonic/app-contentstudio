import Q from 'q';
import type { ContentSummaryAndCompareStatus } from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import type { ExtensionItemViewType } from '../../../../../../app/view/context/ExtensionItemView';
import { LegacyElement } from '../../../../shared/LegacyElement';
import { PageEditorExtension } from './PageEditorExtension';

// Backward compatibility: ContextWindow -> PageEditorExtension
export class PageEditorExtensionElement extends LegacyElement<typeof PageEditorExtension> implements ExtensionItemViewType {
    constructor() {
        super({}, PageEditorExtension);
    }

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(_item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        return Q();
    }

    public fetchExtensionContents(_url: string, _contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}
