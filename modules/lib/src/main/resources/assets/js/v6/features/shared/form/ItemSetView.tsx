import {type ReactElement} from 'react';

type ItemSetViewProps = {
    name: string;
};

export const ItemSetView = ({name}: ItemSetViewProps): ReactElement => (
    <div className="rounded border border-dashed border-bdr-subtle px-3 py-2 text-xs text-subtle">
        FormItemSet: {name} — not yet supported
    </div>
);

ItemSetView.displayName = 'ItemSetView';
