/**
 * Created on 23.12.2017.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentSelector = require('../../page_objects/components/content.selector.dropdown');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ArticleForm = require('../../page_objects/wizardpanel/article.form.panel');
const CustomRelationshipForm = require('../../page_objects/wizardpanel/custom.relationship.form.panel');

describe('content.selector.spec: content-selector specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let articleContent;
    const ARTICLE_NAME_1 = appConst.generateRandomName('article');
    const RELATIONSHIP_NAME = appConst.generateRandomName('rel');

    it(`Preconditions: new site should be added`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            // 1. Add the site:
            await studioUtils.doAddSite(SITE);
            // 2. Add 'Article' content
            let articleForm = new ArticleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            await articleForm.typeArticleTitle('test');
            await articleForm.typeInTextArea('body');
            await contentWizard.typeDisplayName(ARTICLE_NAME_1);
            await studioUtils.saveAndCloseWizard();
        });

    it(`GIVEN new wizard for custom-relationship content is opened WHEN article-option has been selected THEN expected article should appear in the selected options view`,
        async () => {
            let contentWizard = new ContentWizard();
            let customRelationshipForm = new CustomRelationshipForm();
            // 1. Open new wizard for article-content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CUSTOM_RELATIONSHIP);
            await contentWizard.typeDisplayName(RELATIONSHIP_NAME);
            // 2. Select the article in options -  type the name of the article and click on the slick-row:
            await customRelationshipForm.selectOption(ARTICLE_NAME_1);
            await contentWizard.waitAndClickOnSave();
            // 3. Verify the selected option:
            await studioUtils.saveScreenshot('custom_rel_option_selected');
            let result = await customRelationshipForm.getSelectedOptions();
            assert.equal(result[0], ARTICLE_NAME_1, "Expected article should be present in selected options");
        });

    it(`GIVEN existing content with custom-relationship selector is opened WHEN the selected option has been removed THEN the article should not be present in selected options`,
        async () => {
            let customRelationshipForm = new CustomRelationshipForm();
            // 1. Open new wizard for article-content:
            await studioUtils.selectAndOpenContentInWizard(RELATIONSHIP_NAME);
            // 2. Select the article in options -  type the name of the article and click on the slick-row:
            await customRelationshipForm.removeSelectedOption(ARTICLE_NAME_1);
            // 3. Verify the selected option:
            await studioUtils.saveScreenshot('custom_rel_option_removed');
            let result = await customRelationshipForm.getSelectedOptions();
            assert.equal(result.length, 0, "no selected options should be in the options view");
        });

    it(`WHEN new article has been saved THEN the article should be listed in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('article');
            articleContent = contentBuilder.buildArticleContent(displayName, 'title', 'body', appConst.contentTypes.ARTICLE);
            await studioUtils.doAddArticleContent(SITE.displayName, articleContent);
            await studioUtils.typeNameInFilterPanel(articleContent.displayName);
            let isDisplayed = await contentBrowsePanel.waitForContentDisplayed(articleContent.displayName);
            await studioUtils.saveScreenshot('article_content_added');
            assert.ok(isDisplayed, 'the article should be listed in the grid');
        });

    it(`WHEN wizard for 'custom-relationship' is opened THEN mode toggler should be present in the content-selector AND 'Flat' mode should be by default`,
        async () => {
            let contentSelector = new ContentSelector();
            // 1. Open the wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CUSTOM_RELATIONSHIP);
            await contentSelector.waitForModeTogglerDisplayed();
            // 2. Verify the mode in content-selector:
            let actualMode = await contentSelector.getMode();
            await studioUtils.saveScreenshot('content_selector_default_mode');
            assert.equal(actualMode, 'flat', 'Flat mode should be by default');
        });

    it(`GIVEN wizard for 'custom-relationship' is opened WHEN mode toggler has been clicked THEN switches to 'Tree' mode`,
        async () => {
            let contentSelector = new ContentSelector();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CUSTOM_RELATIONSHIP);
            // 1. Click on mode toggler button:
            await contentSelector.clickOnModeTogglerButton();
            // 2. Verify that tree mode is switched on:
            let actualMode = await contentSelector.getMode();
            await studioUtils.saveScreenshot('content_selector_tree_mode');
            assert.equal(actualMode, 'tree', "'Tree' mode should be in the selector");
        });

    it(`GIVEN wizard for 'custom-relationship' is opened WHEN 'mode toggler' button has been clicked THEN switches to 'Tree'-mode AND parent site should be present in the options`,
        async () => {
            let contentSelector = new ContentSelector();
            // 1. Custom relationship has been opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CUSTOM_RELATIONSHIP);
            // 2. Mode toggler has been clicked(switches to tree mode):
            await contentSelector.clickOnModeTogglerButton();
            let options = await contentSelector.getOptionsDisplayNameInTreeMode();
            // 3. Only the parent site should be present in the options
            await studioUtils.saveScreenshot('content_sel_tree_mode_option');
            assert.strictEqual(options[0], SITE.displayName);
            assert.strictEqual(options.length, 1, "One site should be displayed in the tree mode");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
