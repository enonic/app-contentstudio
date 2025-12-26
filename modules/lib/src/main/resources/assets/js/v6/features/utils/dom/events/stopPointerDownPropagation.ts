import type {ComponentPropsWithoutRef} from 'react';

type PointerDownHandler = NonNullable<ComponentPropsWithoutRef<'div'>['onPointerDown']>;

export function stopPointerDownPropagation(event: Parameters<PointerDownHandler>[0]): void {
    event.stopPropagation();
}
