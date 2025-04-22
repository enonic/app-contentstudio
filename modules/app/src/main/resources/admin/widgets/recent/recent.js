const mustache = require('/lib/mustache');
const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');
const encodingLib = require('/lib/text-encoding');
const adminLib = require('/lib/xp/admin');
const authLib = require('/lib/xp/auth');
const helper = require('/helpers/dashboard-helper');
const assetLib = require('/lib/enonic/asset');

const baseToolUri = adminLib.getToolUrl(app.name, 'main');
const currentUser = authLib.getUser();

const handleGet = (req) => {
    const showLast = req.params.showLast || 10;
    const lastModifiedItems = getLastModifiedContentInAllRepos(showLast);
    const filteredItems = filterSameItemsInOtherRepos(lastModifiedItems);
    const sortedByDateItems = sortItemsByDate(filteredItems);

    const params = {
        items: sortedByDateItems.slice(0, showLast),
        stylesUri: assetLib.assetUrl({
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
    const projects = helper.getProjects();

    projects.forEach((project) => {
        const projectItems = getLastModifiedItemsInRepo(`com.enonic.cms.${project.id}`, showLast);

        projectItems.forEach((item) => {
            result.push(createContentItem(item, project));
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
        sort: 'modifiedTime DESC',
        query: `modifier = "${currentUser.key}"`
    }).hits;
}

const createContentItem = (item, project) => {
    const displayName = item.displayName || '<unnamed>';
    const dateTime = helper.parseDateTime(item.modifiedTime);
    const formattedDateTime = helper.formatDateTime(dateTime);
    const editUrl = generateEditUrl(item, project.id);
    const projectUrl = generateProjectUrl(project.id);
    const icon = getItemIcon(item);

    if (!project.description) {
        project.description = project.displayName;
    }

    return {
        item,
        displayName,
        dateTime,
        formattedDateTime,
        project,
        icon,
        editUrl,
        projectUrl
    };
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

const generateEditUrl = (item, project) => {
    return `${baseToolUri}/${project}/edit/${item._id}`;
}

const generateProjectUrl = (project) => {
    return `${baseToolUri}#/${project}/browse`;
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
