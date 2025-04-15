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

describe('Tests for site configurator modal dialog with multi-selection Option Set', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_WITH_CONFIG_OPTION_SET]);
            await studioUtils.doAddSite(SITE, true);
        });

    // Verifies: Default options in option-set don't get selected in site configurator #4629
    // https://github.com/enonic/app-contentstudio/issues/4629
    it(`GIVEN site configurator dialog is opened WHEN the default selected option has been clicked and Apply button has been pressed THEN all options are unselected after reopening the dialog`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorWithOptionSetDialog();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Open Site Configurator:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.TEST_APPS_NAME.APP_WITH_CONFIG_OPTION_SET);
            await studioUtils.saveScreenshot('site_cfg_option2_selected_default');
            // 3. Verify that 'Option 2' is selected by default:
            let result = await siteConfiguratorDialog.isCheckboxSelected('Option 2');
            assert.ok(result, 'Option 2 option should be selected');
            // 4. Unselect the 'Option 2' then Apply it:
            await siteConfiguratorDialog.clickOnOption('Option 2');
            await siteConfiguratorDialog.clickOnApplyButton();
            await siteConfiguratorDialog.waitForDialogClosed();
            await siteFormPanel.pause(500);
            // 5. Reopen the site configurator modal dialog:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.TEST_APPS_NAME.APP_WITH_CONFIG_OPTION_SET);
            await studioUtils.saveScreenshot('site_cfg_option2_unselected_reopened');
            // 6. Verify that 'Option 2' is unselected:
            result = await siteConfiguratorDialog.isCheckboxSelected('Option 2');
            assert.ok(result === false, 'Option 2 option should be not selected');
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
