import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {FC, ReactElement} from 'react';
import {$inspectedItemType} from '../../../../../store/page-editor';
import {PageInspectionPanel} from './page';
import {RegionInspectionPanel} from './region';

// TODO: add part, layout, text, fragment panels
const PANEL_BY_TYPE: Record<string, FC> = {
    page: PageInspectionPanel,
    region: RegionInspectionPanel,
};


export type InspectPanelProps = {
    className?: string;
};

const INSPECT_PANEL_NAME = 'InspectPanel';

export const InspectPanel = ({className}: InspectPanelProps): ReactElement => {
    const itemType = useStore($inspectedItemType);
    const key = itemType?.toString();
    const Panel = key ? PANEL_BY_TYPE[key] : PageInspectionPanel;

    return (
        <div data-component={INSPECT_PANEL_NAME} className={cn('flex flex-col', className)}>
            {Panel && <Panel />}
        </div>
    );
};

InspectPanel.displayName = INSPECT_PANEL_NAME;
