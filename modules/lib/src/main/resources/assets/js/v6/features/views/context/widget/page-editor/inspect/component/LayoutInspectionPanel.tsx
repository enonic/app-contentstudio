import type {ReactElement} from 'react';
import {ComponentInspectionPanel} from './ComponentInspectionPanel';

const LAYOUT_INSPECTION_PANEL_NAME = 'LayoutInspectionPanel';

export const LayoutInspectionPanel = (): ReactElement | null => {
    return <ComponentInspectionPanel componentType="layout" />;
};

LayoutInspectionPanel.displayName = LAYOUT_INSPECTION_PANEL_NAME;
