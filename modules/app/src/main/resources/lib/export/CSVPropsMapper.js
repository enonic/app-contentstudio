const valueFormatters = require('./value-formatters');
const propsMap = new Map();

// key is a property name in a content data
// value is an array of two elements: Header title and a value formatter
propsMap.set('_id', ['Id', valueFormatters.default]);
propsMap.set('_path', ['Path', valueFormatters.default]);
propsMap.set('creator', ['Creator', valueFormatters.default]);
propsMap.set('modifier', ['Modifier', valueFormatters.default]);
propsMap.set('createdTime', ['Created', valueFormatters.date]);
propsMap.set('modifiedTime', ['Modified', valueFormatters.date]);
propsMap.set('owner', ['Owner', valueFormatters.default]);
propsMap.set('type', ['Content Type', valueFormatters.default]);
propsMap.set('displayName', ['Display Name', valueFormatters.default]);
propsMap.set('language', ['Language', valueFormatters.default]);
propsMap.set('publish.from', ['Published From', valueFormatters.date]);
propsMap.set('publish.to', ['Published Until', valueFormatters.date]);
propsMap.set('publish.first', ['First Published', valueFormatters.date]);

const getHeaders = () => {
    const headers = [];

    for (let value of propsMap.values()) {
        headers.push(value[0]);
    }

    return headers;
}

const generateRecord = (contentItem) => {
    const contentPropsValuesAsArray = [];

    for (let entry of propsMap) {
        const propName = entry[0];
        const valueProcessor = entry[1][1];
        const extractedValue = extractValue(contentItem, propName);
        const processedValue = valueProcessor(extractedValue);
        contentPropsValuesAsArray.push(processedValue);
    }

    return contentPropsValuesAsArray.join();
}

const extractValue = (item, propName) => {
    // extracting nested property value
    if (propName.indexOf('.') > 0) {
        const parts = propName.split('.');
        let value = item;

        for (let i = 0; i < parts.length; i++) {
            value = value[parts[i]];

            if (!value) {
                return '';
            }
        }

        return value;
    }

    return item[propName]
}

exports.getHeaders = getHeaders;
exports.generateRecord = generateRecord;
