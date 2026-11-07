import { type ReactElement } from 'react';
import { useDebouncedValue } from '../../../../../../shared/lib/hooks/useDebouncedValue';

type Props = {
    id: string;
    help: string;
    position: string;
    changeKey: string;
    active: boolean;
};

export function getImagePercent(value: number, size: number): number {
    return size > 0 ? Math.round((value / size) * 1000) / 10 : 0;
}

export const ImageUploaderInputKeyboardDescription = ({
    id,
    help,
    position,
    changeKey,
    active,
}: Props): ReactElement => {
    // Track raw coordinates so rounding cannot announce a position while movement continues.
    const settledKey = useDebouncedValue(changeKey, 300);

    return (
        <>
            <span id={id} className="sr-only">
                {help} {position}
            </span>
            <span role="status" aria-live={active ? 'polite' : 'off'} aria-atomic="true" className="sr-only">
                {settledKey === changeKey ? position : ''}
            </span>
        </>
    );
};
