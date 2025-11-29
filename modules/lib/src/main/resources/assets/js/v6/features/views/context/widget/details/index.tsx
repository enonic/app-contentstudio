import {ReactElement} from 'react';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {DetailsWidgetContentSection} from './ContentSection';
import {DetailsWidgetPermissionsSection} from './PermissionsSection';
import {DetailsWidgetInfoSection} from './InfoSection';
import {DetailsWidgetScheduleSection} from './ScheduleSection';
import {DetailsWidgetTemplateSection} from './TemplateSection';
import {DetailsWidgetAttachmentsSection} from './AttachmentsSection';
import Q from 'q';

const DetailsWidget = (): ReactElement => {
    return (
        <>
            <DetailsWidgetContentSection />
            <DetailsWidgetPermissionsSection />
            <DetailsWidgetInfoSection />
            <DetailsWidgetScheduleSection />
            <DetailsWidgetTemplateSection />
            <DetailsWidgetAttachmentsSection />
        </>
    );
};

DetailsWidget.displayName = 'DetailsWidget';

export class DetailsWidgetElement extends LegacyElement<typeof DetailsWidget> implements WidgetItemViewInterface {
    constructor() {
        super({}, DetailsWidget);
    }

    // Backwards compatibility

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
