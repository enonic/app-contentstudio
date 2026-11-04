/**
 * Created on 04.11.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentSelectorForm = require('../../page_objects/wizardpanel/content.selector.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');

describe('content.selector.allowed.types.new.content.spec: New Content dialog opened from a content-selector with allowContentType config', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    // content-sel-conf3 config:
    //   allowContentType: "article", "base:folder"
    const ALLOWED_CONTENT_TYPES = ['article', 'Folder'];
    const NOT_FOUND_MESSAGE = 'No content types found';

    it(`GIVEN wizard for 'content-sel-conf3' is opened WHEN 'Add new' icon has been clicked THEN only the allowed content types should be displayed in 'All' tab AND 'Media' tab should be disabled`, async () => {
        let contentSelectorForm = new ContentSelectorForm();
        let contentWizard = new ContentWizard();
        let newContentDialog = new NewContentDialog();
        // 1. Select the imported site and open the wizard for 'content-sel-conf3':
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.CONTENT_SELECTOR_CONF_3);
        await contentWizard.typeDisplayName(appConst.generateRandomName('sel'));
        // 2. Click on 'Add new' icon in the content selector:
        await contentSelectorForm.clickOnAddNewContentButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.waitForContentTypesLoaded();
        await studioUtils.saveScreenshot('content_sel_conf3_new_content_dlg_all_tab');
        // 3. Verify that the dialog is opened in the context of the current content (child of the site):
        let path = await newContentDialog.getDialogPathText();
        assert.ok(
            path.startsWith(`/${IMPORTED_SITE_NAME}/`),
            'Path of the new content should be displayed in the header',
        );
        // 4. 'All' tab should be selected by default:
        await newContentDialog.waitForTabSelected('All');
        // 5. Only two allowed content types should be displayed in 'All' tab:
        let items = await newContentDialog.getItemsInAllTab();
        assert.equal(
            items.length,
            ALLOWED_CONTENT_TYPES.length,
            'Only two content types should be displayed in the dialog',
        );
        ALLOWED_CONTENT_TYPES.forEach((type) => assert.ok(items.includes(type), `'${type}' type should be displayed`));
        // 6. 'Media' tab should be disabled, because media types are not allowed in the selector config:
        await newContentDialog.waitForMediaTabButtonDisabled();
        // 7. 'Suggested' tab should be enabled:
        await newContentDialog.waitForSuggestedTabButtonEnabled();
    });

    it(`GIVEN 'New Content' dialog is opened from the content selector WHEN 'Suggested' tab has been clicked THEN 'No content types found' message should be displayed`, async () => {
        let contentSelectorForm = new ContentSelectorForm();
        let contentWizard = new ContentWizard();
        let newContentDialog = new NewContentDialog();
        // 1. Select the imported site and open the wizard for 'content-sel-conf3':
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.CONTENT_SELECTOR_CONF_3);
        await contentWizard.typeDisplayName(appConst.generateRandomName('sel'));
        // 2. Click on 'Add new' icon in the content selector:
        await contentSelectorForm.clickOnAddNewContentButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.waitForContentTypesLoaded();
        // 3. Click on 'Suggested' tab:
        await newContentDialog.clickOnSuggestedButton();
        await newContentDialog.waitForTabSelected('Suggested');
        await newContentDialog.waitForSuggestedTabDisplayed();
        await studioUtils.saveScreenshot('content_sel_conf3_new_content_dlg_suggested_tab');
        // 4. The new content has no children yet, so there are no suggested types:
        let message = await newContentDialog.waitForNoTypesFoundMessage('Suggested');
        assert.equal(message, NOT_FOUND_MESSAGE, `'${NOT_FOUND_MESSAGE}' should be displayed in 'Suggested' tab`);
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
