import { type Element } from '@enonic/lib-admin-ui/dom/Element';
import { ResponsiveManager } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { LegacyElement } from '../../../../shared/ui/LegacyElement';
import { LegacyElementHost } from '../../../../shared/ui/LegacyElementHost';
import { SplitView } from '../../../../shared/ui/split-view';

const RESIZE_NOTIFY_DELAY_MS = 200;
// Legacy hysteresis: the item panel hides at <=720px and comes back at >=960px.
const ITEM_PANEL_HIDE_MAX = 720;
const ITEM_PANEL_SHOW_MIN = 960;

export type SettingsLayoutProps = {
    // Owned by SettingsBrowsePanel; the layout only places them.
    gridPanel: Element;
    itemPanel: Element;
};

const SETTINGS_LAYOUT_NAME = 'SettingsLayout';

export const SettingsLayout = ({ gridPanel, itemPanel }: SettingsLayoutProps): ReactElement => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [itemPanelHidden, setItemPanelHidden] = useState(false);

    useEffect(() => {
        const root = rootRef.current;
        if (root == null) return;

        const observer = new ResizeObserver(() => {
            const width = root.getBoundingClientRect().width;
            if (width <= 0) return;

            if (width <= ITEM_PANEL_HIDE_MAX) setItemPanelHidden(true);
            else if (width >= ITEM_PANEL_SHOW_MIN) setItemPanelHidden(false);
        });
        observer.observe(root);

        return () => observer.disconnect();
    }, []);

    // Hosted legacy content re-measures only on ResponsiveManager events.
    const notifyLegacyResize = useMemo(
        () => AppHelper.debounce(() => ResponsiveManager.fireResizeEvent(), RESIZE_NOTIFY_DELAY_MS),
        [],
    );

    // top-15 clears the 60px settings toolbar.
    return (
        <div ref={rootRef} data-component={SETTINGS_LAYOUT_NAME} className='absolute inset-x-0 bottom-0 top-15'>
            <SplitView orientation='horizontal' storageId='settings-layout' className='size-full'>
                <SplitView.Panel id='grid' defaultSize='38%' minSize='300px' onResize={notifyLegacyResize}>
                    <LegacyElementHost element={gridPanel} className='size-full' />
                </SplitView.Panel>
                {!itemPanelHidden && (
                    <>
                        <SplitView.Handle id='grid-item-handle' variant='thin' />
                        <SplitView.Panel id='item' minSize='300px' onResize={notifyLegacyResize}>
                            <LegacyElementHost element={itemPanel} className='size-full' />
                        </SplitView.Panel>
                    </>
                )}
            </SplitView>
        </div>
    );
};

SettingsLayout.displayName = SETTINGS_LAYOUT_NAME;

export class SettingsLayoutElement extends LegacyElement<typeof SettingsLayout, SettingsLayoutProps> {
    constructor(props: SettingsLayoutProps) {
        super(props, SettingsLayout);
    }
}
