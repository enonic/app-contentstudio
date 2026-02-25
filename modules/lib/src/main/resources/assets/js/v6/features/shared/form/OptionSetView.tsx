import {type ReactElement} from 'react';

type OptionSetViewProps = {
    name: string;
};

export const OptionSetView = ({name}: OptionSetViewProps): ReactElement => (
    <div className="rounded border border-dashed border-bdr-subtle px-3 py-2 text-xs text-subtle">
        FormOptionSet: {name} — not yet supported
    </div>
);

OptionSetView.displayName = 'OptionSetView';
