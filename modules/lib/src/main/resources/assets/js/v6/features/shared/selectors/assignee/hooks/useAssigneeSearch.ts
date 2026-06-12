import {useCallback, useEffect, useRef, useState} from 'react';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {FindPrincipalsRequest} from '@enonic/lib-admin-ui/security/FindPrincipalsRequest';
import type {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {UrlHelper} from '../../../../../../app/util/UrlHelper';
import {GetPrincipalsByKeysRequest} from '../../../../../../app/security/GetPrincipalsByKeysRequest';
import type {AssigneeSelectorOption} from '../assignee.types';

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
        try {
            const principals = await new FindPrincipalsRequest()
                .setPostfixUri(UrlHelper.getCmsRestUri(''))
                .setAllowedTypes([PrincipalType.USER])
                .setSearchQuery(query)
                .setSize(20)
                .sendAndParse();

            if (requestId !== requestIdRef.current) {
                return;
            }

            const nextOptions = principals
                .filter(principal => !shouldSkipPrincipal(principal))
                .map(buildAssigneeOption);

            setOptions(nextOptions);
        } catch (error) {
            console.error(error);
            if (requestId === requestIdRef.current) {
                setOptions([]);
            }
        }
    }, []);

    useEffect(() => {
        void loadAssignees('');
    }, [loadAssignees]);

    const handleSearchChange = useCallback((value: string): void => {
        void loadAssignees(value);
    }, [loadAssignees]);

    return {options, loadAssignees, handleSearchChange};
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
            const filtered = filterSystem ? assignees.filter(principal => !shouldSkipPrincipal(principal)) : assignees;
            setSelectedOptions(filtered.map(buildAssigneeOption));
            return;
        }

        const keys = assigneeIds.map(id => PrincipalKey.fromString(id));
        new GetPrincipalsByKeysRequest(keys)
            .sendAndParse()
            .then((principals) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                const filtered = filterSystem
                                 ? principals.filter(principal => !shouldSkipPrincipal(principal))
                                 : principals;
                setSelectedOptions(filtered.map(buildAssigneeOption));
            })
            .catch((error) => {
                console.error(error);
                if (requestId === requestIdRef.current) {
                    setSelectedOptions([]);
                }
            });
    }, [assigneeIds, assignees, filterSystem]);

    return selectedOptions;
};
