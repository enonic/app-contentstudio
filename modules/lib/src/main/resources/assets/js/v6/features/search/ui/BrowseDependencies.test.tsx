import { render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { setContextLayoutMetrics } from '../../../shared/app-state/browsePanels.store';

vi.mock('@enonic/ui', () => ({
    IconButton: ({ icon: _icon, size: _size, variant: _variant, ...props }: Record<string, unknown>) => (
        <button type="button" {...props} />
    ),
}));

vi.mock('../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) =>
        ({
            'action.remove': 'Remove',
            'panel.filter.dependencies.inbound': 'Inbound Dependencies',
            'panel.filter.dependencies.outbound': 'Outbound Dependencies',
        })[key] ?? key,
}));

vi.mock('../../../shared/ui/icons/ContentIcon', () => ({ ContentIcon: () => null }));
vi.mock('../../../shared/ui/LegacyElement', () => ({ LegacyElement: class {} }));

import { BrowseDependencies } from './BrowseDependencies';

const item = {
    getId: () => 'dependency',
    getType: () => 'base:shortcut',
    getIconUrl: () => '',
    getDisplayName: () => 'Example',
    getPath: () => ({ toString: () => '/example' }),
} as unknown as ContentSummary;

describe('BrowseDependencies', () => {
    beforeEach(() => setContextLayoutMetrics({ totalWidth: 700, contextWidth: 360, windowWidth: 700 }));
    afterEach(() => setContextLayoutMetrics({ totalWidth: 0, contextWidth: 0, windowWidth: 0 }));

    it('focuses the visible mobile heading and names the remove button', () => {
        render(<BrowseDependencies item={item} inbound mobileOnly />);

        const heading = screen.getByRole('heading', { name: 'Inbound Dependencies' });
        expect(document.activeElement).toBe(heading);
        expect(heading.getAttribute('tabindex')).toBe('-1');
        expect(screen.getByRole('button', { name: 'Remove Inbound Dependencies' })).toBeTruthy();
    });

    it('names the desktop remove button without moving focus', () => {
        render(<BrowseDependencies item={item} inbound={false} />);

        expect(screen.getByRole('button', { name: 'Remove Outbound Dependencies' })).toBeTruthy();
        expect(document.activeElement).not.toBe(screen.getByRole('heading', { name: 'Outbound Dependencies' }));
    });
});
