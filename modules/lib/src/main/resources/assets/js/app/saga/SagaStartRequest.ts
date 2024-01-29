import {SagaPostRequest} from './SagaPostRequest';

export interface SagaStartRequestResult {
    chatId: string;
    operation: string;
}

export class SagaStartRequest extends SagaPostRequest<SagaStartRequestResult> {

}
