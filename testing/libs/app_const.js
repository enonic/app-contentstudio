/**
 * Created  on 1.12.2017.
 */
module.exports = Object.freeze({
    generateRandomName(part) {
        return part + Math.round(Math.random() * 1000000);
    },
    itemMarkedAsReadyMessage(name) {
        return `Item \"${name}\" is marked as ready`
    },
    itemIsArchived(name) {
        return `Item \"${name}\" is archived`
    },

    itemSavedNotificationMessage(name) {
        return `Item \"${name}\" is saved.`
    },
    languageCopiedNotification: parent => `Language successfully copied from \"${parent}\"`,
    itemPublishedNotificationMessage: (name) => {
        return `Item \"${name}\" is published.`
    },
    issueClosedNotificationMessage(name) {
        return `Issue \"${name}\" is closed.`
    },
    sortOrderTitle(by, order) {
        return `Sorted by \"${by}\" in ${order} order`
    },
    projectModifiedMessage: displayName => `Project \"${displayName}\" is modified.`,
    markedAsReadyMessage: function (name) {
        return `Item \"${name}\" is marked as ready`;
    },
    publishRequestClosedMessage: function (name) {
        return `Publish request \"${name}\" is closed`;
    },
    issueClosedMessage(name) {
        return `Issue \"${name}\" is closed`;
    },
    contentSettingsUpdated(displayName) {
        return `Settings for \"${displayName}\" are updated`
    },
    saveFailedAttempt(name) {
        return `Content \[${name}\] could not be updated. A content with that name already exists`;
    },
    requiredValidationMessage: (occurrences) => {
        return `Min ${occurrences} valid occurrence(s) required`;
    },
    issueClosedBy: userName => {
        return `Closed by user:system:${userName}`
    },
    projectCreatedMessage: name => `Project \"${name}\" is created.`,
    projectNameAlreadyExistsMessage: name => `Project with name [${name}] already exists`,
    projectDeletedMessage: name => `Project \"${name}\" is deleted.`,

    TEST_FOLDER_WITH_IMAGES: 'All Content types images',
    TEST_FOLDER_WITH_IMAGES_NAME: 'all-content-types-images',
    TEST_FOLDER_WITH_IMAGES_2: 'Images for simple page',
    TEST_FOLDER_WITH_IMAGES_NAME_2: 'imagearchive',
    TEST_FOLDER_2_DISPLAY_NAME: 'folder for selenium tests',
    TEST_FOLDER_2_NAME: 'selenium-tests-folder',
    TEST_FOLDER_NAME: 'all-content-types-images',
    APP_CONTENT_TYPES: 'All Content Types App',
    MY_FIRST_APP: 'My First App',
    THIS_FIELD_IS_REQUIRED: 'This field is required',
    PROJECT_UNSAVED_CHANGES_MESSAGE: "There are unsaved changes, do you want to save them before closing?",
    TAB_TITLE_PART: "/ Content",
    CONTENT_STUDIO_TITLE: 'Content Studio',
    ACCESSIBILITY_ATTRIBUTES: {
        ROLE: 'role',
        ARIA_LABEL: 'aria-label',
        ARIA_HAS_POPUP: 'aria-haspopup',
    },
    BROWSER_XP_TITLES: {
        CONTENT_STUDIO: 'Content Studio - Enonic XP Admin',
        XP_HOME: 'Enonic XP Home',
        APPLICATIONS_TITLE: `Applications - Enonic XP Admin`,

    },
    NOTIFICATION_MESSAGES: {
        PERMISSIONS_APPLIED: 'Permissions are applied.',
        YOUR_COMMENT_ADDED: 'Your comment is added to the issue.',
        LOCALIZED_MESSAGE_1: 'Language was copied from current project.',
        LOCALIZED_MESSAGE_2: 'Inherited content is localized',
        NO_CHANGES_TO_REVERT_MESSAGE: 'No changes to revert.',
        ISSUE_CREATED_MESSAGE: 'A new issue is successfully created.',
        ISSUE_CLOSED_MESSAGE: 'The issue is Closed.',
        REQUEST_CREATED_MESSAGE: 'A new Publish Request is successfully created.',
        PUBLISH_REQUEST_CLOSED_MESSAGE: 'The publish request is Closed.',
        ISSUE_OPENED_MESSAGE: 'The issue is Open.',
        THIS_PUBLISH_REQUEST_OPEN: 'The publish request is Open.',
        CONTENT_RENAMED: 'Content has been renamed',
        TWO_ITEMS_PUBLISHED: '2 items are published.',
        TWO_ITEMS_UNPUBLISHED: '2 items are unpublished',
        CONTENT_REVERTED: 'The content was reverted to the version from',
        applicationsCopiedFromParent: (name) => {
            return `Applications successfully copied from \"${name}\"`
        },
        permissionsAppliedNotificationMessage: (name) => {
            return `Permissions for \"${name}\" are applied.`
        },
    },
    TEST_DATA: {
        TEST_FOLDER_IMAGES_1_DISPLAY_NAME: 'All Content types images',
        TEST_FOLDER_IMAGES_1_NAME: 'all-content-types-images',
        FOLDER_WITH_IMAGES_2_DISPLAY_NAME: 'Images for simple page',
        FOLDER_WITH_IMAGES_2_NAME: 'imagearchive',
        SELENIUM_TESTS_FOLDER_DISPLAY_NAME: "folder for selenium tests",
        SELENIUM_TESTS_FOLDER_NAME: 'selenium-tests-folder',
    },
    TEST_APPS_NAME: {
        APP_CONTENT_TYPES: 'All Content Types App',
        SIMPLE_SITE_APP: 'Simple Site App',
        TEST_APP_WITH_METADATA_MIXIN: 'Test Selenium App',
        MY_FIRST_APP: 'My First App',
        TEST_ADFS_PROVIDER_APP: 'Test ADFS ID Provider',
    },

    VERSIONS_ITEM_HEADER: {
        PERMISSIONS_UPDATED: 'Permissions updated',
        CREATED: 'Created',
        EDITED: 'Edited',
        MARKED_AS_READY: 'Marked as Ready',
        SORTED: 'Sorted',
        PUBLISHED: 'Published',
        CHANGED: 'Changed',
        MOVED: 'Moved',
        RENAMED: 'Renamed'
    },

    COMPARE_VERSIONS_DLG_PROP: {
        LANGUAGE: 'language',
        MODIFIED_TIME: 'modifiedTime',
        INHERIT_PERM: 'inheritPermissions',
        WORKFLOW: 'workflow'
    },
    ACCESS_WIDGET_HEADER: {
        RESTRICTED_ACCESS: 'Restricted access to item',
        EVERYONE_CAN_READ: 'Everyone can read this item'
    },
    PROJECT_SYNC: {
        STARTED: 'Content synchronisation job has started',
        FINISHED: 'Content synchronisation job has finished'
    },
    PASSWORD: {
        MEDIUM: 'AUserA567$',
        STRONG: '1User%#567$=',
        WEAK: 'test12345',
    },
    LAST_MODIFIED_ENTRY: {
        WEEK: 'week',
        DAY: 'day',
        HOUR: 'hour'
    },
    URL_TYPE_OPTION: {
        HTTPS: 'Https',
        HTTP: 'Http',
        FTP: 'Ftp',
        TEL: 'Tel',
        RELATIVE: 'Relative'
    },
    LIVE_EDIT: {
        REGION_MAIN_DISPLAY_NAME: 'Main'
    },

    VALIDATION_MESSAGE: {
        TEXT_IS_TOO_LONG: 'Text is too long',
        INVALID_VALUE_ENTERED: 'Invalid value entered',
        SCHEDULE_FORM_ONLINE_PAST: "Online to cannot be in the past",
        SCHEDULE_FORM_ONLINE_FROM_EMPTY: "Online to cannot be set without Online from",
        THIS_FIELD_IS_REQUIRED: 'This field is required',
        SINGLE_SELECTION_OPTION_SET: "At least one option must be selected",
        LINK_PARAMETERS: 'All parameters must have a name',
        PROJECT_IS_OCCUPIED: 'Project identifier is occupied',
    },
    ISSUES: {
        TASK_CLOSED: 'Task is closed',
        COMMENT_ADDED: 'Your comment is added to the task.',
    },
    PROJECT_ACCESS_MODE: {
        PRIVATE: 'Private',
        PUBLIC: 'Public',
        CUSTOM: 'Custom'
    },
    //waitForTimeout
    mediumTimeout: 4000,
    TIMEOUT_4: 4000,
    TIMEOUT_5: 5000,
    longTimeout: 10000,
    saveProjectTimeout: 20000,
    shortTimeout: 2000,
    TIMEOUT_1: 1000,
    SUITE_TIMEOUT: 180000,
    DELETE_INBOUND_MESSAGE: 'One or more items are referenced from another content',
    BROWSER_WIDTH: 1950,
    BROWSER_HEIGHT: 1050,
    INSERT_LINK_DIALOG_TABS: {
        DOWNLOAD_FILE: 'Download file',
        OPEN_FILE: 'Open file',
        LINK_TO_PAGE: 'Link to page (treat media as regular content)',
    },
    IMAGE_STYLE_ORIGINAL: 'Original (no image processing)',
    WIDGET_SELECTOR_OPTIONS: {
        VERSION_HISTORY: 'Version history',
        DEPENDENCIES: 'Dependencies',
        LAYERS: 'Layers',
        EMULATOR: 'Emulator',
        PAGE: 'Page',
        DETAILS: 'Details'
    },
    CONTEXT_WINDOW_TABS: {
        INSPECT: 'Inspect',
        INSERT: 'INSERT'
    },
    CONTROLLER_NAME: {
        DEFAULT: 'default',
        MAIN_REGION: 'main region',
        APP_CONTENT_TYPES_PAGE: 'Page',
        CONTROLLER_NO_REGIONS : 'no regions',
    },
    LAYOUT_NAME: {
        COL_3: '3-col',
        COL_2: '25/75',
        CENTERED: 'Centered',
    },
    LAYOUT_REGION: {
        LEFT: 'left',
        CENTER: 'center',
        RIGHT: 'right',
    },
    PART_NAME: {
        MY_FIRST_APP_CITY_CREATION: 'City Creation',
        CONTENT_TYPES_CITIES_DISTANCE_FACET: 'Cities Distance Facet',
        PART_WITH_ERROR: 'part-with-error',
        MY_FIRST_APP_CITY_LIST: 'City list',
    },
    PCV_MENU_ITEM: {
        INSERT: 'Insert',
        REMOVE: 'Remove',
        PART: 'Part',
        TEXT: 'Text',
        SELECT_PARENT: 'Select parent',
        RESET: 'Reset',
        INSPECT: 'Inspect',
        FRAGMENT: 'Fragment',
        DUPLICATE: 'Duplicate',
        LAYOUT: 'Layout',
    },
    EMULATOR_RESOLUTION: {
        FULL_SIZE: 'Full Size',
        MEDIUM_PHONE: 'Medium Phone',
        LARGE_PHONE: 'Large Phone',
        TABLET: 'Tablet',
        NOTEBOOK_13: "13\" Notebook",
        SMALL_PHONE: 'Small Phone',
        NOTEBOOK_15: "15\" Notebook",
    },
    EMULATOR_RESOLUTION_VALUE: {
        FULL_SIZE: '100%',
        MEDIUM_PHONE: '375px',
        LARGE_PHONE: '414px',
        TABLET: '768px',
        NOTEBOOK_13: '1280px',
        SMALL_PHONE: '320px',
        NOTEBOOK_15: '1356px',
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
        POP_02: 'Pop_02',
        KOTEY: 'kotey',
        SHIP: 'cat',
        FOSS: 'foss',
        SENG: 'seng',
        PES: 'morgopes',
        NORD: 'nord',
        CAPE: 'cape',
        BRO: 'bro',
        MAN2: 'man2',
        MAN: 'man',
        SEVEROMOR: 'severomor',
        ELEPHANT: 'elephant',
        ENTERPRISE: 'enterprise',
        GEEK: 'geek',
        TELK: 'telk',
        MONET_004: 'monet-004',
    },
    COMPONENT_VIEW_MENU_ITEMS: {
        INSERT: 'Insert',
        SAVE_AS_FRAGMENT: 'Save as Fragment',
        SAVE_AS_TEMPLATE: 'Save as Template',
        CUSTOMIZE: 'Customize',
        INSPECT: 'Inspect',
        REMOVE: 'Remove',
        DUPLICATE: 'Duplicate',
        EDIT: 'Edit',
        SELECT_PARENT: 'Select parent',
        RESET: 'Reset'
    },
    PROJECTS: {
        ROOT_FOLDER: 'Projects',
        ROOT_FOLDER_DESCRIPTION: 'Manage projects and layers',
        DEFAULT_PROJECT_NAME: 'Default'
    },
    PROJECT_ROLES: {
        CONTRIBUTOR: 'Contributor',
        AUTHOR: 'Author',
        EDITOR: 'Editor',
        OWNER: 'Owner',
        VIEWER: 'Viewer'
    },
    SHOW_ISSUES_BUTTON_LABEL: {
        NO_OPEN_ISSUES: 'No open issues',
        OPEN_ISSUES: 'Open Issues'
    },

    LANGUAGES: {
        EN: 'English (en)',
        NORSK_NORGE: 'norsk (Norge) (no-NO)',
        NORSK_NO: 'norsk (no)',
        DEUTSCH_DE: 'Deutsch (de)'
    },
    RADIO_OPTION: {
        OPTION_A: "option A",
        OPTION_B: "option B",
        OPTION_C: "option C",
    },
    contentTypes: {
        SHORTCUT: 'Shortcut',
        FOLDER: `Folder`,
        SITE: 'Site',
        PAGE_TEMPLATE: 'Page Template',
        HTML_AREA_0_0: 'htmlarea0_0',
        HTML_AREA_0_2: 'htmlarea0_2',
        HTML_AREA_0_1: 'htmlarea0_1',
        HTML_AREA_1_1: 'htmlarea1_1',
        HTML_AREA_2_4: 'htmlarea2_4',
        IMG_SELECTOR_0_0: 'imageselector0_0',
        IMG_SELECTOR_ALLOW_SITE: 'imageselector_site',
        IMG_SELECTOR_0_1: 'imageselector0_1',
        IMG_SELECTOR_1_1: 'imageselector1_1',
        IMG_SEL_TOGGLE_HIDDEN: 'image-sel-toggle-hidden',
        IMG_SELECTOR_2_4: 'imageselector2_4',
        DOUBLE_MIN_MAX: 'double_max',
        DOUBLE_DEFAULT_2_4: 'double2_4_def',
        DOUBLE_0_1: 'double0_1',
        DOUBLE_0_0: 'double0_0',
        DOUBLE_1_1_X_DATA: "double1_1",
        DOUBLE_2_4: 'double2_4',
        LONG_MIN_MAX: 'long_max',
        TEXTAREA_MAX_LENGTH: 'textarea_conf',
        TEXTLINE_MAX_LENGTH: 'textline_conf',
        TEXTLINE_REGEXP: 'text_line_regexp',
        TEXTLINE_0_1: 'textline0_1',
        TEXTLINE_1_0: 'textline1_0',
        TEXTLINE_1_1: 'textline1_1',
        GEOPOINT_0_0: 'geopoint0_0',
        GEOPOINT_1_1: 'geopoint1_1',
        TIME_0_1: 'time0_1',
        DATE_TIME_NOW_CONFIG: 'datetime now',
        DATE_TIME_1_1: 'datetime1_1',
        DATE_1_1: 'date1_1',
        ATTACHMENTS_1_1: 'attachment1_1',
        ATTACHMENTS_0_0: 'attachment0_0',
        LONG_0_1: 'long0_1',
        LONG_1_1: 'long1_1',
        LONG_2_4: 'long2_4',
        TEXT_AREA_1_1: 'textarea1_1',
        TEXT_AREA_0_1: 'textarea0_1',
        TEXT_AREA_2_4: 'textarea2_4',
        CHECKBOX_0_1: 'checkbox',
        CHECKBOX_1_1: 'checkbox_req',
        FIELDSET: 'fieldset',
        COMBOBOX_0_0: 'combobox0_0',
        COMBOBOX_1_1: 'combobox1_1',
        COMBOBOX_2_4: 'combobox2_4',
        RADIOBUTTON_1_1: 'radiobutton1_1',
        RADIOBUTTON_0_1: 'radiobutton0_1',
        TAG_2_5: 'tag2_5',
        TAG_0_5: 'tag0_5',
        CUSTOM_SELECTOR_0_2: 'custom-selector0_2',
        CUSTOM_SELECTOR_1_1: 'custom-selector1_1',
        CONTENT_SELECTOR_2_8: 'content-selector2_8',
        CONTENT_SELECTOR_1_2: 'content-selector1_2',
        EXPANDED_SINGLE_SELECTION_OPTION_SET: 'optionset-single-selection',
        OPTION_SET: 'optionset',
        OPTION_SET2: 'optionset2',
        OPTION_SET_1: 'optionset1',
        OPTION_SET_UNLIM: 'opt-set-unlim',
        OPTION_SET_0_2: 'optionset0_2',
        ITEM_SET_0_0: 'item-set0_0',
        SET_IN_SET: 'set-in-set',
        ARTICLE: 'article',
        ARTICLE_ALLOW_NON_EX: 'article non existing',
        ARTICLE_ALLOW_MEDIA_WILD_CARD: 'article wild card',
        ARTICLE_ALLOW_NON_MEDIA: 'article non media',
        CUSTOM_REL_0_1: 'custom-relationship0_1',
        CUSTOM_RELATIONSHIP: 'custom-relationship2_4',
        OPTION_SET_HELP_TEXT: 'optionset_help',
        PERSON: 'Person',
        LOCALE_CODE: 'Locale Code',
        FREE_FORM: 'freeform',
    },
    permissions: {
        FULL_ACCESS: 'Full Access',
        CUSTOM: 'Custom...',
        CAN_PUBLISH: 'Can Publish',
        CAN_READ: 'Can Read',
    },
    permissionOperation: {
        READ: 'Read',
        CREATE: 'Create',
        MODIFY: 'Modify',
        DELETE: 'Delete',
        PUBLISH: 'Publish',
        READ_PERMISSIONS: 'Read Permissions',
        WRITE_PERMISSIONS: 'Write Permissions',
    },
    roleName: {
        CONTENT_MANAGER_APP: 'cms.cm.app',
        ADMINISTRATOR: 'system.admin',
        CM_ADMIN: 'cms.admin'
    },
    roleDisplayName: {
        CONTENT_MANAGER_APP: 'Content Manager App',
    },
    systemUsersDisplayName: {
        ANONYMOUS_USER: 'Anonymous User',
        EVERYONE: 'Everyone',
        SUPER_USER: 'Super User',
        ME: 'Me',
    },
    GRID_SORTING: {
        DATE_ASC: 'Date ascending',
        DATE_DESC: 'Date descending',
        NAME_ASC: 'Name ascending',
        NAME_DESC: 'Name descending',
        MANUALLY_SORTED: 'Manually sorted',
    },
    SORT_DIALOG: {
        MENU_ITEM: {
            DISPLAY_NAME: 'Display name',
            MANUALLY_SORTED: 'Manually sorted',
            MODIFIED_DATE: 'Modified date',
            CREATED_DATE: 'Created date',
            PUBLISHED_DATE: "Published date",
        },
        ASCENDING: 'ascending',
        DESCENDING: 'descending'

    },
    STATUS_WIDGET: {
        NEW: 'NEW',
        PUBLISHED: 'PUBLISHED',
        MODIFIED: 'MODIFIED',
        MOVED: 'MOVED',
        MOVED_MODIFIED: 'MOVED, MODIFIED',
    },
    CONTENT_STATUS: {
        NEW: 'New',
        PUBLISHED: 'Published',
        UNPUBLISHED: 'Unpublished',
        MODIFIED: 'Modified',
        MOVED: 'Moved',
        MOVED_MODIFIED: 'Moved, Modified',
        PUBLISHING_SCHEDULED: 'Scheduled',
        SCHEDULED_MODIFIED: 'Scheduled, Modified',
    },
    PUBLISH_MENU: {
        REQUEST_PUBLISH: 'Request Publishing...',
        PUBLISH: 'Publish...',
        PUBLISH_TREE: 'Publish Tree...',
        MARK_AS_READY: 'Mark as ready',
        UNPUBLISH: 'Unpublish...',
        CREATE_ISSUE: 'Create Issue...'
    },
    GRID_CONTEXT_MENU: {
        NEW: 'New',
        EDIT: 'Edit',
        ARCHIVE: 'Archive...',
        DUPLICATE: 'Duplicate...',
        MOVE: 'Move...',
        SORT: 'Sort...',
        RESTORE: 'Restore...',
        PREVIEW: 'Preview',
        PUBLISH: 'Publish...',
        UNPUBLISH: 'Unpublish...'
    },
    WORKFLOW_STATE: {
        WORK_IN_PROGRESS: 'Work in progress',
        READY_FOR_PUBLISHING: 'Ready for publishing',
        PUBLISHED: 'Published'
    },
    FILTER_PANEL_AGGREGATION_BLOCK: {
        CONTENT_TYPES: 'Content Types',
        WORKFLOW: 'Workflow',
        LAST_MODIFIED: 'Last Modified',
        LAST_MODIFIED_BY: 'Last Modified by',
        OWNER: 'Owner',
        LANGUAGE: 'Language',
        IMAGE:'Image'
    },
    ISSUE_LIST_TYPE_FILTER: {
        ALL: 'All',
        ASSIGNED_TO_ME: 'Assigned to Me',
        CREATED_BY_ME: 'Created by Me',
        PUBLISH_REQUESTS: 'Publish requests',
        ISSUES: 'Issues',
    },
    SYSTEM_ROLES_NAME: {
        ADMINISTRATOR: 'roles/system.admin',
        AUDIT_LOG: 'roles/system.auditlog',
    },
    SYSTEM_ROLES: {
        CM_ADMIN: 'Content Manager Administrator',
        ADMIN_CONSOLE: 'Administration Console Login',
        CM_APP: 'Content Manager App',
        CM_APP_EXPERT: 'Content Manager Expert',
        ADMINISTRATOR: 'Administrator',
        USERS_APP: 'Users App',
        AUTHENTICATED: 'Authenticated',
        USERS_ADMINISTRATOR: 'Users Administrator',
        EVERYONE: 'Everyone',
        AUDIT_LOG: 'Audit Log',
    },
    PREVIEW_WIDGET: {
        AUTOMATIC: 'Automatic',
        ENONIC_RENDERING: 'Enonic rendering',
        MEDIA: 'Media',
        JSON: 'JSON'
    },
    INSPECT_PANEL_TEMPLATE_CONTROLLER:{
        AUTOMATIC: 'Automatic',
    },
    LIVE_VIEW_IFRAME_CLASS: {
        IMAGE: 'image',
        APPLICATION: 'application',
    },
    LIVE_VIEW_JSON_KEY: {
        NAME: '_name',
        DISPLAY_NAME: 'displayName',
        PATH: '_path',
        CREATOR: 'creator',
        MODIFIER: 'modifier',
    },
    PREVIEW_PANEL_MESSAGE: {
        CAN_NOT_RENDER_NON_MEDIA: 'Can not render non-media content',
        PREVIEW_NOT_AVAILABLE: 'Preview not available',
        CAN_NOT_RENDER_WITH_SITE_ENGINE: 'Can not render with site engine',
        PREVIEW_NOT_AVAILABLE_ADD_APP: 'Please add an application to your site to enable rendering of this item'
    },
    X_DATA_NAME: {
        TEXT_AREA_X_DATA_NAME: 'Text Area x-data',
        HTML_AREA_X_DATA_NAME: 'Html Area x-data',
        IMAGE_X_DATA_NAME: 'X-data (image selector)'
    },
    PERMISSIONS_DIALOG: {
        APPLY_TO: {
            THIS_ITEM: 'This item',
            CHILDREN_ONLY: 'Children only',
        },
        ACCESS_MODE: {
            RESTRICTED: 'Restricted',
            PUBLIC: 'Public',
        }
    }
});
