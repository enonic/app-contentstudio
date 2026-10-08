import { fireEvent, render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { ContentIcon } from './ContentIcon';

vi.mock('lucide-react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('lucide-react')>()),
    FileIcon: ({ className }: { className?: string }) => <span data-testid="built-in-icon" className={className} />,
}));

describe('ContentIcon', () => {
    it('masks a colorable type icon with the text colour', () => {
        const { container } = render(<ContentIcon contentType="app:person" url="/type-icon?hash=abc&colorable=true" />);

        const mask = container.querySelector('span[role="img"]');
        expect(mask).not.toBeNull();
        expect(mask?.getAttribute('style')).toContain('/type-icon?hash=abc&colorable=true&size=128');
        expect(mask?.className).toContain('bg-current');
        expect(container.querySelector('img')).toBeNull();
    });

    it('renders other type icons as an image with a backdrop on dark surfaces', () => {
        const { container } = render(<ContentIcon contentType="app:person" url="/type-icon?hash=abc" />);

        const image = container.querySelector('img');
        expect(image).not.toBeNull();
        expect(image?.className).toContain('dark:bg-alt');
        expect(image?.className).toContain('group-data-[tone=inverse]:bg-alt');
    });

    it('never masks photos or thumbnails, even with the flag in the url', () => {
        const { container } = render(
            <>
                <ContentIcon contentType="app:person" url="/thumbnail?ts=1&colorable=true" hasThumbnail />
                <ContentIcon contentType="media:image" url="/image?colorable=true" />
            </>,
        );

        const images = container.querySelectorAll('img');
        expect(images).toHaveLength(2);
        expect(container.querySelector('span[role="img"]')).toBeNull();
        images.forEach((image) => expect(image.className).not.toContain('dark:bg-alt'));
    });

    it('ignores the url for built-in types', () => {
        const { container } = render(<ContentIcon contentType="base:folder" url="/type-icon?colorable=true" />);

        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('span[role="img"]')).toBeNull();
    });

    it('falls back to the built-in icon when the image fails to load', () => {
        const { container } = render(<ContentIcon contentType="app:broken" url="/broken-icon" />);

        fireEvent.error(container.querySelector('img')!);

        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('[data-testid="built-in-icon"]')).not.toBeNull();
    });
});
