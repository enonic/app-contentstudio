import {useEffect} from 'react';
import {
    resetInspectFormTracking,
    setInspectFormPresent,
    setInspectFormValid,
} from '../../../../../../store/inspect-panel.store';

export function useInspectTextTracking(): void {
    useEffect(() => {
        setInspectFormPresent(true);
        setInspectFormValid(true);

        return () => {
            resetInspectFormTracking();
        };
    }, []);
}
