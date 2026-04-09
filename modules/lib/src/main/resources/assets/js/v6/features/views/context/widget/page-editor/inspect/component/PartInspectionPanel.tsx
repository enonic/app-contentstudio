import type {ReactElement} from 'react';
import {ComponentInspectionPanel} from './ComponentInspectionPanel';

const PART_INSPECTION_PANEL_NAME = 'PartInspectionPanel';

export const PartInspectionPanel = (): ReactElement | null => {
    return <ComponentInspectionPanel componentType="part" />;
};

PartInspectionPanel.displayName = PART_INSPECTION_PANEL_NAME;
