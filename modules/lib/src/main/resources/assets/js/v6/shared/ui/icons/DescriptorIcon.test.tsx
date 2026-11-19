import { act, render, screen } from '@testing-library/preact';
import { Box } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DescriptorIcon } from './DescriptorIcon';

vi.mock('lucide-react', () => ({
    Box: (props: Record<string, unknown>) => <svg data-testid="icon-box" {...props} />,
}));

type ImageProbe = { onload: (() => void) | null; onerror: (() => void) | null; src: string };

describe('DescriptorIcon', () => {
    const probes: ImageProbe[] = [];

    class ImageMock implements ImageProbe {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';

        constructor() {
            probes.push(this);
        }
    }

    afterEach(() => {
        probes.length = 0;
        vi.unstubAllGlobals();
    });

    it('masks a colorable icon with the text colour', () => {
        const { container } = render(
            <DescriptorIcon iconUrl="/part-icon?hash=abc&colorable=true" fallback={Box} className="size-5 text-alt" />,
        );

        const mask = container.querySelector('span');
        expect(mask?.getAttribute('style')).toContain('/part-icon?hash=abc&colorable=true');
        expect(mask?.className).toContain('bg-current');
        expect(mask?.className).toContain('text-alt');
        expect(container.querySelector('img')).toBeNull();
    });

    it('renders other icons as an image', () => {
        const { container } = render(<DescriptorIcon iconUrl="/part-icon?hash=abc" fallback={Box} />);

        expect(container.querySelector('img')?.getAttribute('src')).toBe('/part-icon?hash=abc');
        expect(container.querySelector('span')).toBeNull();
    });

    it('falls back when a colorable icon fails to load', () => {
        vi.stubGlobal('Image', ImageMock);
        const { container } = render(
            <DescriptorIcon iconUrl="/part-icon?hash=abc&colorable=true" fallback={Box} className="size-5" />,
        );

        expect(probes.map((probe) => probe.src)).toEqual(['/part-icon?hash=abc&colorable=true']);
        act(() => probes[0].onerror?.());

        expect(container.querySelector('span')).toBeNull();
        expect(screen.getByTestId('icon-box')).toBeDefined();
    });

    it('keeps the previous colorable icon until its replacement loads', () => {
        vi.stubGlobal('Image', ImageMock);
        const view = (iconUrl: string) => (
            <DescriptorIcon iconUrl={iconUrl} fallback={Box} retainPreviousIcon className="size-5" />
        );
        const maskUrl = (): string | undefined => container.querySelector('span')?.getAttribute('style') ?? undefined;

        const { container, rerender } = render(view('/old?hash=a&colorable=true'));
        act(() => probes[0].onload?.());

        rerender(view('/new?hash=b&colorable=true'));
        expect(probes[1].src).toBe('/new?hash=b&colorable=true');
        expect(maskUrl()).toContain('/old?hash=a');

        act(() => probes[1].onload?.());
        expect(maskUrl()).toContain('/new?hash=b');
    });
});
