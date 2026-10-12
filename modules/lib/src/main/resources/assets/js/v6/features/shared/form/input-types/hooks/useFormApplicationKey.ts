import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { useFormRender } from '@enonic/input-types';
import { useMemo } from 'react';

/** The application whose schema the form renders, as the key object, memoised per render context. */
export function useFormApplicationKey(): ApplicationKey | undefined {
    const { applicationKey } = useFormRender();
    return useMemo(
        () => (applicationKey == null ? undefined : ApplicationKey.fromString(applicationKey)),
        [applicationKey],
    );
}
