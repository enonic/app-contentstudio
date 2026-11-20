import { FieldError } from '@enonic/input-types';
import { type ReactElement } from 'react';
import { PoliteAnnouncement } from './PoliteAnnouncement';

type AnnouncedFieldErrorProps = {
    id: string;
    message: string | undefined;
    label?: string;
};

/** Keeps the error description immediate, while letting focus announcements finish first. */
export const AnnouncedFieldError = ({ id, message, label }: AnnouncedFieldErrorProps): ReactElement => {
    return (
        <>
            <div id={id}>
                <FieldError message={message} announce={false} />
            </div>
            <PoliteAnnouncement message={message && label ? `${label}: ${message}` : message} />
        </>
    );
};
