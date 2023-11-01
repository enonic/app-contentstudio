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
    VIRTUAL_GETTER_ROOT,
} from '/constants';


const VIEW = resolve('./main.html');
const TOOL_NAME = 'main';

const router = Router();

// Do not export this function it will break the static assets routing below.
function get(req: Request): Response {
    const response: Response = {
        contentType: 'text/html',
        body: render(VIEW, {
            assetsUri: assetUrl({path: ''}),
            appName: localize({
                key: 'admin.tool.displayName',
                bundles: ['i18n/phrases'],
                locale: getLocales()
            }),
            configServiceUrl: serviceUrl({service: 'config'}),
            isBrowseMode: req.path === getToolUrl(app.name, 'main'),
            dompurifyUrl: getAdminUrl({ path: 'dompurify/purify.min.js' }, TOOL_NAME),
            signalsUrl: getAdminUrl({ path: 'signals/signals.min.js' }, TOOL_NAME),
            hasherUrl: getAdminUrl({ path: 'hasher/hasher.min.js' }, TOOL_NAME),
            jqueryUrl: getAdminUrl({ path: 'jquery/jquery.min.js' }, TOOL_NAME),
            jquerySimulateUrl: getAdminUrl({ path: 'jquery-simulate/jquery.simulate.js' }, TOOL_NAME),
            jqueryUiUrl: getAdminUrl({ path: 'jquery-ui-dist/jquery-ui.min.js' }, TOOL_NAME),
            lodashUrl: getAdminUrl({ path: 'lodash/lodash.min.js' }, TOOL_NAME),
            mousetrapUrl: getAdminUrl({ path: 'mousetrap/mousetrap.min.js' }, TOOL_NAME),
            mousetrapBindUrl: getAdminUrl({ path: 'mousetrap/plugins/global-bind/mousetrap-global-bind.min.js' }, TOOL_NAME),
            qUrl: getAdminUrl({ path: 'q/q.js' }, TOOL_NAME),
            legacySlickgridUrl: getAdminUrl({ path: 'slickgrid/index.js' }, TOOL_NAME),
            launcherPath: getLauncherPath(),
        })
    };

    if (app.config['contentSecurityPolicy.enabled'] !== 'false') {
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


router.all(`/${VIRTUAL_GETTER_ROOT}/{path:.+}`, (r: Request) => immutableGetter(r));

router.get('.*', (r: Request) => get(r));

export const all = (r: Request) => router.dispatch(r);
