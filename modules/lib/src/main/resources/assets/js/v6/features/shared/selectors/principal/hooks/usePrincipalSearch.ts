import { useCallback, useEffect, useRef, useState } from 'react';
import type { Principal } from '@enonic/ui-types';
import { parsePrincipalKey } from '@enonic/ui-utils';
import { findPrincipals, resolvePrincipalsByKeys } from '../../../../../entities/principal/api/principals.api';
import { isSystemUser, principalDescription } from '../../../../../shared/lib/cms/security/principal';
import type { PrincipalOption } from '../principal.types';

export const buildPrincipalOption = (principal: Principal): PrincipalOption => {
    const key = principal.key;
    const label = principal.displayName || key;
    const description = principalDescription(principal) || key;
    return {
        id: key,
        label,
        description: description !== label ? description : undefined,
        principal,
    };
};

export const shouldSkipPrincipal = (principal: Principal): boolean => isSystemUser(principal.key);

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

        const result = await findPrincipals({ types: ['user'], query, size: 20 });

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

        const keys = principalIds.map(parsePrincipalKey);
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
