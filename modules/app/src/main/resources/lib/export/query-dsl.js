const paramsDSLHandlers = new Map();

const makeSearchDSLQuery = (params) => {
    if (hasAnySearchParamsSet(params)) {
        return makeMainSearchDSLExpr(params);
    }

    // return all content if no params are set
    return matchAllQuery();
}

const hasAnySearchParamsSet = (actualParams) => {
    let hasParamsSet = false;

    for (let name of paramsDSLHandlers.keys()) {
        if (actualParams[name]) {
            hasParamsSet = true;
            break;
        }
    }

    return hasParamsSet;
}

const makeMainSearchDSLExpr = (params) => {
    return {
        "boolean": {
            "must": makeSearchByParamsDSLExpr(params)
        }
    }
}

const makeSearchByParamsDSLExpr = (params) => {
    const selectedBucketsDSLQs = [];

    for (let paramName of paramsDSLHandlers.keys()) {
        if (params[paramName]) {
            const selectedBucketDSLQuery = makeBucketDSLQuery(paramName, params[paramName]);

            if (selectedBucketDSLQuery) {
                selectedBucketsDSLQs.push(selectedBucketDSLQuery);
            }
        }
    }

    return selectedBucketsDSLQs;
}

const makeBucketDSLQuery = (name, value) => {
    if (paramsDSLHandlers.has(name)) {
        return paramsDSLHandlers.get(name)(value);
    }

    return null;
}

const createSearchTextDSLQuery = (text) => {
    return {
        'boolean': {
            'should': [
                {
                    'boolean': {
                        'should': [
                            {
                                'fulltext': {
                                    'fields': [
                                        'displayName^5',
                                        '_name^3',
                                        '_allText'
                                    ],
                                    'query': text,
                                    'operator': 'AND'
                                }
                            },
                            {
                                'ngram': {
                                    'fields': [
                                        'displayName^5',
                                        '_name^3',
                                        '_allText'
                                    ],
                                    'query': text,
                                    'operator': 'AND'
                                }
                            }
                        ]
                    }
                },
                {
                    'term': {
                        'field': '_id',
                        'value': text
                    }
                }
            ]
        }
    };
}

const createLangDSLQuery = (lang) => {
    return {
        "boolean": {
            "must": {
                "in": {
                    "field": "language",
                    "values": lang.split(',')
                }
            }
        }
    }
}

const createWorkflowDSLQuery = (state) => {
    return {
        "boolean": {
            "must": {
                "in": {
                    "field": "workflow.state",
                    "values": state.toUpperCase().split(',')
                }
            }
        }
    }
}

const createOwnerDSLQuery = (owners) => {
    return {
        "boolean": {
            "must": {
                "in": {
                    "field": "owner",
                    "values": owners.split(',')
                }
            }
        }
    }
}

const createModifierDSLQuery = (modifiers) => {
    return {
        "boolean": {
            "must": {
                "in": {
                    "field": "modifier",
                    "values": modifiers.split(',')
                }
            }
        }
    }
}

const createLastModifiedDSLQuery = (lastModified) => {
    const values = lastModified.split(',');
    const ranges = values.map((value) => {
        return {
            "range": {
                "field": "modifiedTime",
                "type": "dateTime",
                "gt": value
            }
        }
    });

    return {
        "boolean": {
            "should": ranges
        }
    }
}

const createConstraintIdsDSLQuery = (constraintIds) => {
    return {
        "boolean": {
            "must": {
                "in": {
                    "field": "_id",
                    "values": constraintIds.split(',')
                }
            }
        }
    }
}

const createInboundDSLQuery = (inboundId) => {
    return {
        "boolean": {
            "must": [
                {
                    "term": {
                        "field": "_references",
                        "value": inboundId
                    }
                },
                {
                    "boolean": {
                        "mustNot": {
                            "term": {
                                "field": "_id",
                                "value": inboundId
                            }
                        }
                    }
                }
            ]
        }
    }
}

const createOutboundDSLQuery = (outboundIds) => {
    return {
        "boolean": {
            "must": {
                "in": {
                    "field": "_id",
                    "values": outboundIds
                }
            }
        }
    }
}

const matchAllQuery = () => {
    return {
        'matchAll': {}
    };
}

paramsDSLHandlers.set('searchText', createSearchTextDSLQuery);
paramsDSLHandlers.set('lang', createLangDSLQuery);
paramsDSLHandlers.set('lastModified', createLastModifiedDSLQuery);
paramsDSLHandlers.set('modifier', createModifierDSLQuery);
paramsDSLHandlers.set('owner', createOwnerDSLQuery);
paramsDSLHandlers.set('workflow', createWorkflowDSLQuery);
paramsDSLHandlers.set('constraintIds', createConstraintIdsDSLQuery);
paramsDSLHandlers.set('inbound', createInboundDSLQuery);
paramsDSLHandlers.set('outboundIds', createOutboundDSLQuery);

exports.makeSearchDSLQuery = makeSearchDSLQuery;
