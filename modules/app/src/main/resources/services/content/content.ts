import type {Request, Response} from '/types/';

import {get as _getContent} from '/lib/xp/content';
import {run} from '/lib/xp/context';

export function get(req: Request): Response {
    var contentId = req.params.contentId;

    if (!contentId) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: contentId'
        };
    }

    return {
        status: 200,
        contentType: 'application/json',
        body: getContent(contentId, req.params.versionId, req.params.repositoryId) as unknown as Record<string, unknown>
    };
};


function getContent(contentId: string, versionId: string, repositoryId: string) {
    if (!repositoryId) {
        return _getContent({
            key: contentId,
            versionId
        });
    }

    return run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        function() {
            return _getContent({
                key: contentId,
                versionId
            });
        }
    );
}

