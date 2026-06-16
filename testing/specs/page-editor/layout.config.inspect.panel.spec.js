/**
 * Created on 24.01.2023  updated on 16.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const LayoutConfigInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.config.inspect.panel');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const LayoutInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');
const NotificationDialog = require('../../page_objects/notification.dialog');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('layout.config.inspect.panel.spec: tests for layout with config', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const MAIN_REGION = 'main';
    const OPTION_1_TXT = 'option 1';
    const OPTION_2_TXT = 'option 2';

    // Verify the bug - Duplicated items in PCV after updating a config in Inspect Panel #8359
    // https://github.com/enonic/app-contentstudio/issues/8359
    it("GIVEN layer component has been inserted WHEN changes has been saved in Inspect Panel THEN expected items should be displayed in PCV",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let layoutConfigInspectPanel = new LayoutConfigInspectPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let name = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(name, null, [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES]);
            // 1. Open site-wizard and save:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            // 2. Verify that the site should be saved automatically after selecting a controller
            let pageInspectionPanel = new PageInspectionPanel();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(appConst.CONTROLLER_NAME.MAIN_REGION);
            await contentWizard.waitForSaveButtonDisabled();
            // 3. Click on minimize-toggle, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            await pageComponentView.rightClickAndOpenContextMenu(MAIN_REGION);
            // 4. Insert the layout:
            await pageComponentView.selectContextMenuItem(['Insert', 'Layout']);
            await layoutInspectionPanel.typeNameAndSelectLayout(appConst.LAYOUT_NAME.CENTERED);
            // 5. Site should be saved automatically:
            await contentWizard.waitForNotificationMessage();
            // 6. Insert a text in the input in Config in Inspect Panel:
            await layoutConfigInspectPanel.typeTextInOption1TextInput(OPTION_1_TXT);
            // 7. Click on 'Apply' button in 'Inspect panel'
            await layoutConfigInspectPanel.clickOnApplyButton();
            // 10. Site should be saved after clicking on Apply:
            await contentWizard.waitForNotificationMessage();
            // 11. Verify that there are no duplicated items in PCV:(4 items should be displayed in PCV);
            let result = await pageComponentView.getPageComponentsDisplayName();
            await studioUtils.saveScreenshot('layout_config_inspect_panel');
            assert.ok(result.includes('main region'), 'main region item should be displayed in the modal dialog');
            assert.ok(result.includes('MAIN'), 'main item should be displayed in the modal dialog');
            assert.ok(result.includes('Centered'), 'text component should be displayed in the modal dialog');
            assert.ok(result.includes('CENTER'), 'the second text component should be displayed in the modal dialog');
            assert.equal(result.length, 4, "4 items should be displayed in PCV after deleting the layout item");
        });

    it("GIVEN layer component has been inserted WHEN selected option has been reset and Apply button pressed in 'Inspect Panel' THEN new changes should be applied in Inspect Panel",
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let pageComponentView = new PageComponentView();
            let layoutConfigInspectPanel = new LayoutConfigInspectPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let name = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(name, ' ', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES]);
            // 1. Open site-wizard and save:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            // 2. Verify that the site should be saved automatically after selecting a controller
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(appConst.CONTROLLER_NAME.APP_CONTENT_TYPES_PAGE);
            await contentWizard.waitForSaveButtonDisabled();
            // 3. Click on minimize-toggle, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            await pageComponentView.rightClickAndOpenContextMenu(MAIN_REGION);
            // 4. Insert the layout:
            await pageComponentView.selectContextMenuItem(['Insert', 'Layout']);
            await layoutInspectionPanel.typeNameAndSelectLayout('Centered');
            // 5. Site should be saved automatically:
            await contentWizard.waitForNotificationMessage();
            // 6. Close the notification message:
            await contentWizard.removeNotificationMessage();
            // 7. Layout Inspect panel should be loaded, insert a text in the input in Config:
            // 'option 1' should be selected in the option-set by default:  <default>true</default>
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
            let layoutConfigInspectPanel = new LayoutConfigInspectPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
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
            // 2. Click on minimize-toggle, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 3. Click on the Centered item in PCV:
            await pageComponentView.clickOnComponent('Centered');
            await layoutInspectionPanel.waitForOpened();
            // 4. Select 'Option 2' and insert another text:
            await layoutConfigInspectPanel.selectRadioOption('Option 2');
            await layoutConfigInspectPanel.typeTextInOption2TextInput(OPTION_2_TXT);
            await studioUtils.saveScreenshot('option_set_cfg_inspect_panel_1');
            // 5. Save button gets enabled after the changes in Inspect Panel
            await contentWizard.waitForSaveButtonEnabled();
            // 6. Click on 'Apply' in Inspect Panel
            await layoutConfigInspectPanel.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // 7. Just wait for until Layout Panel is reloaded:
            await layoutConfigInspectPanel.waitForOpened();
            await studioUtils.saveScreenshot('option_set_cfg_inspect_panel_2');
            // 8. Verify that changes is saved
            let result = await layoutConfigInspectPanel.getTextInOption2TextInput();
            assert.equal(result, OPTION_2_TXT, "'option 2' text should be displayed in the selected option");
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
