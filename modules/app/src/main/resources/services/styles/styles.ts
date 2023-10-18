import type {Request, Response} from '/types/';

import {assetUrl} from '/lib/xp/portal';

export function get(req: Request): Response {
    const contentId = req.params.contentId;
    const project = req.params.project || 'default';
    if (!contentId) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: contentId'
        };
    }

    const styles = getStyles(contentId, project);
    const cssUrls = [];
    for (let i = 0; i < styles.css.length; i++) {
        if (styles.css[i]) {
            cssUrls.push(assetUrl({
                path: styles.css[i],
                application: styles.app[i]
            }));
        }
    }
    styles.css = cssUrls;
    delete styles.app;

    return {
        status: 200,
        contentType: 'application/json',
        body: styles
    };
}

function getStyles(contentId: string, project: string) {
    const bean = __.newBean<{
        contentId: string,
        project: string,
        getStyles: () => {
            app: string[]
            css: string[]
        }
    }>('com.enonic.xp.app.contentstudio.style.StyleHandler');
    bean.contentId = __.nullOrValue(contentId);
    bean.project = __.nullOrValue(project);
    return __.toNativeObject(bean.getStyles());
}
