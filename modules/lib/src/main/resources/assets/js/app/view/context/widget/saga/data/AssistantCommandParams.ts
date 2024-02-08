
export interface AssistantCommandParams {
    command: string; // user input or predefined command to the assistant
    context?: {
        topic?: string; // aka display name for a content
        type?: string; // article, blog post, shopping cart item, or content type display name
        language?: string;
    }
    source: { // can be a field of a content or something else
        label: string; // label of the input type
        type: string; // text, html, etc
        data: { // actual data of the field, can be entire content or just a selection
            content: string; // whole content of the field
            selection?: string; // if only part of the content is selected
        }
    };
}
