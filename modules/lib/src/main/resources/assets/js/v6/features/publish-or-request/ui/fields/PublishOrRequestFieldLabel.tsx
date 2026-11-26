// Label of a field on the publish or request dialog's second step: its name, a red mark
// when it must be filled, and its help line. For the fields that can be required.

import { type ReactElement } from 'react';

export type PublishOrRequestFieldLabelProps = {
    label: string;
    helpText: string;
    required: boolean;
    /** Id of the control the label names. Without it the name is plain text. */
    htmlFor?: string;
    /** Id given to the help line, for the control to point at with `aria-describedby`. */
    helpId?: string;
};

const PUBLISH_OR_REQUEST_FIELD_LABEL_NAME = 'PublishOrRequestFieldLabel';

const NAME_CLASS_NAME = 'block text-base font-semibold text-main';

export const PublishOrRequestFieldLabel = ({
    label,
    helpText,
    required,
    htmlFor,
    helpId,
}: PublishOrRequestFieldLabelProps): ReactElement => {
    // ? Hidden from screen readers: the control itself says that it is required.
    const mark = required && (
        <span className="text-error" aria-hidden>
            {' *'}
        </span>
    );

    return (
        <div data-component={PUBLISH_OR_REQUEST_FIELD_LABEL_NAME}>
            {htmlFor ? (
                <label htmlFor={htmlFor} className={NAME_CLASS_NAME}>
                    {label}
                    {mark}
                </label>
            ) : (
                <span className={NAME_CLASS_NAME}>
                    {label}
                    {mark}
                </span>
            )}
            <p id={helpId} className="text-sm text-subtle">
                {helpText}
            </p>
        </div>
    );
};

PublishOrRequestFieldLabel.displayName = PUBLISH_OR_REQUEST_FIELD_LABEL_NAME;
