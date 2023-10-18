import type {Request, Response} from '/types/';

import {generateExport} from '/lib/export/export';

export function get(req: Request): Response {
    const type = req.params.type;
    const report = generateExport(req.params);

    return {
        contentType: `text/${type}`,
        status: report ? 200 : 404,
        body: report ? report : 'Not found'
    };
}
