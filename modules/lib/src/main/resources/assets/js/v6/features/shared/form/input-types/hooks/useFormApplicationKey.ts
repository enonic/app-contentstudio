import { type ApplicationKey } from '../../../../../shared/lib/cms/application/applicationKey';
import { useFormRender } from '@enonic/input-types';

/** The application whose schema the form renders. */
export function useFormApplicationKey(): ApplicationKey | undefined {
    const { applicationKey } = useFormRender();
    return applicationKey;
}
