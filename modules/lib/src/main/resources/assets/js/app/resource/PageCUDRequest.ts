import {type Content} from '../content/Content';

export interface PageCUDRequest {

    sendAndParse(): Q.Promise<Content>;
}
