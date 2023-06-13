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

describe('layout.config.inspect.panel.spec: tests for layout with aconfig', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const MAIN_REGION = 'main';
    const OPTION_1_TXT = 'option 1';
    const OPTION_2_TXT = 'option 2';

    // Verifies Page component config doesn't catch changes in option-set #5765
    it("GIVEN layer component has been inserted WHEN selected option has been reset and Apply button pressed in 'Inspect Panel' THEN new changes should be applied in Inspect Panel",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let notificationDialog = new NotificationDialog();
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
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await layoutInspectionPanel.typeNameAndSelectLayout('Centered');
            await pageComponentView.pause(500);
            // 4. Layout Inspect panel should be loaded, insert a text:
            await layoutConfigInspectPanel.typeTextInOption1TextInput(OPTION_1_TXT);
            // 5. Click on Apply button in Inspect panel
            await layoutConfigInspectPanel.clickOnApplyButton();
            // 6. Site should be saved after clicking on Apply:
            await contentWizard.waitForNotificationMessage();
            // 7. Just wait for until Layout Panel reloaded:
            await layoutConfigInspectPanel.waitForOpened();
            // 8. Expand the menu and reset the selected 'option 1'
            await layoutConfigInspectPanel.resetSelectedOption();
            // 9. Notification dialog should be loaded, click on OK
            await notificationDialog.waitForDialogLoaded();
            await notificationDialog.clickOnOkButton();
            await notificationDialog.waitForDialogClosed();
            await layoutConfigInspectPanel.pause(2000);
            // 10. Select 'Option 2' and insert another text:
            await layoutConfigInspectPanel.selectOption('Option 2');
            await layoutConfigInspectPanel.typeTextInOption2TextInput(OPTION_2_TXT);
            await studioUtils.saveScreenshot('option_set_cfg_inspect_panel_1');
            // 11. Click on 'Apply'
            await layoutConfigInspectPanel.clickOnApplyButton();
            // 12. Just wait for until Layout Panel is reloaded:
            await layoutConfigInspectPanel.waitForOpened();
            await studioUtils.saveScreenshot('option_set_cfg_inspect_panel_2');
            // 13. Verify that changes is saved
            let result = await layoutConfigInspectPanel.getTextInOption2TextInput();
            assert.equal(result, OPTION_2_TXT, " 'option 2' text should be displayed in the selected option");
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
