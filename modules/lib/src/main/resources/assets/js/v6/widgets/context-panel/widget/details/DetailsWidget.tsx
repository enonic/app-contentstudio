import { useStore } from '@nanostores/preact';
import Q from 'q';
import type { ReactElement } from 'react';
import type { ContentSummaryAndCompareStatus } from '../../../../../app/content/ContentSummaryAndCompareStatus';
import type { ExtensionItemViewType } from '../../../../../app/view/context/ExtensionItemView';
import { LegacyElement } from '../../../../shared/ui/LegacyElement';
import { $contextContent } from '../../model/contextContent.store';
import { $activeWidgetId, $isContextOpen } from '../../model/contextWidgets.store';
import { getDetailsWidgetKey } from '../../../../shared/lib/widget/details';
import { DetailsWidgetAttachmentsSection } from './DetailsWidgetAttachmentsSection';
import { DetailsWidgetContentSection } from './DetailsWidgetContentSection';
import { DetailsWidgetInfoSection } from './DetailsWidgetInfoSection';
import { DetailsWidgetPermissionsSection } from './DetailsWidgetPermissionsSection';
import { DetailsWidgetScheduleSection } from './DetailsWidgetScheduleSection';
import { DetailsWidgetTemplateSection } from './DetailsWidgetTemplateSection';

const DETAILS_WIDGET_NAME = 'DetailsWidget';

export const DetailsWidget = (): ReactElement => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidget = useStore($activeWidgetId);
    const isActiveWidget = activeWidget === getDetailsWidgetKey();
    const content = useStore($contextContent);

    if (!isContextOpen || !isActiveWidget || !content) return null;

    return (
        <div data-component={DETAILS_WIDGET_NAME} className="flex flex-col gap-7.5">
            <DetailsWidgetContentSection />
            <DetailsWidgetPermissionsSection />
            <DetailsWidgetInfoSection />
            <DetailsWidgetScheduleSection />
            <DetailsWidgetTemplateSection />
            <DetailsWidgetAttachmentsSection />
        </div>
    );
};

DetailsWidget.displayName = DETAILS_WIDGET_NAME;

export class DetailsWidgetElement extends LegacyElement<typeof DetailsWidget> implements ExtensionItemViewType {
    constructor() {
        super({}, DetailsWidget);
    }

    // Backward compatibility

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        return Q();
    }

    public fetchExtensionContents(url: string, contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}
