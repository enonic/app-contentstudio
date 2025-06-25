import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {FindPrincipalsRequest} from '@enonic/lib-admin-ui/security/FindPrincipalsRequest';
import type {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {UrlHelper} from '../../../../../../app/util/UrlHelper';
import type {ContentId} from '../../../../../../app/content/ContentId';
import {GetContentRootPermissionsRequest} from '../../../../../../app/resource/GetContentRootPermissionsRequest';
import {GetEffectivePermissionsRequest} from '../../../../../../app/resource/GetEffectivePermissionsRequest';
import {Access} from '../../../../../../app/security/Access';
import {Permission} from '../../../../../../app/access/Permission';
import type {EffectivePermission} from '../../../../../../app/security/EffectivePermission';
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

type UseAssigneeSearchParams = {
    publishableContentIds?: ContentId[];
    useRootFallback?: boolean;
};

const buildPublishableSet = (permissions: EffectivePermission[]): Set<string> => {
    const allowed = new Set<string>();
    permissions.forEach(permission => {
        const access = permission.getAccess();
        if (access !== Access.PUBLISH && access !== Access.FULL) {
            return;
        }
        permission.getMembers().forEach(member => {
            allowed.add(member.getUserKey().toString());
        });
    });
    return allowed;
};

const intersectSets = (sets: Set<string>[]): Set<string> => {
    if (sets.length === 0) {
        return new Set<string>();
    }

    const [first, ...rest] = sets;
    const result = new Set<string>();
    first.forEach(id => {
        if (rest.every(set => set.has(id))) {
            result.add(id);
        }
    });
    return result;
};

const isUserKey = (key: string): boolean => key.startsWith('user:');

const isGroupOrRoleKey = (key: string): boolean => key.startsWith('group:') || key.startsWith('role:');

const shouldSkipPrincipalKey = (key: string): boolean => {
    return key === PrincipalKey.ofAnonymous().toString() || key === PrincipalKey.ofSU().toString();
};

const resolveMembersFromResponse = (value: unknown): string[] => {
    if (value == null || typeof value !== 'object') {
        return [];
    }
    const membersValue = Reflect.get(value, 'members');
    if (!Array.isArray(membersValue)) {
        return [];
    }
    return membersValue.filter((member): member is string => typeof member === 'string');
};

export const useAssigneeSearch = ({
                                      publishableContentIds,
                                      useRootFallback = false,
                                  }: UseAssigneeSearchParams = {}): UseAssigneeSearchResult => {
    const [options, setOptions] = useState<AssigneeSelectorOption[]>([]);
    const [allowedAssigneeIds, setAllowedAssigneeIds] = useState<Set<string> | null>(null);
    const requestIdRef = useRef(0);
    const permissionsRequestIdRef = useRef(0);
    const membersCacheRef = useRef(new Map<string, string[]>());

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

    const uniqueContentIds = useMemo(() => {
        if (!publishableContentIds || publishableContentIds.length === 0) {
            return [];
        }

        const map = new Map<string, ContentId>();
        publishableContentIds.forEach(id => map.set(id.toString(), id));
        return Array.from(map.values());
    }, [publishableContentIds]);

    const resolvePrincipalMembers = useCallback(async (key: string): Promise<string[]> => {
        const cached = membersCacheRef.current.get(key);
        if (cached) {
            return cached;
        }

        const url = UrlHelper.getCmsRestUri(`security/principals/${encodeURIComponent(key)}`);
        const response = await fetch(url, {credentials: 'same-origin'});
        if (!response.ok) {
            throw new Error(`Failed to load principal members for ${key}`);
        }
        const data: unknown = await response.json();
        const members = resolveMembersFromResponse(data);
        membersCacheRef.current.set(key, members);
        return members;
    }, []);

    const resolveUserKeys = useCallback(async (keys: string[]): Promise<Set<string>> => {
        const resolved = new Set<string>();
        const queue = [...keys];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const key = queue.shift();
            if (!key || visited.has(key)) {
                continue;
            }
            visited.add(key);

            if (isUserKey(key)) {
                resolved.add(key);
                continue;
            }

            if (!isGroupOrRoleKey(key)) {
                continue;
            }

            const members = await resolvePrincipalMembers(key);
            members.forEach(memberKey => {
                if (!visited.has(memberKey)) {
                    queue.push(memberKey);
                }
            });
        }

        return resolved;
    }, [resolvePrincipalMembers]);

    const shouldFilterByPermissions = uniqueContentIds.length > 0 || useRootFallback;

    useEffect(() => {
        if (uniqueContentIds.length === 0) {
            return;
        }

        const requestId = ++permissionsRequestIdRef.current;
        setAllowedAssigneeIds(null);

        Promise.all(uniqueContentIds.map(id => new GetEffectivePermissionsRequest(id).sendAndParse()))
            .then((results) => {
                if (requestId !== permissionsRequestIdRef.current) {
                    return;
                }
                const allowed = intersectSets(results.map(result => buildPublishableSet(result ?? [])));
                setAllowedAssigneeIds(allowed);
            })
            .catch((error) => {
                console.error(error);
                if (requestId === permissionsRequestIdRef.current) {
                    setAllowedAssigneeIds(null);
                }
            });
    }, [uniqueContentIds]);

    useEffect(() => {
        if (!useRootFallback || uniqueContentIds.length > 0) {
            return;
        }

        const requestId = ++permissionsRequestIdRef.current;
        setAllowedAssigneeIds(null);

        new GetContentRootPermissionsRequest()
            .sendAndParse()
            .then(async (acl) => {
                if (requestId !== permissionsRequestIdRef.current) {
                    return;
                }

                const allowedKeys = acl.getEntries()
                    .filter(entry => entry.isAllowed(Permission.PUBLISH))
                    .map(entry => entry.getPrincipalKey().toString())
                    .filter(key => !shouldSkipPrincipalKey(key));

                const allowedUsers = await resolveUserKeys(allowedKeys);
                if (requestId !== permissionsRequestIdRef.current) {
                    return;
                }
                setAllowedAssigneeIds(allowedUsers);
            })
            .catch((error) => {
                console.error(error);
                if (requestId === permissionsRequestIdRef.current) {
                    setAllowedAssigneeIds(null);
                }
            });
    }, [useRootFallback, uniqueContentIds.length, resolveUserKeys]);

    const filteredOptions = useMemo(() => {
        if (!shouldFilterByPermissions) {
            return options;
        }
        if (!allowedAssigneeIds) {
            return [];
        }
        return options.filter(option => allowedAssigneeIds.has(option.id));
    }, [options, allowedAssigneeIds, shouldFilterByPermissions]);

    useEffect(() => {
        void loadAssignees('');
    }, [loadAssignees]);

    const handleSearchChange = useCallback((value: string): void => {
        void loadAssignees(value);
    }, [loadAssignees]);

    return {options: filteredOptions, loadAssignees, handleSearchChange};
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
