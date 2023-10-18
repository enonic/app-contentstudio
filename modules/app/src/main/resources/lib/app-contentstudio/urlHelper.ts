import type {Request, Response} from '/types/';

// @ts-expect-error TS2307: Cannot find module '/lib/enonic/static' or its corresponding type declarations.
import {buildGetter} from '/lib/enonic/static';
import {getToolUrl} from '/lib/xp/admin';
import {
    // FILEPATH_MANIFEST_CJS,
    FILEPATH_MANIFEST_NODE_MODULES,
    GETTER_ROOT
} from '/constants';
import ioResource from './ioResource';
import {IS_DEV_MODE} from './runMode';


interface UrlPostfixParams {
	manifestPath?: string
	path: string,
}

type UrlParams = UrlPostfixParams & {urlPrefix: string};


const manifests = {
	// [FILEPATH_MANIFEST_CJS]: ioResource(FILEPATH_MANIFEST_CJS),
	// [FILEPATH_MANIFEST_ESM]: ioResource(FILEPATH_MANIFEST_ESM),
	[FILEPATH_MANIFEST_NODE_MODULES]: ioResource(FILEPATH_MANIFEST_NODE_MODULES),
};

const getImmutableUrl = ({
	manifestPath = FILEPATH_MANIFEST_NODE_MODULES,
	path,
	urlPrefix
}: UrlParams) => {
	if (IS_DEV_MODE) {
		manifests[manifestPath] = ioResource(manifestPath);
	}

	return `${urlPrefix}/${GETTER_ROOT}/${manifests[manifestPath][path]}`;
};

export const getAdminUrl = ({
	manifestPath = FILEPATH_MANIFEST_NODE_MODULES,
	path,
}: UrlPostfixParams, tool: string) => {
    // log.info('getAdminUrl manifestPath:%s path:%s', manifestPath, path);
	const urlPrefix = getToolUrl(app.name, tool);

	return getImmutableUrl({
		manifestPath,
		path,
		urlPrefix
	});
};

export const immutableGetter = buildGetter({
	etag: false, // default is true in production and false in development
	getCleanPath: (request: Request) => {
		log.debug('request:%s', JSON.stringify(request, null, 4));
		log.debug('contextPath:%s', request.contextPath);
		log.debug('rawPath:%s', request.rawPath);

		const prefix = request.contextPath;
		let cleanPath = prefix ? request.rawPath.substring(prefix.length) : request.rawPath;
		cleanPath = cleanPath.replace(`${GETTER_ROOT}/`, '');

		log.debug('cleanPath:%s', cleanPath);

		return cleanPath;
	},
	root: GETTER_ROOT
}) as (_request: Request) => Response;
