/**
 * Created on 30.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');
const SiteForm = require('../../page_objects/wizardpanel/site.form.panel');
const PageInspectionPanel = require("../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel");

describe('publish.simple.site.spec - publishes new site in wizard panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;


    //https://github.com/enonic/app-contentstudio/issues/10957
    // Incorrect behavior when publishing content in Content Wizard
    it(`GIVEN wizard for new site is opened WHEN the site has been published THEN 'Online' status and Unpublish button should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            let unpublishDialog = new ContentUnpublishDialog();
            let pageInspectionPanel = new PageInspectionPanel();
            let siteForm = new SiteForm();
            // 1. Open wizard for new site
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, null, [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            // 2. Fill  in the name and select an application
            await contentWizard.typeDisplayName(SITE.displayName);
            await siteForm.addApplications(SITE.data.applications);
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(SITE.data.controller);
            // 3. Click on Mark as ready  button
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Publish the site - click on 'Publish Now' button in the dialog:
            await contentPublishDialog.clickOnPublishNowButton();
            // 5. wait for 'PublishDialog' dialog is closed:
            await contentPublishDialog.waitForDialogClosed();
            await contentWizard.waitForNotificationMessage();
            // 6. click on 'Publish tree' button in the toolbar:
            await contentWizard.clickOnPublishTreeButton();
            await contentPublishDialog.waitForDialogOpened();
            // 7. Click on Publish now button in the modal dialog
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await contentWizard.waitForNotificationMessage();
            // 8. Verify the status in the toolbar:
            await contentWizard.waitForContentStatusInToolbar(appConst.CONTENT_STATUS.ONLINE)
            await contentWizard.waitForUnpublishButtonDisplayed();
            // 9. Click on Unpublish button
            await contentWizard.clickOnUnpublishButton();
            await unpublishDialog.waitForDialogOpened();
            await unpublishDialog.clickOnUnpublishButton();
            await confirmValueDialog.waitForDialogOpened();
            // 10. Fill in the input for required number of items:
            await confirmValueDialog.typeNumberOrName(2);
            // 11. Click on the Confirm button:
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            await contentWizard.waitForNotificationMessage();
            // 12 . Verify that the status is Offline  in the wizard
            await contentWizard.waitForContentStatusInToolbar(appConst.CONTENT_STATUS.OFFLINE);
            await contentWizard.waitForContentStatusInPreviewPanel(appConst.CONTENT_STATUS.UNPUBLISHED);
            // 13. Verify that PUBLISH button gets visible in 'Default Action'
            await contentWizard.waitForPublishButtonDisplayed();
            // 14. Verify that Save button is disabled:
            await contentWizard.waitForSaveButtonDisabled();
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
