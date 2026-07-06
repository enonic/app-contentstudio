import { useCallback, useEffect, useRef, useState } from 'react';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { PrincipalType } from '@enonic/lib-admin-ui/security/PrincipalType';
import type { Principal } from '@enonic/lib-admin-ui/security/Principal';
import { findPrincipals, resolvePrincipalsByKeys } from '../../../../../entities/principal/api/principals.api';
import type { AssigneeSelectorOption } from '../assignee.types';

export const buildAssigneeOption = (principal: Principal): AssigneeSelectorOption => {
    const label = principal.getDisplayName() || principal.getKey().toString();
    const description = principal.getDescription() || principal.getKey().toString();
    return {
        id: principal.getKey().toString(),
        label,
        description: description !== label ? description : undefined,
    };
};

export const shouldSkipPrincipal = (principal: Principal): boolean => {
    const key = principal.getKey();
    return key.equals(PrincipalKey.ofAnonymous()) || key.equals(PrincipalKey.ofSU());
};

export type UseAssigneeSearchResult = {
    options: AssigneeSelectorOption[];
    loadAssignees: (query: string) => Promise<void>;
    handleSearchChange: (value: string) => void;
};

export const useAssigneeSearch = (): UseAssigneeSearchResult => {
    const [options, setOptions] = useState<AssigneeSelectorOption[]>([]);
    const requestIdRef = useRef(0);

    const loadAssignees = useCallback(async (query: string): Promise<void> => {
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
            .map(buildAssigneeOption);

        setOptions(nextOptions);
    }, []);

    useEffect(() => {
        void loadAssignees('');
    }, [loadAssignees]);

    const handleSearchChange = useCallback(
        (value: string): void => {
            void loadAssignees(value);
        },
        [loadAssignees],
    );

    return { options, loadAssignees, handleSearchChange };
};

export type UseAssigneeSelectionParams = {
    assigneeIds: string[];
    assignees?: Principal[] | null;
    filterSystem?: boolean;
};

export const useAssigneeSelection = ({
    assigneeIds,
    assignees,
    filterSystem = false,
}: UseAssigneeSelectionParams): AssigneeSelectorOption[] => {
    const [selectedOptions, setSelectedOptions] = useState<AssigneeSelectorOption[]>([]);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        if (assigneeIds.length === 0) {
            setSelectedOptions([]);
            return;
        }

        if (assignees && assignees.length > 0) {
            const filtered = filterSystem
                ? assignees.filter((principal) => !shouldSkipPrincipal(principal))
                : assignees;
            setSelectedOptions(filtered.map(buildAssigneeOption));
            return;
        }

        const keys = assigneeIds.map((id) => PrincipalKey.fromString(id));
        void resolvePrincipalsByKeys(keys).match(
            (principals) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                const filtered = filterSystem
                    ? principals.filter((principal) => !shouldSkipPrincipal(principal))
                    : principals;
                setSelectedOptions(filtered.map(buildAssigneeOption));
            },
            (error) => {
                console.error(error);
                if (requestId === requestIdRef.current) {
                    setSelectedOptions([]);
                }
            },
        );
    }, [assigneeIds, assignees, filterSystem]);

    return selectedOptions;
};
