import {
    getResource,
    readText
} from '/lib/xp/io';


export function readResource(filename: string) {
    const resource = getResource(filename);
    if (!resource || !resource.exists()) {
        throw new Error(`Empty or not found: ${filename}`);
    }
    let content: string;
    try {
        content = readText(resource.getStream());
        // log.debug('readResource: filename:%s content:%s', filename, content);
    } catch (e) {
        log.error(e.message);
        throw new Error(`Couldn't read resource: ${filename}`);
    }
    return content;
}

function jsonParseResource(filename: string) {
    const content = readResource(filename);
    let obj: object;
    try {
        obj = JSON.parse(content);
        log.debug('jsonParseResource obj:%s', JSON.stringify(obj, null, 4));
    } catch (e) {
        log.error(e.message);
        log.info("Content dump from '" + filename + "':\n" + content);
        throw new Error(`couldn't parse as JSON content of resource: ${filename}`);
    }
    return obj;
}


export default jsonParseResource;
