import { ApplicationKey as LegacyApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { type ApplicationKey } from './applicationKey';

export const toLegacyApplicationKey = (key: ApplicationKey): LegacyApplicationKey =>
    LegacyApplicationKey.fromString(key);
