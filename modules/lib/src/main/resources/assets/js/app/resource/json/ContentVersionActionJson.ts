export interface ContentVersionActionJson {
    operation: string;
    fields: string[];
    origin: string | null;
    editorial: string | null;
    user: string;
    userDisplayName: string;
    opTime: string;
}
