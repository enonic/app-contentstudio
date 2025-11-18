import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {useState, useEffect, useCallback} from 'react';

type UseActionResult = {
    label: string;
    enabled: boolean;
    execute: () => void;
};

export function useAction(action: Action): UseActionResult {
    const [label, setLabel] = useState(action.getLabel());
    const [enabled, setEnabled] = useState(action.isEnabled());

    const execute = useCallback(() => {
        action.execute();
    }, [action]);

    useEffect(() => {
        const updateProps = () => {
            // Always update state - React will handle optimization if values haven't changed
            setLabel(action.getLabel());
            setEnabled(action.isEnabled());
        };

        // Subscribe to action property changes
        action.onPropertyChanged(updateProps);

        // Initial update in case action state changed before mount
        updateProps();

        return () => action.unPropertyChanged(updateProps);
    }, [action]);

    return {label, enabled, execute};
}
