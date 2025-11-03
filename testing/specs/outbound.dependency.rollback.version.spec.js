/**
 * Created on 29.11.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const WizardContextPanel = require('../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');
const ImageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../libs/app_const');

describe('Check Outbound dependencies after rollback a version of content with image-selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const CONTENT_NAME = contentBuilder.generateRandomName('content');

    const IMAGE_DISPLAY_NAME1 = 'Pop_03';
    const IMAGE_DISPLAY_NAME2 = 'Pop_02';
    let SITE;

    it(`Precondition: new site should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
        });

    it(`Preconditions: content with image-selector with 2 different versions should be added`,
        async () => {
            let contentWizard = new ContentWizard();
            let imageSelectorForm = new ImageSelectorForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 1. select the first image
            await imageSelectorForm.filterOptionsSelectImageAndClickOnApply(IMAGE_DISPLAY_NAME1);
            // 2. Press on Save, the first version is saved(one image is selected)
            await contentWizard.waitAndClickOnSave();
            // 3. select the second image
            await imageSelectorForm.filterOptionsSelectImageAndClickOnApply(IMAGE_DISPLAY_NAME2);
            // 4. the second version is saved(2 images are selected)
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN outbound dependencies is opened in the new tab WHEN the previous version(one selected image) has been reverted THEN tab with outbound dependencies should be updated`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            // 1. Open existing content
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Open Dependency Widget
            await openWizardDependencyWidget();
            // 3. Click on Show Outbound button:
            await wizardDependenciesWidget.clickOnShowOutboundButton();
            // 4. Revert the version with single selected image:
            await rollbackVersion();
            await studioUtils.doSwitchToNextTab();
            // Verify that one image should be present in the grid:
            let displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
            await studioUtils.saveScreenshot('issue_outbound_should_be_updated');
            assert.equal(displayNames.length, 1, 'One image should be present in browse grid, after rollback the required version');
        });

    it("GIVEN existing image content(2:4) is opened(single image is selected) WHEN the version with 2 selected images has been reverted THEN the content gets valid",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Open existing image content(no selected images):
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Open Version widget
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED,1);
            // 3. revert the version with 2 selected image:
            await wizardVersionsWidget.clickOnRestoreButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSpinnerNotVisible();
            // 4. Verify that 2 selected images are present in the selector:
            let result = await imageSelectorForm.getSelectedImages();
            assert.equal(result.length, 2, 'two images should be present in the selected options');
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'The content should be valid after the reverting');
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

function openWizardDependencyWidget() {
    let contentWizard = new ContentWizard();
    let wizardDependenciesWidget = new WizardDependenciesWidget();
    let wizardContextPanel = new WizardContextPanel();
    return contentWizard.openContextWindow().then(() => {
        return wizardContextPanel.openDependenciesWidget();
    }).then(() => {
        return wizardDependenciesWidget.waitForWidgetLoaded();
    })
}

function rollbackVersion() {
    let wizardContextPanel = new WizardContextPanel();
    let wizardVersionsWidget = new WizardVersionsWidget();
    return wizardContextPanel.openVersionHistory().then(() => {
        return wizardVersionsWidget.waitForVersionsLoaded();
    }).then(() => {
        return wizardVersionsWidget.clickAndExpandVersion(1)
    }).then(() => {
        return wizardVersionsWidget.clickOnRestoreButton();
    });
}


