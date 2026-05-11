import {useEffect, useRef, useState} from 'react';

const DELAY = 500;

export function useIsNewOccurrence(startAsNew: boolean): boolean {
    const startAsNewRef = useRef(startAsNew);
    const [isNew, setIsNew] = useState(startAsNew);

    useEffect(() => {
        if (!startAsNewRef.current) return;
        const id = setTimeout(() => setIsNew(false), DELAY);
        return () => clearTimeout(id);
    }, []);

    return isNew;
}
