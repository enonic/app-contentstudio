import { act, cleanup, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { AttachmentUploaderList, type AttachmentUploaderListProps } from './AttachmentUploaderList';

vi.unmock('@enonic/ui');
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));
vi.mock('../../../../../shared/lib/url/cms', () => ({ getCmsApiUrl: (path: string) => `/cms/${path}` }));

afterEach(cleanup);

it('announces an attachment error with the filename and connects it to the matching link', async () => {
    const props: AttachmentUploaderListProps = {
        names: ['first.pdf', 'second.pdf'],
        contentId: 'content-id',
        disabled: false,
        onRemove: vi.fn(),
    };
    const { container, rerender } = render(<AttachmentUploaderList {...props} />);
    const first = screen.getByRole('link', { name: 'first.pdf' });
    const second = screen.getByRole('link', { name: 'second.pdf' });
    await act(async () => first.closest<HTMLElement>('[role="gridcell"]')!.focus());
    const focused = document.activeElement;
    const regions = Array.from(container.querySelectorAll('[aria-live]'));
    expect(regions).toHaveLength(2);
    expect(regions.every((region) => region.textContent === '')).toBe(true);

    rerender(<AttachmentUploaderList {...props} errors={new Map([['second.pdf', 'File is too large']])} />);
    expect(regions[0].textContent).toBe('');
    expect(regions[1].textContent).toBe('second.pdf: File is too large');
    expect(regions[1].getAttribute('aria-live')).toBe('polite');
    expect(regions[1].getAttribute('aria-atomic')).toBe('true');
    const errorId = second.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)?.textContent).toBe('File is too large');
    expect(second.closest('[role="gridcell"]')?.getAttribute('aria-describedby')).toBe(errorId);
    expect(second.closest('[role="gridcell"]')?.getAttribute('aria-label')).toBe('second.pdf');
    expect(first.hasAttribute('aria-describedby')).toBe(false);
    expect(document.activeElement).toBe(focused);

    rerender(<AttachmentUploaderList {...props} />);
    expect(regions[1].textContent).toBe('');
    expect(second.hasAttribute('aria-describedby')).toBe(false);
    expect(Array.from(container.querySelectorAll('[aria-live]'))).toEqual(regions);
});
