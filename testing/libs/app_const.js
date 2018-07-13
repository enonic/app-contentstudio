/**
 * Created  on 1.12.2017.
 */
module.exports = Object.freeze({
    generateRandomName: function (part) {
        return part + Math.round(Math.random() * 1000000);
    },
    itemSavedNotificationMessage: function (name) {
        return `\"${name}\" is saved`
    },
    itemPublishedNotificationMessage: function (name) {
        return `Item \"${name}\" is published.`
    },
    issueClosedNotificationMessage: function (name) {
        return `Issue \"${name}\" is closed.`
    },
    ISSUE_CLOSED_MESSAGE: 'The issue is Closed.',
    ISSUE_OPENED_MESSAGE: 'The issue is Open.',
    TWO_ITEMS_PUBLISHED:`2 items are published.`,
    TEST_FOLDER_WITH_IMAGES: `All Content types images`,
    TEST_FOLDER_2_DISPLAY_NAME: `folder for selenium tests`,
    TEST_FOLDER_2_NAME: `selenium-tests-folder`,
    TEST_FOLDER_NAME: 'all-content-types-images',
    APP_CONTENT_TYPES: 'All Content Types App',
    APP_WITH_CONFIGURATOR: 'Second Selenium App',
    APP_WITH_METADATA_MIXIN: 'Third Selenium App',
    //waitForTimeout
    TIMEOUT_10: 10000,
    TIMEOUT_3: 3000,
    TIMEOUT_5: 5000,
    TIMEOUT_2: 2000,
    TIMEOUT_1: 1000,
    SUITE_TIMEOUT: 180000,
    DELETE_INBOUND_MESSAGE: 'The content you are about to delete has inbound references. Please verify them before deletion.',

    TEMPLATE_SUPPORT: {
        SITE: 'Site',
    },
    TEST_IMAGES: {
        HAND: 'hand',
        WHALE: 'whale',
        RENAULT: 'renault',
        SPUMANS: 'spumans',
        BOOK: 'book',
    },
    MENU_ITEMS: {
        INSERT: 'Insert',
        SAVE_AS_FRAGMENT: 'Save as Fragment',
        DETACH_FROM_FRAGMENT: 'Detach from fragment',
        SPUMANS: 'spumans',
        BOOK: 'book',
    },
    contentTypes: {
        SHORTCUT: 'base:shortcut',
        FOLDER: `base:folder`,
        SITE: 'portal:site',
        PAGE_TEMPLATE: `portal:page-template`,
        HTML_AREA_0_1: `:htmlarea0_1`,
        HTML_AREA_2_4: `:htmlarea2_4`,
        IMG_SELECTOR_0_0: 'contenttypes:imageselector0_0',
        IMG_SELECTOR_1_1: ':imageselector1_1',
        IMG_SELECTOR_2_4: ':imageselector2_4',
        ARTICLE: `:article`,
        CUSTOM_RELATIONSHIP: ':custom-relationship2_4',
        DOUBLE_MIN_MAX: ':double_max',
        LONG_MIN_MAX: ':long_max',
        TEXTAREA_MAX_LENGTH: 'textarea_conf',
        TEXTLINE_MAX_LENGTH: ':textline_conf',
    },
});