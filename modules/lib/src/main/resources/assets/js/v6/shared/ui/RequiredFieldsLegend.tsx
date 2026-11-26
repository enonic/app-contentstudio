import type { ReactElement } from 'react';
import { useI18n } from '../lib/hooks/useI18n';

export const RequiredFieldsLegend = (): ReactElement => (
    <p data-component="RequiredFieldsLegend" className="text-sm text-subtle">
        {useI18n('field.requiredFields')}
    </p>
);

RequiredFieldsLegend.displayName = 'RequiredFieldsLegend';
