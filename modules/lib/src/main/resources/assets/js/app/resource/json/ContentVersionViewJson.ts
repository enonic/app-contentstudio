import {type ContentVersionJson} from './ContentVersionJson';

export interface ContentVersionViewJson
    extends ContentVersionJson {

    workspaces: string[];
}
