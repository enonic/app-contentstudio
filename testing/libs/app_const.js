/**
 * Created  on 1.12.2017.
 */
module.exports = Object.freeze({
    generateRandomName: function (part) {
        return part + Math.round(Math.random() * 1000000);
    },
    itemMarkedAsReadyMessage(name) {
        return `Item \"${name}\" is marked as ready`
    },
    itemSavedNotificationMessage: function (name) {
        return `Item \"${name}\" is saved.`
    },
    itemPublishedNotificationMessage: function (name) {
        return `Item \"${name}\" is published.`
    },
    issueClosedNotificationMessage: function (name) {
        return `Issue \"${name}\" is closed.`
    },
    sortOrderTitle: function (by, order) {
        return `Sorted by \"${by}\" in ${order} order`
    },
    permissionsAppliedNotificationMessage: function (name) {
        return `Permissions for \"${name}\" are applied.`
    },
    projectModifiedMessage: displayName => `Project \"${displayName}\" is modified.`,
    markedAsReadyMessage: function (name) {
        return `Item \"${name}\" is marked as ready`;
    },
    publishRequestClosedMessage: function (name) {
        return `Publish request \"${name}\" is closed`;
    },
    taskClosedMessage: function (name) {
        return `Task \"${name}\" is closed`;
    },
    saveFailedAttempt: function (name) {
        return `Content \[${name}\] could not be updated. A content with that name already exists`;
    },
    projectCreatedMessage: name => `Project \"${name}\" is created.`,
    projectNameAlreadyExistsMessage: name => `Project with name [${name}] already exists`,
    projectDeletedMessage: name => `Project \"${name}\" is deleted.`,
    NO_CHANGES_TO_REVERT_MESSAGE: "No changes to revert.",
    THIS_PUBLISH_REQUEST_OPEN: 'The publish request is Open.',
    REQUEST_CREATED_MESSAGE: 'New publish request created successfully.',
    TASK_CLOSED_MESSAGE: 'The task is Closed.',
    TASK_CREATED_MESSAGE: "New task created successfully.",
    PUBLISH_REQUEST_CLOSED_MESSAGE: 'The publish request is Closed.',
    TASK_OPENED_MESSAGE: 'The task is Open.',
    TWO_ITEMS_PUBLISHED: "2 items are published.",
    TWO_ITEMS_UNPUBLISHED: "2 items are unpublished",
    ITEM_IS_UNDELETED_MESSAGE: "Item is undeleted",
    CONTENT_RENAMED: "Content has been renamed",
    TEST_FOLDER_WITH_IMAGES: "All Content types images",
    TEST_FOLDER_WITH_IMAGES_NAME: "all-content-types-images",
    TEST_FOLDER_WITH_IMAGES_2: "Images for simple page",
    TEST_FOLDER_WITH_IMAGES_NAME_2: "imagearchive",
    TEST_FOLDER_2_DISPLAY_NAME: "folder for selenium tests",
    TEST_FOLDER_2_NAME: "selenium-tests-folder",
    TEST_FOLDER_NAME: 'all-content-types-images',
    APP_CONTENT_TYPES: 'All Content Types App',
    SIMPLE_SITE_APP: 'Simple Site App',
    APP_WITH_CONFIGURATOR: 'Second Selenium App',
    APP_WITH_METADATA_MIXIN: 'Third Selenium App',
    THIS_FIELD_IS_REQUIRED: 'This field is required',
    YOUR_COMMENT_ADDED: 'Your comment is added to the task.',
    LOCALIZED_MESSAGE_1: "Language was copied from current project.",
    LOCALIZED_MESSAGE_2: "Inherited content was localized",
    CONTENT_REVERTED_MESSAGE: 'The content was reverted to the version from',
    PROJECT_UNSAVED_CHANGES_MESSAGE: "There are unsaved changes, do you want to save them before closing?",
    ACCESS_WIDGET_HEADER: {
        RESTRICTED_ACCESS: "Restricted access to item",
        EVERYONE_CAN_READ: "Everyone can read this item"
    },
    PROJECT_SYNC: {
        STARTED: "Content synchronisation job has started",
        FINISHED: "Content synchronisation job has finished"
    },
    PASSWORD: {
        MEDIUM: "password123",
        STRONG: "password123=",
        WEAK: "password"
    },

    VALIDATION_MESSAGE: {
        TEXT_IS_TOO_LONG: "Text is too long"
    },

    PROJECT_ACCESS_MODE: {
        PRIVATE: "Private",
        PUBLIC: "Public",
        CUSTOM: "Custom"
    },
    //waitForTimeout
    mediumTimeout: 3000,
    TIMEOUT_4: 4000,
    TIMEOUT_5: 5000,
    longTimeout: 10000,
    shortTimeout: 2000,
    TIMEOUT_1: 1000,
    SUITE_TIMEOUT: 180000,
    DELETE_INBOUND_MESSAGE: 'The content you are about to delete has inbound references. Please verify them before deletion.',

    IMAGE_STYLE_ORIGINAL: "Original (no image processing)",
    WIDGET_TITLE: {
        VERSION_HISTORY: 'Version history',
        DEPENDENCIES: 'Dependencies',
        LAYERS: 'Layers'
    },
    ACCESS_MENU_ITEM: {
        CUSTOM: 'Custom...',
        CAN_PUBLISH: 'Can Publish',
        FULL_ACCESS: 'Full Access'
    },
    TEMPLATE_SUPPORT: {
        SITE: 'Site',
    },
    SORTING_ORDER: {
        MODIFIED_DATE: 'Modified date',
        CREATED_DATE: 'Created date',
    },
    TEST_IMAGES: {
        HAND: 'hand',
        WHALE: 'whale',
        RENAULT: 'renault',
        SPUMANS: 'spumans',
        BOOK: 'book',
        POP_03: 'Pop_03',
        KOTEY: 'kotey',
        SHIP: 'cat',
        FOSS: 'foss',
        SENG: 'seng',
        PES: 'morgopes',
        NORD: 'nord',
        CAPE: 'cape',
        BRO: 'bro',
        MAN2: 'man2',
        SEVEROMOR: 'severomor'
    },
    MENU_ITEMS: {
        INSERT: 'Insert',
        SAVE_AS_FRAGMENT: 'Save as Fragment',
        DETACH_FROM_FRAGMENT: 'Detach from fragment',
        SPUMANS: 'spumans',
        BOOK: 'book',
    },
    PROJECTS: {
        ROOT_FOLDER: "Projects",
        ROOT_FOLDER_DESCRIPTION: "Manage projects and layers",
        DEFAULT_PROJECT_NAME: "Default"
    },
    PROJECT_ROLES: {
        CONTRIBUTOR: "Contributor",
        AUTHOR: "Author",
        EDITOR: "Editor",
        OWNER: "Owner",
        VIEWER: "Viewer"
    },
    SHOW_ISSUES_BUTTON_LABEL: {
        NO_OPEN_ISSUES: 'No open issues',
        OPEN_ISSUES: 'Open Issues'
    },

    LANGUAGES: {
        EN: 'English (en)',
        NORSK_NORGE: 'norsk (Norge) (no-NO)',
        NORSK_NO: 'norsk (no)'
    },
    contentTypes: {
        SHORTCUT: 'Shortcut',
        FOLDER: `Folder`,
        SITE: 'Site',
        PAGE_TEMPLATE: `Page Template`,
        HTML_AREA_0_1: `htmlarea0_1`,
        HTML_AREA_2_4: `htmlarea2_4`,
        IMG_SELECTOR_0_0: 'contenttypes:imageselector0_0',
        IMG_SELECTOR_1_1: 'imageselector1_1',
        IMG_SELECTOR_2_4: 'imageselector2_4',
        ARTICLE: `article`,
        CUSTOM_RELATIONSHIP: 'custom-relationship2_4',
        DOUBLE_MIN_MAX: 'double_max',
        DOUBLE_DEFAULT_2_4: 'double2_4_def',
        LONG_MIN_MAX: 'long_max',
        TEXTAREA_MAX_LENGTH: 'textarea_conf',
        TEXTLINE_MAX_LENGTH: 'textline_conf',
    },
    permissions: {
        FULL_ACCESS: `Full Access`,
        CUSTOM: `Custom...`,
        CAN_PUBLISH: `Can Publish`,
        CAN_READ: `Can Read`,
    },
    permissionOperation: {
        READ: 'Read',
        CREATE: `Create`,
        MODIFY: 'Modify',
        DELETE: `Delete`,
        PUBLISH: `Publish`,
        READ_PERMISSIONS: `Read Permissions`,
        WRITE_PERMISSIONS: 'Write Permissions',
    },
    roleName: {
        CONTENT_MANAGER_APP: 'cms.cm.app',
    },
    roleDisplayName: {
        CONTENT_MANAGER_APP: 'Content Manager App',
    },
    systemUsersDisplayName: {
        ANONYMOUS_USER: 'Anonymous User',
        EVERYONE: 'Everyone',
        SUPER_USER: 'Super User',
    },
    sortMenuItem: {
        DISPLAY_NAME: 'Display name',
        MANUALLY_SORTED: 'Manually sorted',
        MODIFIED_DATE: "Modified date",
        CREATED_DATE: "Created date",
        PUBLISHED_DATE: "Published date",
    },
    CONTENT_STATUS: {
        NEW: 'New',
        PUBLISHED: 'Published',
        UNPUBLISHED: 'Unpublished',
        MODIFIED: 'Modified',
        MARKED_FOR_DELETION: 'Marked for deletion',
        MOVED: 'Moved',
        PUBLISHING_SCHEDULED: 'Publishing Scheduled'
    },
    PUBLISH_MENU: {
        REQUEST_PUBLISH: "Request Publishing...",
        PUBLISH: "Publish...",
        PUBLISH_TREE: "Publish Tree...",
        MARK_AS_READY: "Mark as ready",
        UNPUBLISH: "Unpublish...",
        CREATE_TASK: "Create Task..."
    },
    WORKFLOW_STATE: {
        WORK_IN_PROGRESS: 'Work in progress',
        READY_FOR_PUBLISHING: 'Ready for publishing',
        PUBLISHED: 'Published'
    },
    ISSUE_LIST_TYPE_FILTER: {
        ALL: 'All',
        ASSIGNED_TO_ME: 'Assigned to Me',
        CREATED_BY_ME: 'Created by Me',
        PUBLISH_REQUESTS: 'Publish requests',
        TASKS: 'Tasks'
    },
    SYSTEM_ROLES: {
        CM_ADMIN: 'Content Manager Administrator',
        ADMIN_CONSOLE: 'Administration Console Login',
        CM_APP: 'Content Manager App',
        ADMINISTRATOR: 'Administrator',
        USERS_APP: 'Users App',
        AUTHENTICATED: 'Authenticated',
        USERS_ADMINISTRATOR: 'Users Administrator',
        EVERYONE: 'Everyone'
    },
});
