import Content = api.content.Content;

/**
 * Request representing either a create, update or delete Request for a Page.
 */
export interface PageCUDRequest {

    sendAndParse(): wemQ.Promise<Content>;
}
