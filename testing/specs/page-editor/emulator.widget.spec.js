/**
 * Created on 20.07.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const EmulatorWidget = require('../../page_objects/wizardpanel/details/emulator.widget');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const appConst = require('../../libs/app_const');

describe('emulator.widget.spec: tests for emulator widget', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = 'main region';

    it.skip(
        `GIVEN wizard for new site is opened WHEN page controller has been selected THEN 'Emulator' menu item appears in WidgetSelector dropdown`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            // 1. Open wizard for new site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(displayName);
            // 2. Select an application
            await siteFormPanel.filterOptionsAndSelectApplication(appConst.APP_CONTENT_TYPES);
            await contentWizard.waitForNotificationMessage();
            // 3. Click on Widget Selector dropdown handler:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            // 4. Verify that Emulator and Components options are not present before selecting a controller:
            let actualOptions1 = await wizardDetailsPanel.getWidgetSelectorDropdownOptions();
            assert.ok(actualOptions1.includes('Emulator') === false, "'Emulator' option should not be displayed in the dropdown");
            assert.ok(actualOptions1.includes('Components') === false, "'Components' option should not be displayed in the dropdown");
            // 5. Select a controller:
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            // 6. Verify that 'Emulator' and 'Components' options get visible in options after selecting a controller:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            await studioUtils.saveScreenshot('emulator_widget_menu_1');
            let actualOptions2 = await wizardDetailsPanel.getWidgetSelectorDropdownOptions();
            assert.ok(actualOptions2.includes('Components'), "'Components' option should be displayed in the dropdown");
        });

    it.skip(
        `GIVEN wizard for new site is opened WHEN Emulator widget has been opened THEN expected resolutions should be present in the widget`,
        async () => {
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            await studioUtils.saveScreenshot('emulator_widget_menu_2');
            // 2. Expand the dropdown and verify all available resolutions::
            let actualResolutions = await emulatorWidget.getResolutions();
            assert.equal(actualResolutions.length, 8, '8 resolutions should be present in the widget');
        });

    it.skip(`GIVEN existing site is opened WHEN 'Medium Phone' resolution has been clicked THEN Page Editor size gets 375x667px`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            await studioUtils.saveScreenshot('emulator_widget_menu_3');
            // 2.'Medium Phone' resolution has been clicked
            await emulatorWidget.clickOnResolution(appConst.EMULATOR_RESOLUTION.MEDIUM_PHONE);
            // 3. Verify actual width and height:
            let actualWidth = await contentWizard.getPageEditorWidth();
            assert.equal(actualWidth, '375px', "Expected width of 'Page Editor' is present");
            let actualHeight = await contentWizard.getPageEditorHeight();
            assert.equal(actualHeight, '667px', "Expected height of 'Page Editor' is present");
        });

    it.skip(`GIVEN existing site is opened WHEN 'Notebook 13' resolution has been clicked THEN Page Editor size gets 1280x800px`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            // 2. 'Notebook 13' resolution has been clicked
            await emulatorWidget.clickOnResolution(appConst.EMULATOR_RESOLUTION.NOTEBOOK_13);
            // 3. Verify actual width and height:
            let actualWidth = await contentWizard.getPageEditorWidth();
            assert.equal(actualWidth, '1280px', 'Expected width of Page Editor is present');
            let actualHeight = await contentWizard.getPageEditorHeight();
            assert.equal(actualHeight, '800px', 'Expected height of Page Editor is present');
        });

    it.skip(`GIVEN existing site is opened WHEN 'Notebook 15' resolution has been clicked THEN Page Editor size gets 1366x758px`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            // 2.'Notebook 15' resolution has been clicked
            await emulatorWidget.clickOnResolution(appConst.EMULATOR_RESOLUTION.NOTEBOOK_15);
            // 3. Verify actual width and height:
            let actualWidth = await contentWizard.getPageEditorWidth();
            assert.equal(actualWidth, '1366px', 'Expected width of Page Editor is present');
            let actualHeight = await contentWizard.getPageEditorHeight();
            assert.equal(actualHeight, '768px', 'Expected height of Page Editor is present');
        });

    // Verify Two items are selected in Widget selector #7897
    // https://github.com/enonic/app-contentstudio/issues/7897
    it.skip(
        `GIVEN existing site is opened WHEN WidgetSelector dropdown has been expanded THEN the only one item is selected in the options list (Components)`,
        async () => {
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on Widget selector dropdown handle and expand the ListBox:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            // 3. Verify that the only one item is selected in the options list
            let items = await wizardDetailsPanel.getSelectedOptionsDisplayName();
            assert.equal(items.length, 1, 'The only one item should be selected in the ListBox');
            assert.equal(items[0], 'Components', "'Components' option item should be selected in the ListBox");
        });

    // Verify Two items are selected in Widget selector #7897
    // https://github.com/enonic/app-contentstudio/issues/7897
    it.skip(
        `GIVEN Select 'Emulator' option in the widget selector WHEN ListBox has been expanded THEN 'Emulator' option item should be selected in the ListBox options`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Select Emulator option in the widget selector
            await wizardDetailsPanel.openEmulatorWidget();
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            // 3. Verify that the only one item is selected in the options list
            let items = await wizardDetailsPanel.getSelectedOptionsDisplayName();
            assert.equal(items.length, 1, 'The only one item should be selected in the ListBox');
            assert.equal(items[0], 'Emulator', "'Emulator' option item should be selected in the ListBox");
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
