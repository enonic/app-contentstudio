import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {useEffect, useState} from 'react';

export const useObservedActions = (actions: readonly Action[]): number => {
    const [renderVersion, setRenderVersion] = useState(0);

    useEffect(() => {
        const listener = () => setRenderVersion((value) => value + 1);

        actions.forEach((action) => action.onPropertyChanged(listener));

        // Re-read action states to catch changes that occurred before listeners were registered.
        listener();

        return () => {
            actions.forEach((action) => action.unPropertyChanged(listener));
        };
    }, [actions]);

    return renderVersion;
};
