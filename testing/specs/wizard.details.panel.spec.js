/**
 * Created on 31.07.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');
const WizardContextPanel = require('../page_objects/wizardpanel/details/wizard.context.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('wizard.details.panel.spec: Open details panel in wizard and check the widgets', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN wizard for new folder is opened WHEN 'Version history' has been opened THEN one version item should be present in the widget`,
        async () => {
            let wizardContextPanel = new WizardContextPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openContextWindow();
            await wizardContextPanel.openDetailsWidget();
            // 2. Version history widget should not be displayed by default!
            let isLoaded = await wizardVersionsWidget.isWidgetLoaded();
            assert.ok(isLoaded === false, `'Versions Widget' should not be displayed`);
            // 3. Filter 'Versions history' option item then click on OK:
            await wizardContextPanel.filterAndOpenVersionHistory();
            await studioUtils.saveScreenshot('wizard_versions_widget');
            // 4. Verify that "Versions Widget" should be loaded:
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 5. One version item should be present in the widget:
            let result = await wizardVersionsWidget.countVersionItems();
            assert.equal(result, 1, 'One version item should be present in wizard for unnamed content');
        });

    it(`GIVEN wizard for new folder is opened WHEN 'Dependencies' menu item in 'Details panel' has been selected THEN 'Dependencies' widget should be loaded`,
        async () => {
            let wizardContextPanel = new WizardContextPanel();
            let contentWizard = new ContentWizard();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            // 1. Open new wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openContextWindow();
            // 2. Click on dropdown handle and select Dependencies menu item:
            await wizardContextPanel.openDependencies();
            await studioUtils.saveScreenshot("wizard_dependencies_widget");
            // 3. Verify that "Dependencies Widget" should be loaded:
            await wizardDependenciesWidget.waitForWidgetLoaded();
            // 'No outgoing dependencies' should be displayed in the widget:
            await wizardDependenciesWidget.waitForNoOutgoingDependenciesMessage();
            // 'No incoming dependencies' should be displayed in the widget:
            await wizardDependenciesWidget.waitForNoIncomingDependenciesMessage();

            let result = await wizardDependenciesWidget.getContentName();
            assert.ok(result.includes("_unnamed"), "'Unnamed' should be displayed in the dependency widget in new wizard");
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
