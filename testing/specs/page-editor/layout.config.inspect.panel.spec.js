/**
 * Created on 24.01.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const LayoutConfigInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.config.inspect.panel');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const LayoutInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');
const NotificationDialog = require('../../page_objects/notification.dialog');

describe('layout.config.inspect.panel.spec: tests for layout with config', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const MAIN_REGION = 'main';
    const OPTION_1_TXT = 'option 1';
    const OPTION_2_TXT = 'option 2';

    it("GIVEN layer component has been inserted WHEN selected option has been reset and Apply button pressed in 'Inspect Panel' THEN new changes should be applied in Inspect Panel",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let layoutConfigInspectPanel = new LayoutConfigInspectPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let name = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(name, ' ', [appConst.TEST_APPS_NAME.APP_WITH_METADATA_MIXIN]);
            // 1. Open site-wizard and save:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            // 2. Verify that the site should be saved automatically after selecting a controller
            await contentWizard.selectPageDescriptor(appConst.CONTROLLER_NAME.DEFAULT);
            await contentWizard.waitForSaveButtonDisabled();
            // 3. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu(MAIN_REGION);
            // 4. Insert the layout:
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await layoutInspectionPanel.typeNameAndSelectLayout('Centered');
            // 5. Site should be saved automatically:
            await contentWizard.waitForNotificationMessage();
            // 6. Close the notification message:
            await contentWizard.removeNotificationMessage();
            // 7. Layout Inspect panel should be loaded, insert a text in the input in Config:
            await layoutConfigInspectPanel.typeTextInOption1TextInput(OPTION_1_TXT);
            // 8. Verify - Save button gets enabled after the changes in Inspect Panel
            await contentWizard.waitForSaveButtonEnabled();
            // 9. Click on 'Apply' button in 'Inspect panel'
            await layoutConfigInspectPanel.clickOnApplyButton();
            // 10. Site should be saved after clicking on Apply:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 11. Just wait for until Layout Panel reloaded:
            await layoutConfigInspectPanel.waitForOpened();
        });

    it("WHEN layout item has been clicked in PCV THEN Expected text should be displayed in Option Set in Inspect Panel (layout-config)",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let notificationDialog = new NotificationDialog();
            let layoutConfigInspectPanel = new LayoutConfigInspectPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Click on the 'Centered' item in PCV:
            await pageComponentView.clickOnComponent('Centered');
            await layoutInspectionPanel.waitForOpened();
            // 4. Verify the saved text in the option set in layout-config
            let actualText = await layoutConfigInspectPanel.getTextInOption1TextInput();
            await studioUtils.saveScreenshot('option_set_cfg_inspect_panel_saved_text');
            assert.equal(actualText, OPTION_1_TXT, "Expected text should be displayed in Option Set in Inspect Panel")
        });

    // Verifies Page component config doesn't catch changes in option-set #5765
    it("GIVEN layout item has been clicked in PCV WHEN selected option has been reset and 'Apply' button pressed in 'Inspect Panel' THEN new changes should be applied in Inspect Panel",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let notificationDialog = new NotificationDialog();
            let layoutConfigInspectPanel = new LayoutConfigInspectPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Click on the Centered item in PCV:
            await pageComponentView.clickOnComponent('Centered');
            await layoutInspectionPanel.waitForOpened();
            // 4. Expand the menu and click on 'Reset' menu item
            await layoutConfigInspectPanel.resetSelectedOption();
            // 5. Notification dialog should be loaded, click on OK
            await notificationDialog.waitForDialogLoaded();
            await notificationDialog.clickOnOkButton();
            await notificationDialog.waitForDialogClosed();
            await layoutConfigInspectPanel.pause(2000);
            // 6. Select 'Option 2' and insert another text:
            await layoutConfigInspectPanel.selectOption('Option 2');
            await layoutConfigInspectPanel.typeTextInOption2TextInput(OPTION_2_TXT);
            await studioUtils.saveScreenshot('option_set_cfg_inspect_panel_1');
            // 7. Save button gets enabled after the changes in Inspect Panel
            await contentWizard.waitForSaveButtonEnabled();
            // 8. Click on 'Apply' in Inspect Panel
            await layoutConfigInspectPanel.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // 9. Just wait for until Layout Panel is reloaded:
            await layoutConfigInspectPanel.waitForOpened();
            await studioUtils.saveScreenshot('option_set_cfg_inspect_panel_2');
            // 10. Verify that changes is saved
            let result = await layoutConfigInspectPanel.getTextInOption2TextInput();
            assert.equal(result, OPTION_2_TXT, "'option 2' text should be displayed in the selected option");
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
