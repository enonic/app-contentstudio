/**
 * Created on 29.11.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget')
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
        let contentName = contentBuilder.generateRandomName('image-selector');

        it(`Precondition: new site should be added`,
            () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                return studioUtils.doAddSite(SITE).then(() => {
                }).then(() => {
                    return studioUtils.findAndSelectItem(SITE.displayName);
                }).then(() => {
                    return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
                }).then(isDisplayed => {
                    assert.isTrue(isDisplayed, 'site should be listed in the grid');
                });
            });

        it(`Preconditions: content with image-selector with 2 different versions should be added`,
            () => {
                let contentWizard = new ContentWizard();
                let imageSelectorForm = new ImageSelectorForm();
                return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4).then(() => {
                    return contentWizard.typeDisplayName(CONTENT_NAME);
                }).then(() => {
                    //select the first image
                    return imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    // first version is saved(one image is selected)
                    return contentWizard.waitAndClickOnSave();
                }).then(() => {
                    //select the second image
                    return imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME2);
                }).then(() => {
                    // second version is saved(2 images are selected)
                    return contentWizard.waitAndClickOnSave();
                })
            });
        it(`GIVEN existing content with 2 images is opened AND outbound dependencies is opened in the new tab WHEN version with one image has been rollback THEN tab with outbound dependencies should be updated `,
            () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                return studioUtils.selectAndOpenContentInWizard(CONTENT_NAME).then(() => {
                    return openWizardDependencyWidget();
                }).then(() => {
                    return wizardDependenciesWidget.clickOnShowOutboundButton();
                }).then(() => {
                    // rollback version with one selected image
                    return rollbackVersion();
                }).then(() => {
                    return studioUtils.doSwitchToNextTab();
                }).then(() => {
                    // one image should be present in the grid
                    return contentBrowsePanel.getDisplayNamesInGrid();
                }).then(result => {
                    studioUtils.saveScreenshot("outbound_should_be_updated");
                    assert.isTrue(result.length == 1, "One image should be present in browse grid, after rollback the required version");
                })
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


