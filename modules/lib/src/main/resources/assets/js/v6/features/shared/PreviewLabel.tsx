import {cn} from '@enonic/ui';
import {EyeOff} from 'lucide-react';
import {type ReactElement} from 'react';
import {LegacyElement} from './LegacyElement';

const PREVIEW_LABEL_NAME = 'PreviewLabel';

export type PreviewLabelProps = {
    messages: string[];
    showIcon?: boolean;
    className?: string;
};

export const PreviewLabel = ({messages, showIcon, className}: PreviewLabelProps): ReactElement => (
    <div data-component={PREVIEW_LABEL_NAME} className={cn('flex flex-col gap-2.5 items-center text-center justify-center', className)}>
        {showIcon ? <div className="text-main size-6 shrink-0 m-2.75"><EyeOff strokeWidth={1.5} aria-hidden /></div> : null}
        <div className="w-full">
            {messages.map((message, index) => (
                <span key={`${message}-${index}`} className="block text-subtle font-normal leading-normal">{message}</span>
            ))}
        </div>
    </div>
);

PreviewLabel.displayName = PREVIEW_LABEL_NAME;

//
// Backward compatibility
//

export class PreviewLabelElement extends LegacyElement<typeof PreviewLabel> {

    constructor(props: PreviewLabelProps) {
        super(props, PreviewLabel);
    }
}
