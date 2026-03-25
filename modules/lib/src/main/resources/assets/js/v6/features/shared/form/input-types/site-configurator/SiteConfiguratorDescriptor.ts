import {type InputTypeDescriptor, type ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor';
import {validateForm} from '@enonic/lib-admin-ui/form2';
import {type SiteConfiguratorConfig} from './SiteConfiguratorConfig';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import {$applications} from '../../../../store/applications.store';

export const SiteConfiguratorDescriptor: InputTypeDescriptor<SiteConfiguratorConfig> = {
    name: 'SiteConfigurator' as const,

    getValueType(): ValueType {
        return ValueTypes.DATA;
    },

    readConfig(_raw: RawInputConfig): SiteConfiguratorConfig {
        return {};
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.DATA.newNullValue();
    },

    validate(value: Value, _config: SiteConfiguratorConfig): ValidationResult[] {
        if (value.isNull()) return [];

        const propertySet = value.getPropertySet();
        if (!propertySet) return [];

        const appKey = propertySet.getString(ApplicationConfig.PROPERTY_KEY);
        if (!appKey) return [];

        const app = $applications.get().applications.find(a => a.getApplicationKey().toString() === appKey);
        const appForm = app?.getForm();
        if (!appForm || appForm.getFormItems().length === 0) return [];

        const configSet = propertySet.getPropertySet(ApplicationConfig.PROPERTY_CONFIG);
        if (!configSet) return [];

        const result = validateForm(appForm, configSet);
        if (!result.isValid) {
            return [{message: i18n('field.siteConfig.invalid', app.getDisplayName() ?? appKey)}];
        }

        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
