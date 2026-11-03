import { act, render } from '@testing-library/preact';
import { okAsync } from 'neverthrow';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchContextWidgetHtml } from '../api/contextWidget.api';
import type { ContextWidget } from '../model/contextWidget.types';
import { ExternalContextWidget } from './ExternalContextWidget';

vi.mock('@enonic/ui', () => ({
    cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
    Skeleton: Object.assign(({ className }: { className?: string }) => <div className={className} />, {
        Group: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    }),
}));

vi.mock('../api/contextWidget.api', () => ({
    fetchContextWidgetHtml: vi.fn(),
}));

vi.mock('../../../../app/extension/ContextPanelExtensionElement', () => ({
    ContextPanelExtensionElement: {
        create: () =>
            Object.assign(document.createElement('div'), {
                setHtml: vi.fn().mockResolvedValue(undefined),
                cleanup: vi.fn(),
            }),
    },
}));

const WIDGET: ContextWidget = {
    key: 'com.example.app:widget',
    name: 'widget',
    applicationKey: 'com.example.app',
    title: 'Widget',
    description: '',
    url: 'https://example.test/widget',
};

async function flush(): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

describe('ExternalContextWidget', () => {
    beforeEach(() => {
        vi.mocked(fetchContextWidgetHtml).mockReset().mockReturnValue(okAsync('<p>widget</p>'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should fetch the widget html once on mount', async () => {
        render(<ExternalContextWidget widget={WIDGET} />);
        await flush();

        expect(fetchContextWidgetHtml).toHaveBeenCalledTimes(1);
        expect(fetchContextWidgetHtml).toHaveBeenCalledWith(expect.objectContaining({ url: WIDGET.url }));
    });

    it('should refetch the widget on ReloadActiveExtensionEvent', async () => {
        render(<ExternalContextWidget widget={WIDGET} />);
        await flush();

        await act(async () => {
            window.dispatchEvent(new CustomEvent('ReloadActiveExtensionEvent'));
        });
        await flush();

        expect(fetchContextWidgetHtml).toHaveBeenCalledTimes(2);
    });

    it('should stop listening for reloads after unmount', async () => {
        const { unmount } = render(<ExternalContextWidget widget={WIDGET} />);
        await flush();
        unmount();

        window.dispatchEvent(new CustomEvent('ReloadActiveExtensionEvent'));
        await flush();

        expect(fetchContextWidgetHtml).toHaveBeenCalledTimes(1);
    });
});
