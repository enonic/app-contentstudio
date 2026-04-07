import type {ReactElement} from 'react';

const INSPECT_PANEL_NAME = 'InspectPanel';

export const InspectPanel = (): ReactElement => {
    return (
        <div data-component={INSPECT_PANEL_NAME} />
    );
};

InspectPanel.displayName = INSPECT_PANEL_NAME;
