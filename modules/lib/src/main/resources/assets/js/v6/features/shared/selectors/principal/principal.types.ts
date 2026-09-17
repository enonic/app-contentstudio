import type { Principal } from '@enonic/lib-admin-ui/security/Principal';

export type PrincipalOption = {
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
    // Carried so a caller's renderOption can render the principal itself, not just its flattened fields.
    principal?: Principal;
};
