/**
 * Created on 31.07.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('wizard.details.panel.spec: Open details panel in wizard and check the widgets', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN wizard for new folder is opened WHEN 'Version history' has been opened THEN one version item should be present in the widget`,
        async () => {
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            //1. Open new wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openDetailsPanel();
            //2. Version history widget should not be displayed by default!
            let isLoaded = await wizardVersionsWidget.isWidgetLoaded();
            assert.isFalse(isLoaded, "Versions Widget should not be displayed");
            //3. Click on dropdown handle and open Versions widget:
            await wizardDetailsPanel.openVersionHistory();
            await studioUtils.saveScreenshot("wizard_versions_widget");
            //4. Verify that "Versions Widget" should be loaded:
            await wizardVersionsWidget.waitForVersionsLoaded();

            let result = await wizardVersionsWidget.countVersionItems();
            assert.equal(result, 1, "One version item should be present in wizard for unnamed content");
        });

    it(`GIVEN wizard for new folder is opened WHEN 'Dependencies' menu item in 'Details panel' has been selected THEN 'Dependencies' widget should be loaded`,
        async () => {
            let wizardDetailsPanel = new WizardDetailsPanel();
            let contentWizard = new ContentWizard();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            //1. Open new wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openDetailsPanel();
            //2. Click on dropdown handle and select Dependencies menu item:
            await wizardDetailsPanel.openDependencies();
            await studioUtils.saveScreenshot("wizard_dependencies_widget");
            //3. Verify that "Dependencies Widget" should be loaded:
            await wizardDependenciesWidget.waitForWidgetLoaded();
            // 'No outgoing dependencies' should be displayed in the widget:
            await wizardDependenciesWidget.waitForNoOutgoingDependenciesMessage();
            // 'No incoming dependencies' should be displayed in the widget:
            await wizardDependenciesWidget.waitForNoIncomingDependenciesMessage();

            let result = await wizardDependenciesWidget.getContentName();
            assert.isTrue(result.includes("_unnamed"), "'Unnamed' should be displayed in the dependency widget in new wizard");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
