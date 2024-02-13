/**
 * Created on 17.07.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const InsertablesPanel = require('../../page_objects/wizardpanel/liveform/insertables.panel');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const appConst = require('../../libs/app_const');

describe('context.window.insert.panel: tests for insertables panel and wizard toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTROLLER_NAME = 'main region';

    it(`GIVEN wizard for new site is opened WHEN 2 applications haven checked in the app-dropdown AND 'Apply' button has been pressed THEN the site should be automatically saved`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let displayName = contentBuilder.generateRandomName('site');
            // 1. Open wizard for new site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(displayName);
            // 2. Expand the applications-dropdown:
            await siteFormPanel.clickOnDropdownHandle();
            // 3. Select 2 checkboxes in the dropdown:
            await siteFormPanel.clickOnCheckboxInDropdown(0);
            await siteFormPanel.clickOnCheckboxInDropdown(1);
            await studioUtils.saveScreenshot('site_2_apps_checked');
            // 4. Click on 'OK' and apply selections:
            await siteFormPanel.clickOnApplySelectionButtonInApplications();
            await studioUtils.saveScreenshot('site_2_apps_applied');
            // 5. Verify that site is automatically saved:
            await contentWizard.waitForNotificationMessage();
            // 6. Verify the selected applications in site wizard:
            let apps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(apps.length, 2, '2 selected application should be displayed in the form');
        });

    it(`GIVEN wizard for new site is opened WHEN page controller has been selected THEN 'Page Component' wizard step form gets visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            // 1. type a name:
            await contentWizard.typeDisplayName(displayName);
            await siteFormPanel.filterOptionsAndSelectApplication(appConst.APP_CONTENT_TYPES);
            // 2. Application is selected so the site should be automatically saved:
            await contentWizard.waitForNotificationMessage();
            // 3. Verify that 'Page Component' wizard step form is not visible, because page controller is not selected:
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            // 4. Select a page descriptor:
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            // 5.  Verify that 'Page Component' wizard step form gets visible in the wizard panel:
            await pageComponentsWizardStepForm.waitForLoaded();
            // 6. Verify that 'Page' wizard step is displayed in  Wizard Step Toolbar:
            await contentWizard.waitForWizardStepDisplayed('Page');
        });

    it("WHEN existing site is opened THEN 'Insertables' panel should be loaded AND all expected components should be present",
        async () => {
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            let insertablesPanel = new InsertablesPanel();
            // 1. Verify that Insertables Panel is loaded automatically:
            await insertablesPanel.waitForOpened();
            // 2. Verify items in the panel:
            let items = await insertablesPanel.getItems();
            assert.equal(items.length, 4, 'Four items should be present in the panel');
            assert.ok(items.includes('Part'), "'Part' item should be displayed");
            assert.ok(items.includes('Layout'), "'Layout' item should be displayed");
            assert.ok(items.includes('Rich Text Editor'), "'Rich Text Editor' item should be displayed");
            assert.ok(items.includes('Fragment'), "'Fragment' item should be displayed");
        });

    // verifies the xp#5580 Site Wizard - endless spinner appears when Show-Hide button was pressed in the second time
    it("GIVEN existing site is opened WHEN 'Hide Page Editor' button has been clicked THEN 'Live Editor' gets not visible",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 1. Click on 'Hide Page Editor' button
            await contentWizard.clickOnPageEditorToggler();
            await studioUtils.saveScreenshot('live_edit_hidden');
            // 2. Verify that minimize toggler gets not visible in Wizard Step Toolbar:
            await contentWizard.waitForMinimizeLiveEditTogglerNotDisplayed();
            // 3. Live Edit should not be visible now:
            await contentWizard.waitForLiveEditNotVisible();
            // 4. Click on 'Show Page Editor' button
            await contentWizard.clickOnPageEditorToggler();
            await studioUtils.saveScreenshot('live_edit_shown');
            await contentWizard.waitForSpinnerNotVisible(appConst.mediumTimeout);
            // 5. Minimize icon gets visible again in Wizard Step Toolbar
            await contentWizard.waitForMinimizeLiveEditTogglerDisplayed();
            // 6. 'Live Edit' should be visible again
            await contentWizard.waitForLiveEditVisible();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/335
    // Site Wizard Context panel - versions widget closes after rollback a version
    it(`GIVEN existing site is opened AND Versions widget is opened WHEN rollback a version THEN Versions widget should not be closed`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Open Versions widget:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Expand the version item and click on Revert:
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRevertButton();
            // 4. Verify  the notification message:
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.ok(actualMessage.includes(appConst.NOTIFICATION_MESSAGES.CONTENT_REVERTED),
                'Expected notification message should appear');
            // 5. Verify that widget is displayed :
            let isDisplayed = await wizardVersionsWidget.isWidgetLoaded();
            assert.ok(isDisplayed, "'Versions widget' remains visible in 'Details Panel' after reverting versions");
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
