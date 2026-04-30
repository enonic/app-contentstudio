import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {Form} from '@enonic/lib-admin-ui/form/Form';
import {useEffect} from 'react';
import {resetInspectFormTracking, setInspectFormPresent} from '../../../../../store/inspect-panel.store';

export function useInspectFormTracking(form: Form | null, propertySet: PropertySet | null): void {
    useEffect(() => {
        if (form == null || propertySet == null || form.getFormItems().length === 0) {
            resetInspectFormTracking();
            return;
        }

        setInspectFormPresent(true);

        return () => {
            resetInspectFormTracking();
        };
    }, [form, propertySet]);
}
