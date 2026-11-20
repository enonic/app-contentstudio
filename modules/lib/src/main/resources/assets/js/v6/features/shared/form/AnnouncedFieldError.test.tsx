import { act, cleanup, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncedFieldError } from './AnnouncedFieldError';

vi.unmock('@enonic/ui');

describe('AnnouncedFieldError', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('shows the description immediately and announces it after focus has settled', () => {
        const { container, rerender } = render(<AnnouncedFieldError id="error" message={undefined} />);
        const description = container.querySelector('#error')!;
        const region = container.querySelector('[aria-live]')!;
        expect(region).not.toBe(description);

        rerender(<AnnouncedFieldError id="error" message="Application config is invalid" />);
        expect(description.textContent).toBe('Application config is invalid');
        expect(description.hasAttribute('aria-live')).toBe(false);
        expect(region.textContent).toBe('');
        act(() => {
            vi.advanceTimersByTime(499);
        });
        expect(region.textContent).toBe('');
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(region.textContent).toBe('Application config is invalid');
        expect(container.querySelector('[aria-live]')).toBe(region);

        rerender(<AnnouncedFieldError id="error" message="Application config is invalid" />);
        expect(region.textContent).toBe('Application config is invalid');
        rerender(<AnnouncedFieldError id="error" message={undefined} />);
        expect(description.textContent).toBe('');
        expect(region.textContent).toBe('');
    });

    it('cancels obsolete messages and announces only the current error', () => {
        const { container, rerender } = render(<AnnouncedFieldError id="error" message={undefined} />);
        const region = container.querySelector('[aria-live]')!;

        rerender(<AnnouncedFieldError id="error" message="First error" />);
        act(() => {
            vi.advanceTimersByTime(300);
        });
        rerender(<AnnouncedFieldError id="error" message="Second error" />);
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(region.textContent).toBe('');
        act(() => {
            vi.advanceTimersByTime(300);
        });
        expect(region.textContent).toBe('Second error');

        rerender(<AnnouncedFieldError id="error" message="Third error" />);
        rerender(<AnnouncedFieldError id="error" message={undefined} />);
        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(region.textContent).toBe('');
    });
});
