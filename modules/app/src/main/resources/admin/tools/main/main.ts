import type {Request, Response} from '/types/';

// @ts-expect-error No types for /lib/mustache yet.
import {render} from '/lib/mustache';
// @ts-expect-error Cannot find module '/lib/router' or its corresponding type declarations.ts(2307)
import Router from '/lib/router';
import {getLauncherPath, getLocales, getToolUrl} from '/lib/xp/admin';
import {assetUrl, serviceUrl} from '/lib/xp/portal';
import {localize} from '/lib/xp/i18n';
import {IS_DEV_MODE} from '/lib/app-contentstudio/runMode';
import {
    immutableGetter,
    // getAdminUrl,
    getAdminNodeModuleUrl
} from '/lib/app-contentstudio/urlHelper';
import {VIRTUAL_GETTER_ROOT} from '/constants';


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

            dompurifyUrl: getAdminNodeModuleUrl('dompurify/purify.min.js', TOOL_NAME),

            signalsUrl: getAdminNodeModuleUrl(`signals/signals${IS_DEV_MODE ? '' : '.min'}.js`, TOOL_NAME),
            // signalsUrl: getAdminUrl({path: 'signals/signals.mjs'}, TOOL_NAME),

            hasherUrl: getAdminNodeModuleUrl('hasher/hasher.min.js', TOOL_NAME),
            // hasherUrl: getAdminUrl({path:`hasher/hasher${IS_DEV_MODE ? '' : '.min'}.mjs`}, TOOL_NAME),

            jqueryUrl: getAdminNodeModuleUrl('jquery/jquery.min.js', TOOL_NAME),
            jquerySimulateUrl: getAdminNodeModuleUrl('jquery-simulate/jquery.simulate.js', TOOL_NAME),
            jqueryUiUrl: getAdminNodeModuleUrl('jquery-ui-dist/jquery-ui.min.js', TOOL_NAME),
            lodashUrl: getAdminNodeModuleUrl('lodash/lodash.min.js', TOOL_NAME),
            mousetrapUrl: getAdminNodeModuleUrl('mousetrap/mousetrap.min.js', TOOL_NAME),
            mousetrapBindUrl: getAdminNodeModuleUrl('mousetrap/plugins/global-bind/mousetrap-global-bind.min.js', TOOL_NAME),
            qUrl: getAdminNodeModuleUrl('q/q.js', TOOL_NAME),
            legacySlickgridUrl: getAdminNodeModuleUrl('slickgrid/index.js', TOOL_NAME),

            launcherPath: getLauncherPath(),
            // importMap: JSON.stringify({
            //     imports: {
            //         dompurify: getAdminNodeModuleUrl('dompurify/purify.min.js', TOOL_NAME),
            //         // hasher: getAdminNodeModuleUrl(`hasher/hasher${IS_DEV_MODE ? '' : '.min'}.js`, TOOL_NAME),
            //         hasher: getAdminUrl({path:`hasher/hasher${IS_DEV_MODE ? '' : '.min'}.mjs`}, TOOL_NAME),
            //         jquery: getAdminNodeModuleUrl(`jquery/jquery${IS_DEV_MODE ? '' : '.min'}.js`, TOOL_NAME),
            //         'jquery-simulate': getAdminNodeModuleUrl('jquery-simulate/jquery.simulate.js', TOOL_NAME),
            //         'jquery-ui': getAdminNodeModuleUrl(`jquery-ui-dist/jquery-ui${IS_DEV_MODE ? '' : '.min'}.js`, TOOL_NAME),
            //         lodash: getAdminNodeModuleUrl(`lodash/lodash${IS_DEV_MODE ? '' : '.min'}.js`, TOOL_NAME),
            //         mousetrap: getAdminNodeModuleUrl('mousetrap/mousetrap.min.js', TOOL_NAME),
            //         'mousetrap/plugins/global-bind': getAdminNodeModuleUrl('mousetrap/plugins/global-bind/mousetrap-global-bind.min.js', TOOL_NAME),
            //         q: getAdminNodeModuleUrl('q/q.js', TOOL_NAME),
            //         signals: getAdminUrl({path: 'signals/signals.mjs'}, TOOL_NAME),
            //         // signals: getAdminNodeModuleUrl(`signals/signals${IS_DEV_MODE ? '' : '.min'}.js`, TOOL_NAME),
            //         '@enonic/legacy-slickgrid': getAdminNodeModuleUrl('slickgrid/index.js', TOOL_NAME),
            //     }
            // }),
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
