import {useEffect} from 'react';
import {resetInspectFormTracking, setInspectFormPresent} from '../../../../../../store/inspect-panel.store';

export function useInspectTextTracking(): void {
    useEffect(() => {
        setInspectFormPresent(true);

        return () => {
            resetInspectFormTracking();
        };
    }, []);
}
