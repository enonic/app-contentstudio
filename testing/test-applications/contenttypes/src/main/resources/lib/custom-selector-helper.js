exports.parseparams = function (params) {

    var query = params['query'],
        ids, start, count;

    try {
        ids = JSON.parse(params['ids']) || []
    } catch (e) {
        log.warning('Invalid parameter ids: %s, using []', params['ids']);
        ids = [];
    }

    try {
        start = Math.max(parseInt(params['start']) || 0, 0);
    } catch (e) {
        log.warning('Invalid parameter start: %s, using 0', params['start']);
        start = 0;
    }

    try {
        count = Math.max(parseInt(params['count']) || 15, 0);
    } catch (e) {
        log.warning('Invalid parameter count: %s, using 15', params['count']);
        count = 15;
    }

    return {
        query: query,
        ids: ids,
        start: start,
        end: start + count,
        count: count
    }
};


/**
 * Create results filtered by params
 * @param items
 * @param params = {
            query: string,
            ids: [...],
            start: number,
            end: number,
            count: number
        }
 * @param total
 * @returns body = {
            total: number,
            count: number,
            hits: [...]
        }
 */
exports.createresults = function (items, params, total) {

    var body = {};

    log.info('Creating results with params: %s', params);

    var hitCount = 0, include;
    body.hits = items.sort(function (hit1, hit2) {
        if (!hit1 || !hit2) {
            return !!hit1 ? 1 : -1;
        }
        return hit1.displayName.localeCompare(hit2.displayName);
    }).filter(function (hit) {
        include = true;

        if (!!params.ids && params.ids.length > 0) {
            include = params.ids.some(function (id) {
                return id == hit.id;
            });
        } else if (!!params.query && params.query.trim().length > 0) {
            var qRegex = new RegExp(params.query, 'i');
            include = qRegex.test(hit.displayName) || qRegex.test(hit.description) || qRegex.test(hit.id);
        }

        if (include) {
            hitCount++;
        }
        return include && hitCount > params.start && hitCount <= params.end;
    });
    body.count = Math.min(params.count, body.hits.length);
    body.total = params.query ? hitCount : (total || items.length);

    return body;
};