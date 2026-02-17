import {ReactElement} from 'react';

type MixinViewProps = {
    displayName: string;
};

export const MixinView = ({displayName}: MixinViewProps): ReactElement => {
    return (
        <p className="text-subtle">{displayName} configuration</p>
    );
};

MixinView.displayName = 'XDataView';
