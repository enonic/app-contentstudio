/**
 * Created on 18.01.2023
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('page.template.controller.support.spec tests for page template wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const TEMPLATE_NAME = contentBuilder.generateRandomName('template');
    const COUNTRY_LIST_CONTROLLER = "Country List";

    it("GIVEN a controller has been selected in template-wizard WHEN an option has been selected in support dropdown selector THEN 'Save' button gets enabled",
        async () => {
            let pageTemplateForm = new PageTemplateForm();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.MY_FIRST_APP]);
            await studioUtils.doAddSite(SITE);
            // 1. Open wizard for new page template
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            // 2. Fill in the name input
            await contentWizard.typeDisplayName(TEMPLATE_NAME);
            await contentWizard.pause(500);
            // 3. Select a page descriptor
            await contentWizard.selectPageDescriptor(COUNTRY_LIST_CONTROLLER);
            await contentWizard.waitForSaveButtonDisabled();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            // 4. Select 'site' option in support selector:
            await pageTemplateForm.filterOptionsAndSelectSupport(appConst.TEMPLATE_SUPPORT.SITE);
            await studioUtils.saveScreenshot('page_template_support_selected');
            // 5. Verify that 'Save' button gets enabled after selecting in support dropdown
            await contentWizard.waitForSaveButtonEnabled();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing template is opened WHEN 'Mark as ready' menu item has been pressed THEN 'Content is ready for publishing' appears in the modal dialog",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open existing page template
            await studioUtils.selectAndOpenContentInWizard(TEMPLATE_NAME);
            // 2. Clicking on 'Mark as Ready' button in the wizard toolbar
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 3. Clicking on 'Mark as ready' button in the modal dialog:
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await studioUtils.saveScreenshot('page_template_mark_as_ready');
            // 4. Verify 'Content is ready for publishing' appears in the dialog:
            await contentPublishDialog.waitForReadyForPublishingTextDisplayed();
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
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
