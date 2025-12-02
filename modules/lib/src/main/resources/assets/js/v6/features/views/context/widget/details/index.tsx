import Q from 'q';
import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {DetailsWidgetAttachmentsSection} from './DetailsWidgetAttachmentsSection';
import {DetailsWidgetContentSection} from './DetailsWidgetContentSection';
import {DetailsWidgetInfoSection} from './DetailsWidgetInfoSection';
import {DetailsWidgetPermissionsSection} from './DetailsWidgetPermissionsSection';
import {DetailsWidgetScheduleSection} from './DetailsWidgetScheduleSection';
import {DetailsWidgetTemplateSection} from './DetailsWidgetTemplateSection';

const DETAILS_WIDGET_NAME = 'DetailsWidget';

export const DetailsWidget = (): ReactElement => {
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

export class DetailsWidgetElement extends LegacyElement<typeof DetailsWidget> implements WidgetItemViewInterface {
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

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}
