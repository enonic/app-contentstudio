import {Content} from '../content/Content';

export interface PageCUDRequest {

    sendAndParse(): Q.Promise<Content>;
}
