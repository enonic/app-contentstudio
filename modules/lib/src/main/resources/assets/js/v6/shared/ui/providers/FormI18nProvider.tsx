import { I18nProvider } from '@enonic/ui';
import type { ReactElement, ReactNode } from 'react';
import { translate } from '../../i18n';

export const FormI18nProvider = ({ children }: { children?: ReactNode }): ReactElement => (
    <I18nProvider translate={translate}>{children}</I18nProvider>
);

FormI18nProvider.displayName = 'FormI18nProvider';
