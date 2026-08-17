/**
 * Created on 23.12.2017.  updated on 24.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentSelectorForm = require('../../page_objects/wizardpanel/content.selector.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('content.selector.config.spec: tests for content-selector with config', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    const ARTICLE_NAME_1 = 'article1'; // This content is in :- "${site}/articles*/"
    const ARTICLE_NAME_2 = 'article2'; // This content is in :- "${site}/"
    const CONTENT_NAME = appConst.generateRandomName('cs');

    //  allowContentType:- "article"
    //   allowPath:- "${site}/articles*/"
    it(`GIVEN new wizard for content selector with allowPath config is opened WHEN article from the allowed path is selected THEN article should appear in selected options`, async () => {
        let contentWizard = new ContentWizard();
        let contentSelectorForm = new ContentSelectorForm();
        // 1. Open new wizard for article-content:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.CONTENT_SELECTOR_CONF);
        await contentWizard.typeDisplayName(CONTENT_NAME);
        // 2. article in the allowed path is searched :
        await contentSelectorForm.clickOnOptionByDisplayNameAndApply(ARTICLE_NAME_1);
        await contentWizard.waitAndClickOnSave();
        // 3. Verify the selected option:
        await studioUtils.saveScreenshot('sel_config_option_selected');
        let result = await contentSelectorForm.getSelectedOptions();
        assert.equal(result[0], ARTICLE_NAME_1, 'Expected article should be present in selected options');
    });

    it(`GIVEN new wizard for content selector with allowPath config is opened WHEN article outside the allowed path is searched THEN 'No matching items' should be displayed`, async () => {
        let contentWizard = new ContentWizard();
        let contentSelectorForm = new ContentSelectorForm();
        // 1. Open new wizard for article-content:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.CONTENT_SELECTOR_CONF);
        // 2. article outside the allowed path is searched :
        await contentSelectorForm.typeTextInOptionsFilterInput(ARTICLE_NAME_2);
        // No matching items should be displayed because the article is not in the allowed path
        await contentSelectorForm.waitForEmptyOptionsMessage();
    });

    it(`GIVEN existing content with content selector is opened WHEN the selected option has been removed THEN the item should not be displayed in the selected options`, async () => {
        let customRelationshipForm = new ContentSelectorForm();
        // 1. Open the existing content with selected option (custom relationship):
        await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
        // 2. Remove the selected option:
        await customRelationshipForm.removeSelectedOption(ARTICLE_NAME_1);
        // 3. Verify that option is not displayed:
        await studioUtils.saveScreenshot('custom_rel_option_removed');
        let result = await customRelationshipForm.getSelectedOptions();
        assert.equal(result.length, 0, 'No selected options should be shown in the options view.');
    });

    it(`GIVEN wizard for content-selector is opened THEN 'Flat' mode should be active by default`, async () => {
        let contentSelectorForm = new ContentSelectorForm();
        // 1. Open the wizard:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.CONTENT_SELECTOR_CONF);
        // 2. Verify that 'Flat' mode should be by default:
        let actualMode = await contentSelectorForm.getOptionsMode();
        await studioUtils.saveScreenshot('content_selector_default_mode');
        assert.equal(actualMode, 'flat', 'Flat mode should be by default');
    });

    // https://github.com/enonic/app-contentstudio/issues/10225
    // https://github.com/enonic/app-contentstudio/issues/10916
    it(`GIVEN wizard for content-selector is opened WHEN mode toggler is clicked THEN switches to Tree mode AND only parent site appears in options`, async () => {
        let contentSelectorForm = new ContentSelectorForm();
        // 1. existing content with selector has been opened:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.CONTENT_SELECTOR_CONF);
        await contentSelectorForm.waitForOptionFilterInputDisplayed();
        await contentSelectorForm.pause(1000);
        // 2. Mode toggler has been clicked(switches to tree mode):
        await contentSelectorForm.clickOnModeTogglerButton();
        let options = await contentSelectorForm.getOptionsDisplayNameInTreeMode();
        // 3. Only the parent site should be present in the options
        await studioUtils.saveScreenshot('content_sel_tree_mode_option');
        assert.strictEqual(options[0], IMPORTED_SITE_NAME);
        assert.strictEqual(options.length, 1, 'One site should be displayed in the tree mode');
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
