import type {Request, Response} from '/types/';

// @ts-expect-error No types for /lib/mustache yet.
import {render} from '/lib/mustache';
// @ts-expect-error Cannot find module '/lib/router' or its corresponding type declarations.ts(2307)
import Router from '/lib/router';
import {getLauncherPath, getLocales, getToolUrl} from '/lib/xp/admin';
import {assetUrl, serviceUrl} from '/lib/xp/portal';
import {localize} from '/lib/xp/i18n';
import {immutableGetter, getAdminUrl} from '/lib/app-contentstudio/urlHelper';
import {
	FILEPATH_MANIFEST_NODE_MODULES,
	GETTER_ROOT,
} from '/constants';


interface Params {
    appName: string
    assetsUri: string
    configServiceUrl: string
    isBrowseMode?: boolean
    launcherPath: string
    jqueryUrl: string
}


const VIEW = resolve('./main.html');
const TOOL_NAME = 'main';

const router = Router();

export function renderTemplate(path: string, params: Params) {
    const toolUri = getToolUrl(app.name, 'main');
    const isBrowseMode = path === toolUri;
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    params.isBrowseMode = isBrowseMode;

    const response: Response = {
        contentType: 'text/html',
        body: render(VIEW, params),
    };

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];

        if (!securityPolicy) {
            securityPolicy = 'default-src \'self\'; connect-src \'self\' ws: wss:; script-src \'self\' \'unsafe-eval\' \'unsafe-inline\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:';
        }
        response.headers = {
            'content-security-policy': securityPolicy
        };
    }

    return response;
}

export const getParams = (): Params => ({
    assetsUri: assetUrl({path: ''}),
    appName: localize({
        key: 'admin.tool.displayName',
        bundles: ['i18n/phrases'],
        locale: getLocales()
    }),
    configServiceUrl: serviceUrl({service: 'config'}),
    jqueryUrl: getAdminUrl({
        manifestPath: FILEPATH_MANIFEST_NODE_MODULES,
        path: 'jquery/jquery.min.js',
    }, TOOL_NAME),
    launcherPath: getLauncherPath(),
});

// DO not export this function it will break the static assets routing below.
function get(req: Request): Response {
    return renderTemplate(req.path, getParams());
}

router.get('/?', (r: Request) => get(r));

router.all(`/${GETTER_ROOT}/{path:.+}`, (r: Request) => {
    // log.info('static request:%s', JSON.stringify(r, null, 4));
    return immutableGetter(r);
});

export const all = (r: Request) => router.dispatch(r);
