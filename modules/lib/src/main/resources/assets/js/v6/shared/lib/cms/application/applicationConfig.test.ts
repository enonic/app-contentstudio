import { ApplicationConfig as LegacyApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { ApplicationKey as LegacyApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { PropertyTree } from '@enonic/input-types/data';
import { describe, expect, it } from 'vitest';
import { APPLICATION_CONFIG_PROPERTY, applicationConfigToJson, fromLegacyApplicationConfig } from './applicationConfig';

const createConfigSet = () => {
    const tree = new PropertyTree();
    tree.getRoot().setString('instructions', 0, 'Be brief');
    return tree.getRoot();
};

describe('applicationConfig', () => {
    it('should name the properties the way the legacy class does', () => {
        expect(APPLICATION_CONFIG_PROPERTY.KEY).toBe(LegacyApplicationConfig.PROPERTY_KEY);
        expect(APPLICATION_CONFIG_PROPERTY.CONFIG).toBe(LegacyApplicationConfig.PROPERTY_CONFIG);
    });

    it('should serialize to the same JSON as the legacy class', () => {
        const config = createConfigSet();
        const legacy = LegacyApplicationConfig.create()
            .setApplicationKey(LegacyApplicationKey.fromString('com.app'))
            .setConfig(config)
            .build();

        expect(applicationConfigToJson({ applicationKey: 'com.app', config })).toEqual(legacy.toJson());
    });

    it('should copy the key and the config off a legacy config', () => {
        const config = createConfigSet();
        const legacy = LegacyApplicationConfig.create()
            .setApplicationKey(LegacyApplicationKey.fromString('com.app'))
            .setConfig(config)
            .build();

        expect(fromLegacyApplicationConfig(legacy)).toEqual({ applicationKey: 'com.app', config });
    });
});
