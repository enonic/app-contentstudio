import { afterEach, describe, expect, it } from 'vitest';
import { $config, initConfig } from './config.store';

const mountConfig = (json: unknown): void => {
    document.body.innerHTML = `<script id="config" type="application/json">${JSON.stringify(json)}</script>`;
};

afterEach(() => {
    document.body.innerHTML = '';
});

describe('initConfig', () => {
    it('should skip a membership with an invalid key and keep the rest of the config', () => {
        mountConfig({
            adminUrl: '/admin',
            user: { key: 'user:system:alice', displayName: 'Alice' },
            principals: [
                { key: 'role:cms.admin', displayName: 'Content Manager Administrator' },
                { key: 'bogus', displayName: 'Bogus' },
                { key: 'group:system:editors', displayName: 'Editors' },
            ],
        });

        initConfig('config');

        const config = $config.get();
        expect(config.adminUrl).toBe('/admin');
        expect(config.user?.key).toBe('user:system:alice');
        expect(config.principals.map(({ key }) => key)).toEqual(['role:cms.admin', 'group:system:editors']);
    });
});
