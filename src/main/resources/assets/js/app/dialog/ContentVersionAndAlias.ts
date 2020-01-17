import {ContentVersion} from '../ContentVersion';

export enum AliasType {
    NEWEST, PUBLISHED, NEXT, PREV
}

export interface ContentVersionAndAlias {
    contentVersion: ContentVersion;
    alias?: string;
    type?: AliasType;
}
