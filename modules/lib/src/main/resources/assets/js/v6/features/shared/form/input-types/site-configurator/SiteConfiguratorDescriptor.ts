import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { validateForm } from '@enonic/input-types';
import { i18n } from '../../../../../shared/i18n';
import { type SiteConfiguratorConfig } from './SiteConfiguratorConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import { APPLICATION_CONFIG_PROPERTY } from '../../../../../shared/lib/cms/application/applicationConfig';
import { $applications } from '../../../../../entities/application';
import type { InputConfigEntries } from '@enonic/input-types';
import type { FormScopeRequirement } from '../../FormScopeContext';

export const SiteConfiguratorDescriptor: InputTypeDescriptor<SiteConfiguratorConfig> = {
    name: 'SiteConfigurator' as const,

    getValueType(): ValueType {
        return ValueTypes.DATA;
    },

    readConfig(_raw: InputConfigEntries): SiteConfiguratorConfig {
        return {};
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.DATA.newNullValue();
    },

    validate(value: Value, _config: SiteConfiguratorConfig): ValidationResult[] {
        if (value.isNull()) return [];

        const propertySet = value.getPropertySet();
        if (!propertySet) return [];

        const appKey = propertySet.getString(APPLICATION_CONFIG_PROPERTY.KEY);
        if (!appKey) return [];

        const app = $applications.get().applications.find((a) => a.key === appKey);
        const appForm = app?.form;
        if (!appForm || appForm.getFormItems().length === 0) return [];

        const configSet = propertySet.getPropertySet(APPLICATION_CONFIG_PROPERTY.CONFIG);
        if (!configSet) return [];

        const result = validateForm(appForm, configSet);
        if (!result.isValid) {
            return [{ message: i18n('field.siteConfig.invalid', app.displayName ?? appKey) }];
        }

        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};

/** What the input needs from the form scope; see `formScopeRequirements`. */
export const SITE_CONFIGURATOR_SCOPE_REQUIREMENT: FormScopeRequirement = { content: true };
