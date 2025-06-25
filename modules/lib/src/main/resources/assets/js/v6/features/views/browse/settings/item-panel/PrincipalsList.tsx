import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {CircleUserRound} from 'lucide-react';
import {ReactElement} from 'react';
import {ItemLabel} from '../../../../shared/ItemLabel';

type PrincipalsListProps = {
    principals: Principal[];
};

export const PrincipalsList = ({principals}: PrincipalsListProps): ReactElement | null => {
    if (principals.length === 0) {
        return null;
    }

    return (
        <ul className="flex flex-col gap-2">
            {principals.map((principal) => (
                <li key={principal.getKey().toString()}>
                    <ItemLabel
                        icon={<CircleUserRound size={20} strokeWidth={1.5} />}
                        primary={principal.getDisplayName()}
                        secondary={principal.getKey().toPath()}
                    />
                </li>
            ))}
        </ul>
    );
};

PrincipalsList.displayName = 'PrincipalsList';
