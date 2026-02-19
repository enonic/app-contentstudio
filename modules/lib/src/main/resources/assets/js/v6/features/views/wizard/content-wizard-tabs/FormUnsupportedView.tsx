import {type ReactElement} from 'react';

type FormUnsupportedViewProps = {
    name: string;
    type: string;
};

export const FormUnsupportedView = ({name, type}: FormUnsupportedViewProps): ReactElement => (
    <div className="rounded border border-dashed border-bdr-subtle px-3 py-2 text-xs text-subtle">
        {type}: {name} — not yet supported
    </div>
);

FormUnsupportedView.displayName = 'FormUnsupportedView';
