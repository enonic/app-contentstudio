import {useEffect} from 'react';
import {
    resetInspectFormTracking,
    setInspectFormDirty,
    setInspectFormPresent,
    setInspectFormValid,
} from '../../../../../../store/inspect-panel.store';

export function useInspectTextTracking(isDirty: boolean): void {
    useEffect(() => {
        setInspectFormPresent(true);
        setInspectFormValid(true);

        return () => {
            resetInspectFormTracking();
        };
    }, []);

    useEffect(() => {
        setInspectFormDirty(isDirty);
    }, [isDirty]);
}
