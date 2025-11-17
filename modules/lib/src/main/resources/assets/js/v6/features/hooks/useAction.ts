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
    }, [action.execute]);

    const updateProps = () => {
        const newLabel = action.getLabel();
        if (newLabel !== label) {
            setLabel(newLabel);
        }

        const newEnabled = action.isEnabled();
        if (newEnabled !== enabled) {
            setEnabled(newEnabled);
        }
    };

    useEffect(() => {
        action.onPropertyChanged(updateProps);
        return () => action.unPropertyChanged(updateProps);
    }, [action]);

    return {label, enabled, execute};
}
