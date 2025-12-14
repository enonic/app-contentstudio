import {useStore} from '@nanostores/preact';
import Q from 'q';
import {ReactElement, useMemo} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {$activeWidgetId, $isContextOpen} from '../../../../store/contextWidgets.store';
import {VERSIONS_WIDGET_KEY} from '../../../../utils/widget/versions/versions';
import {VersionsList} from './VersionsList';


const VERSIONS_WIDGET_NAME = 'VersionsWidget';

export const VersionsWidget = (): ReactElement => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidget = useStore($activeWidgetId);
    const isActiveWidget = useMemo(() => activeWidget === VERSIONS_WIDGET_KEY, [activeWidget]);

    return (isContextOpen && isActiveWidget &&
        <div data-component={VERSIONS_WIDGET_NAME} className='flex flex-col gap-7.5 overflow-y-visible'>
            <VersionsList />
        </div>
    )
}


export class VersionsWidgetElement
    extends LegacyElement<typeof VersionsWidget>
    implements WidgetItemViewInterface {
    constructor() {
        super({}, VersionsWidget);
    }

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
