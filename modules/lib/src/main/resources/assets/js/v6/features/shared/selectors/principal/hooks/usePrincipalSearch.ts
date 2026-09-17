import { useCallback, useEffect, useRef, useState } from 'react';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { PrincipalType } from '@enonic/lib-admin-ui/security/PrincipalType';
import type { Principal } from '@enonic/lib-admin-ui/security/Principal';
import { findPrincipals, resolvePrincipalsByKeys } from '../../../../../entities/principal/api/principals.api';
import type { PrincipalOption } from '../principal.types';

export const buildPrincipalOption = (principal: Principal): PrincipalOption => {
    const key = principal.getKey().toString();
    const label = principal.getDisplayName() || key;
    const description = principal.getDescription() || key;
    return {
        id: key,
        label,
        description: description !== label ? description : undefined,
        principal,
    };
};

export const shouldSkipPrincipal = (principal: Principal): boolean => {
    const key = principal.getKey();
    return key.equals(PrincipalKey.ofAnonymous()) || key.equals(PrincipalKey.ofSU());
};

export type UsePrincipalSearchResult = {
    options: PrincipalOption[];
    loadOptions: (query: string) => Promise<void>;
    handleSearchChange: (value: string) => void;
};

export const usePrincipalSearch = (): UsePrincipalSearchResult => {
    const [options, setOptions] = useState<PrincipalOption[]>([]);
    const requestIdRef = useRef(0);

    const loadOptions = useCallback(async (query: string): Promise<void> => {
        const requestId = ++requestIdRef.current;

        const result = await findPrincipals({ types: [PrincipalType.USER], query, size: 20 });

        if (result.isErr()) {
            console.error(result.error);
            if (requestId === requestIdRef.current) {
                setOptions([]);
            }
            return;
        }

        if (requestId !== requestIdRef.current) {
            return;
        }

        const nextOptions = result.value
            .filter((principal) => !shouldSkipPrincipal(principal))
            .map(buildPrincipalOption);

        setOptions(nextOptions);
    }, []);

    useEffect(() => {
        void loadOptions('');
    }, [loadOptions]);

    const handleSearchChange = useCallback(
        (value: string): void => {
            void loadOptions(value);
        },
        [loadOptions],
    );

    return { options, loadOptions, handleSearchChange };
};

export type UsePrincipalSelectionParams = {
    principalIds: string[];
    principals?: Principal[] | null;
    filterSystem?: boolean;
};

export const usePrincipalSelection = ({
    principalIds,
    principals,
    filterSystem = false,
}: UsePrincipalSelectionParams): PrincipalOption[] => {
    const [selectedOptions, setSelectedOptions] = useState<PrincipalOption[]>([]);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        if (principalIds.length === 0) {
            setSelectedOptions([]);
            return;
        }

        if (principals && principals.length > 0) {
            const filtered = filterSystem
                ? principals.filter((principal) => !shouldSkipPrincipal(principal))
                : principals;
            setSelectedOptions(filtered.map(buildPrincipalOption));
            return;
        }

        const keys = principalIds.map((id) => PrincipalKey.fromString(id));
        void resolvePrincipalsByKeys(keys).match(
            (resolved) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                const filtered = filterSystem
                    ? resolved.filter((principal) => !shouldSkipPrincipal(principal))
                    : resolved;
                setSelectedOptions(filtered.map(buildPrincipalOption));
            },
            (error) => {
                console.error(error);
                if (requestId === requestIdRef.current) {
                    setSelectedOptions([]);
                }
            },
        );
    }, [principalIds, principals, filterSystem]);

    return selectedOptions;
};
