import { useEffect, useRef, useState, type ReactElement } from 'react';
import { SplitView } from '../../../../shared/ui/split-view';
import { SettingsItemPanel } from '../item-panel/SettingsItemPanel';
import { SettingsTreeList } from '../SettingsTreeList';
import { SettingsTreeListToolbar } from '../SettingsTreeListToolbar';

// Legacy threshold: the item panel hides at <=720px and comes back above it.
const ITEM_PANEL_HIDE_MAX = 720;
const GRID_DEFAULT_SIZE = '38%';
const PANEL_MIN_WIDTH = '300px';

const PANEL_IDS = ['grid'];
const PANEL_IDS_WITH_ITEM = [...PANEL_IDS, 'item'];

const SETTINGS_LAYOUT_NAME = 'SettingsLayout';

export const SettingsLayout = (): ReactElement => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [itemPanelHidden, setItemPanelHidden] = useState(false);

    useEffect(() => {
        const root = rootRef.current;
        if (root == null) return;

        const observer = new ResizeObserver(() => {
            const width = root.getBoundingClientRect().width;
            if (width <= 0) return;

            setItemPanelHidden(width <= ITEM_PANEL_HIDE_MAX);
        });
        observer.observe(root);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={rootRef} data-component={SETTINGS_LAYOUT_NAME} className="relative min-h-0 flex-1">
            <SplitView
                orientation="horizontal"
                storageId="settings-layout"
                panelIds={itemPanelHidden ? PANEL_IDS : PANEL_IDS_WITH_ITEM}
                className="size-full"
            >
                <SplitView.Panel id="grid" defaultSize={GRID_DEFAULT_SIZE} minSize={PANEL_MIN_WIDTH}>
                    <div className="flex size-full flex-col">
                        <SettingsTreeListToolbar />
                        <SettingsTreeList />
                    </div>
                </SplitView.Panel>
                {!itemPanelHidden && (
                    <>
                        <SplitView.Handle id="grid-item-handle" variant="thin" />
                        <SplitView.Panel id="item" minSize={PANEL_MIN_WIDTH}>
                            <SettingsItemPanel />
                        </SplitView.Panel>
                    </>
                )}
            </SplitView>
        </div>
    );
};

SettingsLayout.displayName = SETTINGS_LAYOUT_NAME;
