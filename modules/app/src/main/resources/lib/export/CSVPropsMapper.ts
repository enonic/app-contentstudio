import {date, default as processNonDateValue} from '/lib/export/value-formatters';
const propsMap = new Map<string,[string,(value: string) => string]>();

// key is a property name in a content data
// value is an array of two elements: Header title and a value formatter
propsMap.set('_id', ['Id', processNonDateValue]);
propsMap.set('_path', ['Path', processNonDateValue]);
propsMap.set('creator', ['Creator', processNonDateValue]);
propsMap.set('modifier', ['Modifier', processNonDateValue]);
propsMap.set('createdTime', ['Created', date]);
propsMap.set('modifiedTime', ['Modified', date]);
propsMap.set('owner', ['Owner', processNonDateValue]);
propsMap.set('type', ['Content Type', processNonDateValue]);
propsMap.set('displayName', ['Display Name', processNonDateValue]);
propsMap.set('language', ['Language', processNonDateValue]);
propsMap.set('publish.from', ['Published From', date]);
propsMap.set('publish.to', ['Published Until', date]);
propsMap.set('publish.first', ['First Published', date]);

export const getHeaders = () => {
    const headers = [];

    for (let value of propsMap.values()) {
        headers.push(value[0]);
    }

    return headers;
}

export const generateRecord = (contentItem) => {
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

const extractValue = (item, propName: string) => {
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
