import {SagaResponse} from '../../../../saga/SagaResponse';

export class SagaCommandProcessor {

    public static convertToAssistantMessage(command, html: string): string {
        return `${command} : """${html}"""`;
    }

    public static extractResponse(message: string): SagaResponse {
        return JSON.parse(message);
    }
}
