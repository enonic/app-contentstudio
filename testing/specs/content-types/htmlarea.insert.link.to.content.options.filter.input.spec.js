/**
 * Created on 05.06.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialogContentPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('htmlarea.insert.link.to.content.spec: tests for filtering in content selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let SITE_NAME = contentBuilder.generateRandomName('site');
    const DUPLICATED_SITE_NAME = SITE_NAME + "-copy";

    it(`Preconditions: new site and its copy should be created`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);

            await studioUtils.findAndSelectItem(SITE_NAME);
            let contentDuplicateModalDialog = await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateModalDialog.clickOnDuplicateButton();
            await contentDuplicateModalDialog.waitForDialogClosed();
        });

    it(`GIVEN Show content from entire project checkbox is not selected WHEN options are expanded THEN content name that starts the same as the current site should not be present in the options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open 'Insert Link' dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Click on content-dropdown handler, expand the options:
            await insertLinkDialogContentPanel.clickOnContentDropdownHandle();
            // 3. Content selector should be switched to tree mode by default:
            let actualMode = await insertLinkDialogContentPanel.getOptionsMode();
            assert.equal(actualMode, 'tree', 'Content selector should be in tree mode');
            // 4. Verify - content name that starts the same as the current site(duplicated content) should not be present in the options:
            let items = await insertLinkDialogContentPanel.getContentSelectorOptionsDisplayNameInTreeMode()
            await studioUtils.saveScreenshot('duplicated_content_is_not_present_in_options');
            // Only one item should be present in the list of options in Tree mode:
            assert.equal(items.length, 1, 'Only one item should be present in the list of options');
            assert.ok(items.includes('/' + DUPLICATED_SITE_NAME) === false, 'Duplicated site should not be present in the options');
        });

    it(`GIVEN Show content from entire project checkbox is selected WHEN current site's name has been typed in the options filter input THEN content name that starts the same as the current site should be present in the options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open Insert Link dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Click on 'show content from entire project' checkbox
            await insertLinkDialogContentPanel.clickOnShowContentFromEntireProjectCheckbox();
            // 3. Insert the current site's name in the options filter input:
            await insertLinkDialogContentPanel.typeTextInContentOptionsFilterInput(SITE_NAME)
            await insertLinkDialogContentPanel.pause(1000);
            await studioUtils.saveScreenshot('duplicated_content_is_present_in_options');
            // 4. Verify - content name that starts the same as the current site(duplicated content) should be present in the options:
            let items = await insertLinkDialogContentPanel.getContentSelectorOptionsNameInFlatMode();
            assert.ok(items.includes('/' + DUPLICATED_SITE_NAME), 'Duplicated site should be present in the options');
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
