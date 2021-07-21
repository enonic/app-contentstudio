/**
 * Created on 20.07.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const EmulatorWidget = require('../../page_objects/wizardpanel/details/emulator.widget');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');

describe('emulator.widget.spec: tests for emulator widget', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let CONTROLLER_NAME = 'main region';

    it(`GIVEN wizard for new site is opened WHEN page controller has been selected THEN 'Emulator' menu item appears in WidgetSelector dropdown`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            //1. Open wizard for new site:
            await studioUtils.openContentWizard(appConstant.contentTypes.SITE);
            await contentWizard.typeDisplayName(displayName);
            //2. Select an application
            await siteFormPanel.filterOptionsAndSelectApplication(appConstant.APP_CONTENT_TYPES);
            await contentWizard.waitForNotificationMessage();
            //3. Click on Widget Selector dropdown handler:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            //4. Verify that Emulator and Components options are not present before selecting a controller:
            let actualOptions1 = await wizardDetailsPanel.getWidgetSelectorDropdownOptions();
            assert.isFalse(actualOptions1.includes('Emulator'));
            assert.isFalse(actualOptions1.includes('Components'));
            //5. Select a controller:
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            //6. Verify that 'Emulator' and 'Components' options get visible in options after selecting a controller:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            let actualOptions2 = await wizardDetailsPanel.getWidgetSelectorDropdownOptions();
            assert.isTrue(actualOptions2.includes('Emulator'));
            assert.isTrue(actualOptions2.includes('Components'));
        });

    it(`GIVEN wizard for new site is opened WHEN Emulator widget has been opened THEN expected resolutions should be present in the widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            //1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            //2. Expand the dropdown and verify all available resolutions::
            let actualResolutions = await emulatorWidget.getResolutions();
            assert.equal(actualResolutions.length, 8, "8 resolutions should be present in the widget");
        });

    it(`GIVEN existing site is opened WHEN 'Medium Phone' resolution has been clicked THEN Page Editor size gets 375x667px`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            //1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            //2.'Medium Phone' resolution has been clicked
            await emulatorWidget.clickOnResolution(appConstant.EMULATOR_RESOLUTION.MEDIUM_PHONE);
            //3. Verify actual width and height:
            let actualWidth = await contentWizard.getPageEditorWidth();
            assert.equal(actualWidth, "375px", "Expected width of Page Editor is present");
            let actualHeight = await contentWizard.getPageEditorHeight();
            assert.equal(actualHeight, "667px", "Expected height of Page Editor is present");
        });

    it(`GIVEN wizard for new site is opened WHEN 'Notebook 13' resolution has been clicked THEN Page Editor size gets 1280x800px`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            //1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            //2. 'Notebook 13' resolution has been clicked
            await emulatorWidget.clickOnResolution(appConstant.EMULATOR_RESOLUTION.NOTEBOOK_13);
            //3. Verify actual width and height:
            let actualWidth = await contentWizard.getPageEditorWidth();
            assert.equal(actualWidth, "1280px", "Expected width of Page Editor is present");
            let actualHeight = await contentWizard.getPageEditorHeight();
            assert.equal(actualHeight, "800px", "Expected height of Page Editor is present");
        });

    it(`GIVEN wizard for new site is opened WHEN 'Notebook 15' resolution has been clicked THEN Page Editor size gets 1366x758px`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            //1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await wizardDetailsPanel.openEmulatorWidget();
            //2.'Notebook 15' resolution has been clicked
            await emulatorWidget.clickOnResolution(appConstant.EMULATOR_RESOLUTION.NOTEBOOK_15);
            //3. Verify actual width and height:
            let actualWidth = await contentWizard.getPageEditorWidth();
            assert.equal(actualWidth, "1366px", "Expected width of Page Editor is present");
            let actualHeight = await contentWizard.getPageEditorHeight();
            assert.equal(actualHeight, "768px", "Expected height of Page Editor is present");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
