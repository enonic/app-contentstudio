import {cn} from '@enonic/ui';
import {Flag} from '../../../../app/locale/Flag';
import {ReactElement} from 'react';

export const FlagIcon = ({language, className}: {language: string; className?: string}): ReactElement => {
    const lang = language.toLowerCase();
    const flag = new Flag(lang);
    const countryClass = flag.getCountryClass();
    const flagElement = flag.getEl().getHTMLElement();
    const dataCode = flagElement.getAttribute('data-code') ?? lang.slice(0, 2);
    const initials = lang.slice(0, 2);

    return (
        <div className={cn('relative size-6', className)} aria-hidden="true">
            <div className="absolute inset-0 flex items-center justify-center rounded-full border-1 border-bdr-subtle text-xs font-semibold lowercase text-subtle">
                {initials}
            </div>
            <div className={cn('absolute inset-0 rounded-full flag bg-center', countryClass)} data-code={dataCode} />
        </div>
    );
};

FlagIcon.displayName = 'FlagIcon';
