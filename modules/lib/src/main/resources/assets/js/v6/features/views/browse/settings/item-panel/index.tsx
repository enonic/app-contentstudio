import {BrowseItemPanel} from '@enonic/lib-admin-ui/app/browse/BrowseItemPanel';
import {ItemStatisticsPanel} from '@enonic/lib-admin-ui/app/view/ItemStatisticsPanel';
import {IdProvider} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import Q from 'q';
import {ReactElement} from 'react';
import {render} from 'react-dom';
import {SettingsViewItem} from '../../../../../../app/settings/view/SettingsViewItem';
import {useI18n} from '../../../../hooks/useI18n';
import {$currentItems, getCurrentItems, hasCurrentItems} from '../../../../store/settingsTreeSelection.store';
import {SettingsItemStatistics} from './SettingsItemStatistics';

const SETTINGS_ITEM_PANEL_NAME = 'SettingsItemPanel';

const NoSelectionMessage = (): ReactElement => {
    const message = useI18n('panel.noselection');

    return (
        <div className="flex items-center justify-center h-full text-subtle">
            {message}
        </div>
    );
};

NoSelectionMessage.displayName = 'NoSelectionMessage';

export const SettingsItemPanel = (): ReactElement => {
    const currentItems = useStore($currentItems);
    const item = currentItems[0];

    if (!item) {
        return <NoSelectionMessage />;
    }

    return <SettingsItemStatistics item={item} />;
};

SettingsItemPanel.displayName = SETTINGS_ITEM_PANEL_NAME;

class SettingsItemStatisticsPanelElement extends ItemStatisticsPanel {
    constructor() {
        super('settings-item-statistics-panel p-10');
    }

    setItem(item: SettingsViewItem): void {
        super.setItem(item);
        this.renderReact();
    }

    clearItem(): void {
        super.clearItem();
        this.renderReact();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.renderReact();
            return rendered;
        });
    }

    private renderReact(): void {
        render(
            <IdProvider prefix="settings-item-panel">
                <SettingsItemPanel />
            </IdProvider>,
            this.getHTMLElement()
        );
    }
}

export class SettingsItemPanelElement extends BrowseItemPanel {
    createItemStatisticsPanel(): ItemStatisticsPanel {
        return new SettingsItemStatisticsPanelElement();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('settings-browse-item-panel');

            // Subscribe to store to keep CSS state in sync
            $currentItems.subscribe((items) => {
                if (items.length > 0) {
                    this.removeClass('no-selection');
                } else {
                    this.addClass('no-selection');
                }
            });

            return rendered;
        });
    }

    getStatisticsItem(): SettingsViewItem | null {
        return getCurrentItems()[0] ?? null;
    }

    hasStatisticsItem(): boolean {
        return hasCurrentItems();
    }
}
