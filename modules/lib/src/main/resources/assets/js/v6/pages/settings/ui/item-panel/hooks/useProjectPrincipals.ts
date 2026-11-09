import { useEffect, useRef, useState } from 'react';
import { type Principal, type PrincipalKey } from '@enonic/ui-types';
import { type ProjectViewItem } from '../../../../../../app/settings/view/ProjectViewItem';
import { getPrincipalsByKeys } from '../../../../../entities/principal';
import { fromLegacyPrincipalKey } from '../../../../../shared/lib/cms/security/legacy';

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
    return principals.filter((principal) => keys.includes(principal.key));
}

export function useProjectPrincipals(item: ProjectViewItem | null): PrincipalsByRole {
    const [result, setResult] = useState<PrincipalsByRole>(emptyResult);
    const requestIdRef = useRef(0);

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

        const ownersKeys = (permissions.getOwners() ?? []).map(fromLegacyPrincipalKey);
        const editorsKeys = (permissions.getEditors() ?? []).map(fromLegacyPrincipalKey);
        const authorsKeys = (permissions.getAuthors() ?? []).map(fromLegacyPrincipalKey);
        const contributorsKeys = (permissions.getContributors() ?? []).map(fromLegacyPrincipalKey);
        const canReadKeys = (readAccess.getPrincipalsKeys() ?? []).map(fromLegacyPrincipalKey);

        const allKeys = [...ownersKeys, ...editorsKeys, ...authorsKeys, ...contributorsKeys, ...canReadKeys];

        if (allKeys.length === 0) {
            setResult(emptyResult);
            return;
        }

        const requestId = ++requestIdRef.current;
        setResult((prev) => ({ ...prev, loading: true }));

        void getPrincipalsByKeys(allKeys).match(
            (principals) => {
                if (requestId !== requestIdRef.current) return;
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
                if (requestId !== requestIdRef.current) return;
                console.error('Failed to fetch principals:', error);
                setResult(emptyResult);
            },
        );
    }, [item]);

    return result;
}
