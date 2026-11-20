import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { useRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { useContentRowFocus } from './useContentRowFocus';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

it.each([false, true])('only updates a hovered icon on scroll (hovered: %s)', async (hovered) => {
    vi.useFakeTimers();
    const onRender = vi.fn();
    const Probe = ({ id }: { id: number }) => {
        const anchorRef = useRef<HTMLSpanElement>(null);
        const { disabled } = useContentRowFocus(anchorRef);
        onRender(id, disabled);
        return <span ref={anchorRef} data-testid={`icon-${id}`} />;
    };
    render(
        <div data-testid="scroller">
            {Array.from({ length: 20 }, (_, id) => (
                <div key={id} role="row">
                    <Probe id={id} />
                </div>
            ))}
        </div>,
    );
    if (hovered) {
        fireEvent.mouseEnter(screen.getByTestId('icon-0'));
    }
    onRender.mockClear();
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame');
    await act(async () => {
        fireEvent.scroll(screen.getByTestId('scroller'));
    });
    expect(requestFrame).toHaveBeenCalledTimes(hovered ? 1 : 0);
    await act(async () => {
        vi.advanceTimersToNextFrame();
    });
    expect(onRender.mock.calls).toEqual(
        hovered
            ? [
                  [0, true],
                  [0, false],
              ]
            : [],
    );

    onRender.mockClear();
    requestFrame.mockClear();
    await act(async () => {
        fireEvent.scroll(screen.getByTestId('scroller'));
        vi.advanceTimersToNextFrame();
    });
    expect(requestFrame).not.toHaveBeenCalled();
    expect(onRender).not.toHaveBeenCalled();
});
