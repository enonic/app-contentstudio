import {Content} from '../content/Content';

export interface PageCUDRequest {

    sendAndParse(): wemQ.Promise<Content>;
}
