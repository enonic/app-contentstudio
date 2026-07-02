import { useEffect } from 'react';
import { resetInspectFormTracking, setInspectFormPresent } from '../../../../model/inspect-panel.store';

export function useInspectTextTracking(): void {
    useEffect(() => {
        setInspectFormPresent(true);

        return () => {
            resetInspectFormTracking();
        };
    }, []);
}
