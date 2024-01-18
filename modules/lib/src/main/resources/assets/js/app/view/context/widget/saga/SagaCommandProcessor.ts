
export class SagaCommandProcessor {

    public static convertToAssistantMessage(command, html: string): string {
        return `${command} : \`\`\`${html}\`\`\``;
    }

    public static extractTextFromAssistantMessage(message: string): string {
        return message.substring(message.indexOf('"""') + 1, message.lastIndexOf('"""'));
    }
}
