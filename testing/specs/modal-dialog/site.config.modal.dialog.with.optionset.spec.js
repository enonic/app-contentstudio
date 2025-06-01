/**
 * Created on 19.10.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorWithOptionSetDialog = require('../../page_objects/wizardpanel/site_configurator/site.config.with.optionset.dialog');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SiteConfiguratorDialog = require('../../page_objects/wizardpanel/site_configurator/site.config.with.optionset.dialog');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('Tests for site configurator modal dialog with multi-selection Option Set', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.MY_FIRST_APP]);
            await studioUtils.doAddSite(SITE);
        });

    // Verifies: Default options in option-set don't get selected in site configurator #4629
    // https://github.com/enonic/app-contentstudio/issues/4629
    it(`GIVEN site configurator dialog is opened WHEN the checkbox(Option 2) that is checked by default has been unchecked and Apply button has been pressed THEN all options should be unchecked after reopening the dialog`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfigOptionSet = new SiteConfiguratorWithOptionSetDialog();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Open Site Configurator:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.TEST_APPS_NAME.MY_FIRST_APP);
            await studioUtils.saveScreenshot('site_cfg_option2_selected_default');
            // 3. Verify that checkbox 'Option 2' is checked by default:
            let result = await siteConfigOptionSet.isCheckboxSelected('Option 2');
            assert.ok(result, 'Option 2 option should be selected');
            // 4. Uncheck the 'Option 2' then Apply it:
            await siteConfigOptionSet.clickOnOption('Option 2');
            await siteConfigOptionSet.clickOnApplyButton();
            await siteConfigOptionSet.waitForDialogClosed();
            await siteFormPanel.pause(500);
            // 5. Reopen the site configurator modal dialog:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.TEST_APPS_NAME.MY_FIRST_APP);
            await studioUtils.saveScreenshot('site_cfg_option2_unselected_reopened');
            // 6. Verify that 'Option 2' is unchecked:
            result = await siteConfigOptionSet.isCheckboxSelected('Option 2');
            assert.ok(result === false, 'Option 2 option should not be checked');
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/5710
    // Content is not reset from Ready to In progress when controller is selected
    it("GIVEN site is ready for publishing WHEN site config has been updated THEN the site's status gets 'Work in progress'",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnMarkAsReadyButton();
            let contentPublishDialog = new ContentPublishDialog();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // 2. Open Site Configurator:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.TEST_APPS_NAME.MY_FIRST_APP);
            // 3. select the 'Option 3' then Apply it:
            await siteConfiguratorDialog.clickOnOption('Option 3');
            await siteConfiguratorDialog.clickOnApplyButton();
            await siteConfiguratorDialog.waitForDialogClosed();
            // 4. Verify that Notification message appears:
            await contentWizard.waitForNotificationMessage();
            // 5. Verify that 'MARK AS READY' button gets visible in the wizard-toolbar
            await contentWizard.waitForMarkAsReadyButtonVisible();
            // 6. Verify that 'Save' button is disabled:
            await contentWizard.waitForSaveButtonDisabled();
            await studioUtils.saveScreenshot('site_cfg_updated_workflow');
            // 7. Workflow status should be 'Work in progress':
            let workflow = await contentWizard.getContentWorkflowState();
            assert.equal(workflow, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS, "the site's status should be 'Work in progress'");
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
