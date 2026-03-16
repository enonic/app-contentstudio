import {useStore} from '@nanostores/preact';
import Q from 'q';
import type {ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ExtensionItemViewType} from '../../../../../../app/view/context/ExtensionItemView';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {$activeWidgetId, $isContextOpen} from '../../../../store/contextWidgets.store';
import {VERSIONS_WIDGET_KEY} from '../../../../utils/widget/versions/versions';
import {VersionsList} from './VersionsList';

export const VersionsWidget = (): ReactElement => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidget = useStore($activeWidgetId);
    const isActiveWidget = activeWidget === VERSIONS_WIDGET_KEY;
    const content = useStore($contextContent);

    return (isContextOpen && isActiveWidget && content && <VersionsList />)
}


export class VersionsWidgetElement
    extends LegacyElement<typeof VersionsWidget>
    implements ExtensionItemViewType {
    constructor() {
        super({}, VersionsWidget);
    }

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
