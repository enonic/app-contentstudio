import type { Principal } from '@enonic/lib-admin-ui/security/Principal';
import type { PrincipalType } from '@enonic/lib-admin-ui/security/PrincipalType';
import { useStore } from '@nanostores/preact';
import { useCallback, useEffect, useMemo } from 'react';
import { $principals, initPrincipals, loadPrincipals } from './principals.store';

export type PrincipalOptionsParams = {
    allowedTypes: PrincipalType[];
    /** Must be referentially stable — it is a memo dependency. Hoist it or wrap it in useCallback. */
    customFilter?: (principal: Principal) => boolean;
};

export type PrincipalOptionsResult = {
    options: { id: string; label: string; principal: Principal }[];
    onSearchChange: (query: string) => void;
};

// Options carry no description, so the selector's own filtering matches on display name only,
// as the store-backed pickers always have.
export const usePrincipalOptions = ({ allowedTypes, customFilter }: PrincipalOptionsParams): PrincipalOptionsResult => {
    const { principals } = useStore($principals);
    const allowedTypesKey = allowedTypes.join(',');

    const options = useMemo(() => {
        return principals
            .filter((principal) => allowedTypes.includes(principal.getType()) && (customFilter?.(principal) ?? true))
            .map((principal) => ({
                id: principal.getKey().toString(),
                label: principal.getDisplayName(),
                principal,
            }));
    }, [principals, allowedTypesKey, customFilter]);

    // Nothing else primed the store, so the first open of a picker used to show the empty label
    // until the debounced search landed. initPrincipals latches, so co-mounted pickers share one fetch.
    useEffect(() => {
        initPrincipals();
    }, []);

    const onSearchChange = useCallback((query: string): void => {
        loadPrincipals(query);
    }, []);

    return { options, onSearchChange };
};
