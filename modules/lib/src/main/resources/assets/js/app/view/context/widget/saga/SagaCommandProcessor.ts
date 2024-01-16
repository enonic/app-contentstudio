
export class SagaCommandProcessor {

    public static convertToAssistantMessage(command, html: string): string {
        return `${command} : \`\`\`${html}\`\`\``;
    }
}
