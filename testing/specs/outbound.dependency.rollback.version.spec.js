/**
 * Created on 29.11.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');
const ImageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');

describe('Check Outbound dependencies after rollback a version of content with image-selector',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let CONTENT_NAME = contentBuilder.generateRandomName('content');

        let IMAGE_DISPLAY_NAME1 = "Pop_03";
        let IMAGE_DISPLAY_NAME2 = "Pop_02";
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
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
                await contentWizard.typeDisplayName(CONTENT_NAME);
                //select the first image
                await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME1);
                // first version is saved(one image is selected)
                await contentWizard.waitAndClickOnSave();
                //select the second image
                await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME2);
                // the second version is saved(2 images are selected)
                await contentWizard.waitAndClickOnSave();
            });

        it(`GIVEN outbound dependencies is opened in the new tab WHEN the previous version(one selected image) has been reverted THEN tab with outbound dependencies should be updated`,
            async () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                //1. Open existing content
                await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
                //2. Open Dependency Widget
                await openWizardDependencyWidget();
                //3. Click on Show Outbound button:
                await wizardDependenciesWidget.clickOnShowOutboundButton();
                //4. Revert the version with one selected image:
                await rollbackVersion();
                await studioUtils.doSwitchToNextTab();
                //Verify that one image should be present in the grid:
                let displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
                studioUtils.saveScreenshot("outbound_should_be_updated");
                assert.equal(displayNames.length, 1, "One image should be present in browse grid, after rollback the required version");
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });

function openWizardDependencyWidget() {
    let contentWizard = new ContentWizard();
    let wizardDependenciesWidget = new WizardDependenciesWidget();
    let wizardDetailsPanel = new WizardDetailsPanel();
    return contentWizard.openDetailsPanel().then(() => {
        return wizardDetailsPanel.openDependencies();
    }).then(() => {
        return wizardDependenciesWidget.waitForWidgetLoaded();
    })
}

function rollbackVersion() {
    let wizardDetailsPanel = new WizardDetailsPanel();
    let wizardVersionsWidget = new WizardVersionsWidget();
    return wizardDetailsPanel.openVersionHistory().then(() => {
        return wizardVersionsWidget.waitForVersionsLoaded();
    }).then(() => {
        return wizardVersionsWidget.clickAndExpandVersion(1)
    }).then(() => {
        return wizardVersionsWidget.clickOnRevertButton();
    });
}


