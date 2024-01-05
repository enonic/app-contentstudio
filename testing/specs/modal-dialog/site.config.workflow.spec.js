/**
 * Created on 13.01.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../../page_objects/wizardpanel/site_configurator/site.config.with.optionset.dialog');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('Tests for workflow status for a site with configurator', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    it(`Precondition: ready for publishing site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_WITH_CONFIG_OPTION_SET]);
            await studioUtils.doAddReadySite(SITE);
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
            // 2. Open Site Configurator:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.TEST_APPS_NAME.APP_WITH_CONFIG_OPTION_SET);
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
            await studioUtils.saveScreenshot("site_cfg_updated_workflow");
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