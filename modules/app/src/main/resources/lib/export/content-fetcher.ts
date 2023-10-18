import {getOutboundDependencies, query} from '/lib/xp/content';
import {makeSearchDSLQuery} from '/lib/export/query-dsl';
import {run} from '/lib/xp/context';

export const fetch = (params) => {
    const repo = `com.enonic.cms.${params.project}`;

    return run(
        {
            repository: repo,
            branch: 'draft'
        },
        () => {
            return query(makeContentSearchDSLQuery(params));
        }
    );
}

const makeContentSearchDSLQuery = (params) => {
    const dslQuery = {
        start: 0,
        count: -1
    }

    if (params.outbound) {
        fetchOutboundIdsAndAttachToParams(params);
    }

    // content types are being set as a separate object in the DSL query
    dslQuery.contentTypes = makeContentTypes(params);
    // other params are being added into the DSL query object
    dslQuery.query = makeSearchDSLQuery(params);

    return dslQuery;
}

const fetchOutboundIdsAndAttachToParams = (params) => {
    if (params.outbound) {
        const outboundItems = getOutboundDependencies({
            key: params.outbound
        });

        if (outboundItems && outboundItems.length > 0) {
            params.outboundIds = outboundItems;
        }
    }
}

const makeContentTypes = (params) => {
    if (params.contentTypes) {
        return params.contentTypes.split(',');
    }

    return null;
}
