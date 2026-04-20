export interface ContentVersionActionJson {
    operation: string;
    fields: string[];
    editorial: string | null;
    editorialExists: boolean;
    user: string;
    userDisplayName: string;
    opTime: string;
}
