import { i18n, Messages } from '@enonic/lib-admin-ui/util/Messages';
import { I18nProvider } from '@enonic/ui';
import { fromLookup, type Translate } from '@enonic/ui-utils';
import type { ReactElement, ReactNode } from 'react';

// The toolkit's and @enonic/ui's own labels resolve against phrases.properties where a key is
// there, and fall back to their English where it is not.
const translate: Translate = fromLookup(
    (key) => Messages.hasMessage(key),
    (key, ...values) => i18n(key, ...values),
);

export const FormI18nProvider = ({ children }: { children?: ReactNode }): ReactElement => (
    <I18nProvider translate={translate}>{children}</I18nProvider>
);

FormI18nProvider.displayName = 'FormI18nProvider';
