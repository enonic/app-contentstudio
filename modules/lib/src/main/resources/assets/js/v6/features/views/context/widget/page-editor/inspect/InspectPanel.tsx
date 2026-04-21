import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {FC, ReactElement} from 'react';
import {$inspectedItemType} from '../../../../../store/page-editor';
import {$isApplyVisible} from '../../../../../store/inspect-panel.store';
import {ApplyButton} from './ApplyButton';
import {LayoutInspectionPanel, PartInspectionPanel} from './component';
import {FragmentInspectionPanel} from './fragment';
import {PageInspectionPanel} from './page';
import {RegionInspectionPanel} from './region';
import {TextInspectionPanel} from './text';

const PANEL_BY_TYPE: Record<string, FC> = {
    page: PageInspectionPanel,
    region: RegionInspectionPanel,
    part: PartInspectionPanel,
    layout: LayoutInspectionPanel,
    fragment: FragmentInspectionPanel,
    text: TextInspectionPanel,
};


export type InspectPanelProps = {
    className?: string;
};

const INSPECT_PANEL_NAME = 'InspectPanel';

export const InspectPanel = ({className}: InspectPanelProps): ReactElement => {
    const itemType = useStore($inspectedItemType);
    const isApplyVisible = useStore($isApplyVisible);
    const key = itemType?.toString();
    const Panel = key ? PANEL_BY_TYPE[key] : PageInspectionPanel;

    return (
        <div data-component={INSPECT_PANEL_NAME} className={cn('flex flex-col', className)}>
            {Panel && <Panel />}
            {isApplyVisible && <ApplyButton />}
        </div>
    );
};

InspectPanel.displayName = INSPECT_PANEL_NAME;
