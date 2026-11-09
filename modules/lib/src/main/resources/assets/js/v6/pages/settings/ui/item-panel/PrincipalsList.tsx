import { type Principal } from '@enonic/ui-types';
import { principalPath } from '@enonic/ui-utils';
import { CircleUserRound } from 'lucide-react';
import { ReactElement } from 'react';
import { ItemLabel } from '../../../../shared/ui/ItemLabel';

type PrincipalsListProps = {
    principals: Principal[];
};

export const PrincipalsList = ({ principals }: PrincipalsListProps): ReactElement | null => {
    if (principals.length === 0) {
        return null;
    }

    return (
        <ul className="flex flex-col gap-2">
            {principals.map((principal) => (
                <li key={principal.key}>
                    <ItemLabel
                        icon={<CircleUserRound size={20} strokeWidth={1.5} />}
                        primary={principal.displayName}
                        secondary={principalPath(principal.key)}
                    />
                </li>
            ))}
        </ul>
    );
};

PrincipalsList.displayName = 'PrincipalsList';
