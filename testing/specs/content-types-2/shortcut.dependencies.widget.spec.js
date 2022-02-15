/**
 * Created on 14.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');

describe("tests for 'Show Outbound' button in shortcut wizard", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const TARGET_FOLDER = appConst.TEST_FOLDER_WITH_IMAGES_NAME
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');
    const FOLDER_NAME = appConst.generateRandomName("folder");


    it(`Preconditions: create a folder`,
        async () => {
            let folder = contentBuilder.buildFolder(FOLDER_NAME);
            await studioUtils.doAddFolder(folder);
        });
    it(`GIVEN shortcut with a folder in the target is saved WHEN 'Show outbound' button has been clicked THEN the folder should be filtered in the new browser tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            //1. Fill in  the name input, select a target and save the shortcut:
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            await shortcutForm.filterOptionsAndSelectTarget(FOLDER_NAME);
            await contentWizard.waitAndClickOnSave();
            //2. Open Dependencies widget:
            await contentWizard.openDependenciesWidget();
            //3. Verify that 'No incoming dependencies' is displayed:
            await wizardDependenciesWidget.waitForNoIncomingDependenciesMessage();
            //4. Click on 'Show Outbound' button:
            await wizardDependenciesWidget.waitForOutboundButtonVisible();
            await wizardDependenciesWidget.clickOnShowOutboundButton();
            //5. Switch to the new browser tab:
            await studioUtils.doSwitchToNextTab();

            let contentBrowsePanel = new ContentBrowsePanel();
            let contentFilterPanel = new ContentFilterPanel();
            //6. Verify: 'Dependencies Section' should be loaded, in the filter panel'
            await contentFilterPanel.waitForDependenciesSectionVisible();
            //Close 'Dependencies Section'  should be displayed:
            await contentFilterPanel.waitForCloseDependenciesSectionButtonDisplayed();
            await studioUtils.saveScreenshot('shortcut_dependency_filtered');
            //7. Single content should be filtered in the browse panel:
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            //8. Verify the name of filtered content:
            assert.equal(result[0], FOLDER_NAME, 'expected display name of dependency');
            assert.equal(result.length, 1, 'One content should be present in the grid');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
