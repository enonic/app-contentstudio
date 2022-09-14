const mustache = require('/lib/mustache');
const contentLib = require('/lib/xp/content');
const portalLib = require('/lib/xp/portal');
const projectLib = require('/lib/xp/project');
const contextLib = require('/lib/xp/context');
const encodingLib = require('/lib/text-encoding');
const adminLib = require('/lib/xp/admin');

const handleGet = (req) => {
    const showLast = req.params.showLast || 5;
    const lastModifiedItems = getLastModifiedContentInAllRepos(showLast);
    const filteredItems = filterSameItemsInOtherRepos(lastModifiedItems);
    const sortedByDateItems = sortItemsByDate(filteredItems);

    const params = {
        items: sortedByDateItems.slice(0, showLast),
        stylesUri: portalLib.assetUrl({
            path: 'styles/widgets/recent.css'
        }),
    };

    const view = resolve('./recent.html');

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };
}

const getLastModifiedContentInAllRepos = (showLast) => {
    const result = [];
    const projects = projectLib.list();
    const baseToolUri = adminLib.getToolUrl(app.name, 'main');

    projects.forEach((project) => {
        const projectItems = getLastModifiedItemsInRepo(`com.enonic.cms.${project.id}`, showLast);

        projectItems.forEach((item) => {
            result.push(createContentItem(item, project, baseToolUri));
        });
    });

    return result;
}

const getLastModifiedItemsInRepo = (repositoryId, count) => {
    return contextLib.run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        () => {
            return getLastModifiedItems(count);
        }
    );
}

const getLastModifiedItems = (count) => {
    return contentLib.query({
        start: 0,
        count: count,
        sort: 'modifiedTime DESC'
    }).hits;
}

const createContentItem = (item, project, baseToolUri) => {
    const displayName = item.displayName || '<unnamed>';
    const dateTime = parseDateTime(item.modifiedTime);
    const formattedDateTime = formatDateTime(dateTime);
    const editUrl = generateEditUrl(item, project.id, baseToolUri);
    const icon = getItemIcon(item);

    if (!project.description) {
        project.description = project.displayName;
    }

    return {
        item: item,
        displayName: displayName,
        dateTime: dateTime,
        formattedDateTime: formattedDateTime,
        project: project,
        icon: icon,
        editUrl: editUrl
    };
}

const parseDateTime = (value) => {
    if (!value) {
        return '';
    }

    return makeDateFromUTCString(value);
}

const formatDateTime = (date) => {
    if (!date) {
        return '';
    }

    return zeroPad(date.getFullYear(), 4) +
           '-' +
           zeroPad(date.getMonth() + 1, 2) +
           '-' +
           zeroPad(date.getDate(), 2) +
           ' ' +
           zeroPad(date.getHours(), 2) +
           ':' +
           zeroPad(date.getMinutes(), 2) +
           ':' +
           zeroPad(date.getSeconds(), 2);
}

// Copied from DateHelper.ts
const makeDateFromUTCString = (value) => {
    const parsedYear = Number(value.substring(0, 4));
    const parsedMonth = Number(value.substring(5, 7));
    const parsedDayOfMonth = Number(value.substring(8, 10));
    const parsedHours = Number(value.substring(11, 13));
    const parsedMinutes = Number(value.substring(14, 16));
    const parsedSeconds = Number(value.substring(17, 19));

    return new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDayOfMonth, parsedHours, parsedMinutes, parsedSeconds));
}

// Copied from DateTimeFormatter.ts
const zeroPad = (n, width) => {
    let nWidth = n.toString().length;
    if (nWidth >= width) {
        return '' + n;
    }
    let neededZeroes = width - nWidth;
    let s = '';
    for (let i = 0; i < neededZeroes; i++) {
        s += '0';
    }

    return s + n;
}

const getItemIcon = (item) => {
    const contentType = getContentTypeWithIcon(item);

    if (!contentType) {
        return null;
    }

    const iconBase64 = contentType.icon ? encodingLib.base64Encode(contentType.icon.data) : null;
    const iconMimeType = contentType.icon ? contentType.icon.mimeType : '';

    return {
        iconBase64: iconBase64,
        iconMimeType: iconMimeType
    }
}

const getContentTypeWithIcon = (item) => {
    let contentType = contentLib.getType(item.type);

    while (contentType) {
        if (contentType.icon) {
            return contentType;
        }

        contentType = contentType.superType ? contentLib.getType(contentType.superType) : null;
    }

    return contentType;
}

const generateEditUrl = (item, project, baseToolUri) => {
    return `${baseToolUri}/${project}/edit/${item._id}`;
}

const filterSameItemsInOtherRepos = (items) => {
    const result = [];

    items.forEach((item) => {
        if (item.project.parent) {
            const itemId = item._id;
            const parentProjectName = item.project.parent;
            const hasSameItemInParentLayer = items.some((i) => i._id === itemId && i.project.id === parentProjectName);

            if (!hasSameItemInParentLayer) {
                result.push(item);
            }
        } else {
            result.push(item);
        }
    });

    return result;
}

const sortItemsByDate = (items) => {
    return items.sort((item1, item2) => {
        return item2.dateTime - item1.dateTime;
    });
}

exports.get = handleGet;
