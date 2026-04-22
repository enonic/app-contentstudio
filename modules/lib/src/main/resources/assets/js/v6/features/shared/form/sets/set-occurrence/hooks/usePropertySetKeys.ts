import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {useMemo, useRef} from 'react';

/**
 * Returns stable React keys for a list of `PropertySet`s. `PropertySet` has no
 * intrinsic id, and index-based keys leak InputField state across occurrences
 * after add+move. The identity map lives on the hook instance so keys are
 * stable for the occurrence's lifetime without leaking between forms.
 */
export function usePropertySetKeys(propertySets: PropertySet[]): string[] {
    const idByPropertySet = useMemo(() => new WeakMap<PropertySet, string>(), []);
    const nextIdRef = useRef(0);

    return useMemo(() => {
        return propertySets.map((ps) => {
            let id = idByPropertySet.get(ps);
            if (id == null) {
                id = `ps-${nextIdRef.current++}`;
                idByPropertySet.set(ps, id);
            }
            return id;
        });
    }, [propertySets, idByPropertySet]);
}
