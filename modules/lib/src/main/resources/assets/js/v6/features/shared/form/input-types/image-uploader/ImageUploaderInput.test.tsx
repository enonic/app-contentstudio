import { type SelfManagedComponentProps } from '@enonic/input-types';
import { PropertyTree } from '@enonic/input-types/data';
import { type ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getBase64Image } from './lib/canvas';
import { ImageUploaderInput } from './ImageUploaderInput';
import { type ImageUploaderConfig } from './ImageUploaderConfig';

vi.unmock('@enonic/ui');
// The CommonJS focus-trap wrapper requires React directly; its browser behavior is outside these checks.
vi.mock('focus-trap-react', () => ({ FocusTrap: ({ children }: { children: ReactNode }) => children }));
vi.mock('../../FormScopeContext', () => ({
    useFormScope: () => ({ project: { getName: () => 'test' }, content: { getId: () => 'image-id' } }),
    useFormScopeRequirement: () => ({ enabled: true, missing: [] }),
}));
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));
vi.mock('./lib/image', () => ({ getImageUrl: () => 'image-url' }));
vi.mock('./lib/canvas', () => ({ getBase64Image: vi.fn() }));

beforeEach(() => {
    vi.mocked(getBase64Image).mockImplementation(async (_url, orientation) => ({
        base64Image: `image-${orientation}`,
        dimensions: orientation >= 5 ? { w: 200, h: 400 } : { w: 400, h: 200 },
    }));
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

const button = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name });

async function renderEditor() {
    const tree = new PropertyTree();
    const set = tree.addPropertySet('image');
    set.setLongByPath('orientation', 3);
    set.setDoubleByPath('focalPoint.x', 0.25);
    set.setDoubleByPath('focalPoint.y', 0.3);
    for (const [edge, value] of Object.entries({ left: 0.1, top: 0.2, right: 0.9, bottom: 0.8 })) {
        set.setDoubleByPath(`cropPosition.${edge}`, value);
    }
    const props = {
        values: [tree.getProperty('image')!.getValue()],
        enabled: true,
    } as SelfManagedComponentProps<ImageUploaderConfig>;
    const result = render(<ImageUploaderInput {...props} />);
    // happy-dom does not implement :enabled; use its equivalent for this editor's DOM queries.
    const editor = result.container.firstElementChild!;
    const query = editor.querySelector.bind(editor);
    vi.spyOn(editor, 'querySelector').mockImplementation((selector: string) =>
        query(selector.replace(':enabled', ':not(:disabled)')),
    );
    await waitFor(() => expect(button('action.rotate').disabled).toBe(false));
    return { ...result, set };
}

async function press(target: Element, key: string, repeat = false) {
    await act(async () => {
        fireEvent.keyDown(target, {
            key: key === 'r' ? '®' : key,
            code: key === 'r' ? 'KeyR' : key,
            altKey: true,
            repeat,
        });
    });
}

it.each([
    ['action.rotate', 8],
    ['action.mirror', 4],
] as const)(
    'keeps %s focused and supports Option reset, cancel and apply without saving drafts',
    async (name, next) => {
        const { set } = await renderEditor();
        const trigger = button(name);
        const transform = async () => {
            await act(async () => {
                fireEvent.click(trigger);
            });
            expect(document.activeElement).toBe(trigger);
            await waitFor(() => expect(button('action.apply').disabled).toBe(false));
        };
        await transform();
        for (const key of ['r', 'Enter', 'Escape']) fireEvent.keyDown(trigger, { key });
        expect(set.getLong('orientation')).toBe(3);
        await press(trigger, 'r');
        expect(document.activeElement).toBe(trigger);
        await waitFor(() => expect(button('action.reset').disabled).toBe(true));
        expect(set.getLong('orientation')).toBe(3);

        await transform();
        await press(trigger, 'Escape');
        await waitFor(() => expect(screen.queryByRole('button', { name: 'action.apply' })).toBeNull());
        await waitFor(() => expect(document.activeElement).toBe(trigger));
        expect(set.getLong('orientation')).toBe(3);

        await transform();
        await press(trigger, 'Enter', true);
        expect(set.getLong('orientation')).toBe(3);
        await press(trigger, 'Enter');
        expect(set.getLong('orientation')).toBe(next);
        expect(document.activeElement).toBe(trigger);
    },
);

it.each(['crop', 'focus'] as const)('resets only %s and applies with Option+Enter', async (mode) => {
    const { set } = await renderEditor();
    const trigger = button(mode === 'crop' ? 'editor.cropimage' : 'editor.setautofocus');
    await act(async () => {
        fireEvent.click(trigger);
    });
    await waitFor(() => expect(button('action.apply').disabled).toBe(false));
    const svg = screen.getByRole('application');
    await press(svg, 'r');
    expect(screen.queryByRole('dialog')).toBeNull();
    // Reset is still a draft until Apply.
    expect(set.getPropertySet('cropPosition')!.getDouble('left')).toBe(0.1);
    expect(set.getPropertySet('focalPoint')!.getDouble('x')).toBe(0.25);
    await press(svg, 'Enter');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(set.getLong('orientation')).toBe(3);
    if (mode === 'crop') {
        expect(set.getPropertySet('cropPosition')).toBeUndefined();
        expect(set.getPropertySet('focalPoint')!.getDouble('x')).toBe(0.25);
        expect(set.getPropertySet('focalPoint')!.getDouble('y')).toBe(0.3);
    } else {
        expect(set.getPropertySet('cropPosition')!.getDouble('left')).toBe(0.1);
        expect(set.getPropertySet('focalPoint')!.getDouble('x')).toBeCloseTo(0.5);
        expect(set.getPropertySet('focalPoint')!.getDouble('y')).toBeCloseTo(0.5);
    }
});

it('requires confirmation for Option+R outside editing and isolates dialog shortcuts', async () => {
    const { set } = await renderEditor();
    const trigger = button('action.rotate');
    trigger.focus();
    await press(trigger, 'r');
    const dialog = await screen.findByRole('dialog');
    await press(dialog, 'r');
    expect(set.getLong('orientation')).toBe(3);
    fireEvent.click(button('action.cancel'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(set.getLong('orientation')).toBe(3);

    await press(button('action.reset'), 'r');
    await screen.findByRole('dialog');
    fireEvent.click(button('action.confirm'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(set.getProperty('orientation')).toBeUndefined();
    expect(set.getPropertySet('cropPosition')).toBeUndefined();
    expect(set.getPropertySet('focalPoint')!.getDouble('x')).toBe(0.5);
});

it.each([
    ['focus', 'Enter', false],
    ['crop', 'Escape', false],
    ['crop', 'Enter', true],
] as const)(
    'finishes %s with Option+%s without losing or stealing focus (moved away: %s)',
    async (mode, key, moveAway) => {
        const { container } = await renderEditor();
        const trigger = button(mode === 'crop' ? 'editor.cropimage' : 'editor.setautofocus');
        await act(async () => {
            fireEvent.click(trigger);
        });
        const svg = screen.getByRole('application');
        expect(document.activeElement).toBe(svg);
        let finishLoad: (image: Awaited<ReturnType<typeof getBase64Image>>) => void;
        if (mode === 'crop') {
            vi.mocked(getBase64Image).mockReturnValueOnce(
                new Promise((resolve) => {
                    finishLoad = resolve;
                }),
            );
        }
        await press(svg, key);
        if (mode === 'crop') {
            const outside = document.createElement('input');
            container.append(outside);
            if (moveAway) outside.focus();
            await act(async () => finishLoad({ base64Image: 'finished', dimensions: { w: 400, h: 200 } }));
            if (moveAway) {
                expect(document.activeElement).toBe(outside);
                return;
            }
        }
        await waitFor(() => expect(document.activeElement).toBe(trigger));
    },
);
