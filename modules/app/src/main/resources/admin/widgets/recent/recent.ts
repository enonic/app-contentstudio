import type {Content} from '/lib/xp/content';
import type {Project} from '/lib/xp/project';
import type {Request, Response} from '/types/';

// @ts-expect-error No types for /lib/mustache yet.
import {render} from '/lib/mustache';
// @ts-expect-error No types for /lib/mustache yet.
import {base64Encode} from '/lib/text-encoding';

import {getToolUrl} from '/lib/xp/admin';
import {getUser} from '/lib/xp/auth';
import {getType, query} from '/lib/xp/content';
import {run} from '/lib/xp/context';
import {assetUrl} from '/lib/xp/portal';
import {formatDateTime, getProjects, parseDateTime} from '/helpers/dashboard-helper';


interface ContentItem {
    content: Content
    displayName: string
    dateTime: Date
    formattedDateTime: string
    project: Project
    icon: {
        iconBase64: string
        iconMimeType: string
    }
    editUrl: string
    projectUrl: string
}


const baseToolUri = getToolUrl(app.name, 'main');
const currentUser = getUser();
const VIEW = resolve('./recent.html');


export const get = (req: Request): Response => {
    const showLast = req.params.showLast && parseInt(req.params.showLast) || 10;
    const lastModifiedItems = getLastModifiedContentInAllRepos(showLast);
    const filteredItems = filterSameItemsInOtherRepos(lastModifiedItems);
    const sortedByDateItems = sortItemsByDate(filteredItems);

    const params = {
        items: sortedByDateItems.slice(0, showLast),
        stylesUri: assetUrl({
            path: 'styles/widgets/recent.css'
        }),
    };

    return {
        contentType: 'text/html',
        body: render(VIEW, params),
    };
}

const getLastModifiedContentInAllRepos = (showLast: number) => {
    const result: ContentItem[] = [];
    const projects = getProjects();

    projects.forEach((project) => {
        const projectItems = getLastModifiedItemsInRepo(`com.enonic.cms.${project.id}`, showLast);

        projectItems.forEach((item) => {
            result.push(createContentItem(item, project));
        });
    });

    return result;
}

const getLastModifiedItemsInRepo = (repositoryId: string, count: number) => {
    return run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        () => {
            return getLastModifiedItems(count);
        }
    );
}

const getLastModifiedItems = (count: number) => {
    return query({
        start: 0,
        count: count,
        sort: 'modifiedTime DESC',
        query: `modifier = "${currentUser.key}"`
    }).hits;
}

const createContentItem = (content: Content, project: Project): ContentItem => {
    const displayName = content.displayName || '<unnamed>';
    const dateTime = parseDateTime(content.modifiedTime || content.createdTime) as Date;
    const formattedDateTime = formatDateTime(dateTime);
    const editUrl = generateEditUrl(content, project.id);
    const projectUrl = generateProjectUrl(project.id);
    const icon = getItemIcon(content);

    if (!project.description) {
        project.description = project.displayName;
    }

    return {
        content,
        displayName,
        dateTime,
        formattedDateTime,
        project,
        icon,
        editUrl,
        projectUrl
    };
}

const getItemIcon = (item: Content) => {
    const contentType = getContentTypeWithIcon(item);

    if (!contentType) {
        return null;
    }

    const iconBase64 = contentType.icon ? base64Encode(contentType.icon.data) : null;
    const iconMimeType = contentType.icon ? contentType.icon.mimeType : '';

    return {
        iconBase64: iconBase64,
        iconMimeType: iconMimeType
    }
}

const getContentTypeWithIcon = (item: Content) => {
    let contentType = getType(item.type);

    while (contentType) {
        if (contentType.icon) {
            return contentType;
        }

        contentType = contentType.superType ? getType(contentType.superType) : null;
    }

    return contentType;
}

const generateEditUrl = (item: Content, projectId: Project['id']) => {
    return `${baseToolUri}/${projectId}/edit/${item._id}`;
}

const generateProjectUrl = (projectId: Project['id']) => {
    return `${baseToolUri}#/${projectId}/browse`;
}

const filterSameItemsInOtherRepos = (items: ContentItem[]) => {
    const result = [];

    items.forEach((item) => {
        if (item.project.parent) {
            const itemId = item.content._id;
            const parentProjectName = item.project.parent;
            const hasSameItemInParentLayer = items.some((i) => i.content._id === itemId && i.project.id === parentProjectName);

            if (!hasSameItemInParentLayer) {
                result.push(item);
            }
        } else {
            result.push(item);
        }
    });

    return result;
}

const sortItemsByDate = (items: ContentItem[]) => {
    return items.sort((item1, item2) => {
        return item2.dateTime > item1.dateTime ? 1 : -1;
    });
}
