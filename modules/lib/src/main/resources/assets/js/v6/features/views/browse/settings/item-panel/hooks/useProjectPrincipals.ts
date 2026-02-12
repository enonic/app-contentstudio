import {useEffect, useState} from 'react';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ProjectViewItem} from '../../../../../../../app/settings/view/ProjectViewItem';
import {getPrincipalsByKeys} from '../../../../../store/principals.store';

type PrincipalsByRole = {
    owners: Principal[];
    editors: Principal[];
    authors: Principal[];
    contributors: Principal[];
    canReadPrincipals: Principal[];
    loading: boolean;
};

const emptyResult: PrincipalsByRole = {
    owners: [],
    editors: [],
    authors: [],
    contributors: [],
    canReadPrincipals: [],
    loading: false,
};

function filterPrincipalsByKeys(principals: Principal[], keys: PrincipalKey[]): Principal[] {
    return principals.filter((principal) =>
        keys.some((key) => key.equals(principal.getKey()))
    );
}

export function useProjectPrincipals(item: ProjectViewItem | null): PrincipalsByRole {
    const [result, setResult] = useState<PrincipalsByRole>(emptyResult);

    useEffect(() => {
        if (!item) {
            setResult(emptyResult);
            return;
        }

        const permissions = item.getPermissions();
        const readAccess = item.getReadAccess();

        if (!permissions || !readAccess) {
            setResult(emptyResult);
            return;
        }

        const ownersKeys = permissions.getOwners() ?? [];
        const editorsKeys = permissions.getEditors() ?? [];
        const authorsKeys = permissions.getAuthors() ?? [];
        const contributorsKeys = permissions.getContributors() ?? [];
        const canReadKeys = readAccess.getPrincipalsKeys() ?? [];

        const allKeys = [...ownersKeys, ...editorsKeys, ...authorsKeys, ...contributorsKeys, ...canReadKeys];

        if (allKeys.length === 0) {
            setResult(emptyResult);
            return;
        }

        setResult((prev) => ({...prev, loading: true}));

        void getPrincipalsByKeys(allKeys).match(
            (principals) => {
                setResult({
                    owners: filterPrincipalsByKeys(principals, ownersKeys),
                    editors: filterPrincipalsByKeys(principals, editorsKeys),
                    authors: filterPrincipalsByKeys(principals, authorsKeys),
                    contributors: filterPrincipalsByKeys(principals, contributorsKeys),
                    canReadPrincipals: filterPrincipalsByKeys(principals, canReadKeys),
                    loading: false,
                });
            },
            (error) => {
                console.error('Failed to fetch principals:', error);
                setResult(emptyResult);
            }
        );
    }, [item]);

    return result;
}
