import {ContentSummary} from '../content/ContentSummary';

export interface IContentEdit {

    /*
     * Add a content edit listener
     */
    onEditContentRequest(listener: (content: ContentSummary) => void);

    /*
     * Remove a content edit listener
     */
    unEditContentRequest(listener: (content: ContentSummary) => void);

    /*
     * Invoke all content edit event listeners
     */
    notifyEditContentRequested(content: ContentSummary);

}
