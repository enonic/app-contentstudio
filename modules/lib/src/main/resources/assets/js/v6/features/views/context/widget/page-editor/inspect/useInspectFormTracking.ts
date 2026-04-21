import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {Form} from '@enonic/lib-admin-ui/form/Form';
import {validateForm} from '@enonic/lib-admin-ui/form2';
import {useEffect} from 'react';
import {
    resetInspectFormTracking,
    setInspectFormDirty,
    setInspectFormPresent,
    setInspectFormValid,
} from '../../../../../store/inspect-panel.store';

export function useInspectFormTracking(form: Form | null, propertySet: PropertySet | null): void {
    useEffect(() => {
        if (form == null || propertySet == null || form.getFormItems().length === 0) {
            resetInspectFormTracking();
            return;
        }

        setInspectFormPresent(true);
        setInspectFormDirty(false);

        const initialResult = validateForm(form, propertySet);
        setInspectFormValid(initialResult.isValid);

        const handleChanged = (): void => {
            setInspectFormDirty(true);
            const result = validateForm(form, propertySet);
            setInspectFormValid(result.isValid);
        };

        propertySet.onChanged(handleChanged);

        return () => {
            propertySet.unChanged(handleChanged);
            resetInspectFormTracking();
        };
    }, [form, propertySet]);
}
