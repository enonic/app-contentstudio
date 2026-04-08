import {useStore} from '@nanostores/preact';
import {Blocks} from 'lucide-react';
import type {ReactElement} from 'react';
import {Region} from '../../../../../../../../app/page/region/Region';
import {ItemLabel} from '../../../../../../shared/ItemLabel';
import {$inspectedItem} from '../../../../../../store/pageEditorInspect.store';
import {capitalize} from '../../../../../../utils/format/capitalize';

const REGION_INSPECTION_PANEL_NAME = 'RegionInspectionPanel';

export const RegionInspectionPanel = (): ReactElement | null => {
    const item = useStore($inspectedItem);

    if (!(item instanceof Region)) return null;

    return (
        <div data-component={REGION_INSPECTION_PANEL_NAME}>
            <ItemLabel
                icon={<Blocks />}
                primary={capitalize(item.getName())}
                secondary={item.getPath().toString()}
            />
        </div>
    );
};

RegionInspectionPanel.displayName = REGION_INSPECTION_PANEL_NAME;
