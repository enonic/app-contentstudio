import type {PropertyAddedEvent} from '@enonic/lib-admin-ui/data/PropertyAddedEvent';
import type {PropertyValueChangedEvent} from '@enonic/lib-admin-ui/data/PropertyValueChangedEvent';
import type {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {useValidationVisibility, type ValidationVisibility} from '@enonic/lib-admin-ui/form2';
import {useEffect, useMemo, useState} from 'react';

type OccurrenceInteraction = {
    interacted: boolean;
    validationVisibility: ValidationVisibility;
};

type UseSetChildShowErrorsReturn = {
    childValidationVisibility: Map<number, ValidationVisibility>;
    childShowErrors: Map<number, boolean>;
};

/**
 * Tracks per-occurrence interaction so errors surface only after the user
 * touches an occurrence (or when the form-wide visibility is `'all'`). Needed
 * because freshly-added occurrences must not show validation errors until
 * edited, and the form-level `ValidationVisibility` is not per-occurrence.
 */
export function useSetChildShowErrors(propertyArray: PropertyArray, propertySets: PropertySet[]): UseSetChildShowErrorsReturn {
    const validationVisibility = useValidationVisibility();
    const [tick, setTick] = useState(0);

    const occurrenceInteractions = useMemo(() => new WeakMap<PropertySet, OccurrenceInteraction>(), []);

    const getOrInit = useMemo(() => {
        return (ps: PropertySet, defaultVisibility: ValidationVisibility): OccurrenceInteraction => {
            const existing = occurrenceInteractions.get(ps);
            if (existing != null) return existing;
            const fresh: OccurrenceInteraction = {interacted: false, validationVisibility: defaultVisibility};
            occurrenceInteractions.set(ps, fresh);
            return fresh;
        };
    }, [occurrenceInteractions]);

    useEffect(() => {
        propertySets.forEach((ps) => getOrInit(ps, validationVisibility));
    }, [propertySets, validationVisibility, getOrInit]);

    useEffect(() => {
        const addHandler = (event: PropertyAddedEvent) => {
            const property = event.getProperty();
            if (property.getParent() !== propertyArray.getParent() || property.getName() !== propertyArray.getName()) return;
            const ps = property.getPropertySet();
            if (ps == null) return;
            occurrenceInteractions.set(ps, {interacted: false, validationVisibility: 'none'});
            setTick((t) => t + 1);
        };

        const valueChangedHandler = (event: PropertyValueChangedEvent) => {
            // Walk up the parent chain to find the occurrence-level PropertySet.
            // Edits inside nested option-set data live multiple levels below
            // the occurrence PS, so a single-level lookup would miss them.
            let ps: PropertySet | null = event.getProperty().getParent();
            while (ps != null) {
                const container = ps.getProperty();
                if (container == null) return;
                if (container.getName() === propertyArray.getName() && container.getParent() === propertyArray.getParent()) {
                    break;
                }
                ps = container.getParent();
            }
            if (ps == null) return;
            const current = getOrInit(ps, validationVisibility);
            const nextVisibility: ValidationVisibility = current.validationVisibility === 'none' ? 'all' : current.validationVisibility;
            occurrenceInteractions.set(ps, {interacted: true, validationVisibility: nextVisibility});
            setTick((t) => t + 1);
        };

        propertyArray.onPropertyAdded(addHandler);
        propertyArray.onPropertyValueChanged(valueChangedHandler);

        return () => {
            propertyArray.unPropertyAdded(addHandler);
            propertyArray.unPropertyValueChanged(valueChangedHandler);
        };
    }, [propertyArray, validationVisibility, occurrenceInteractions, getOrInit]);

    const childValidationVisibility = useMemo(() => {
        const map = new Map<number, ValidationVisibility>();
        propertySets.forEach((ps, index) => {
            map.set(index, getOrInit(ps, validationVisibility).validationVisibility);
        });
        return map;
    }, [propertySets, tick, validationVisibility, getOrInit]);

    const childShowErrors = useMemo(() => {
        const map = new Map<number, boolean>();
        propertySets.forEach((ps, index) => {
            const {interacted, validationVisibility: vv} = getOrInit(ps, validationVisibility);
            map.set(index, vv === 'all' || (vv === 'interactive' && interacted));
        });
        return map;
    }, [propertySets, tick, validationVisibility, getOrInit]);

    return {childValidationVisibility, childShowErrors};
}
