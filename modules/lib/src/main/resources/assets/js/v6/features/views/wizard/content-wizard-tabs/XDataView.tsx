import {ReactElement} from 'react';

type XDataViewProps = {
    displayName: string;
};

export const XDataView = ({displayName}: XDataViewProps): ReactElement => {
    return (
        <p className="text-subtle">{displayName} configuration</p>
    );
};

XDataView.displayName = 'XDataView';
