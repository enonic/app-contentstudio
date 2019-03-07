/**
 * Created on 04.03.2019.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const pageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const liveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const imageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');


describe('wizard.image.fragment: changing of an image in image-fragment',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME1 = 'cape';
        let IMAGE_DISPLAY_NAME2 = 'man2';
        let SITE;
        let SUPPORT = 'Site';
        let CONTROLLER_NAME = 'main region';
        it(`Precondition: new site should be added`,
            () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
                return studioUtils.doAddSite(SITE).then(() => {
                }).then(() => {
                    return studioUtils.findAndSelectItem(SITE.displayName);
                }).then(() => {
                    return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
                }).then(isDisplayed => {
                    assert.isTrue(isDisplayed, 'site should be listed in the grid');
                });
            });

        it(`Precondition: image-fragment should be inserted in the site`,
            () => {
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    // opens 'Show Component View'
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.openMenu("main");
                }).then(() => {
                    return pageComponentView.selectMenuItem(["Insert", "Image"]);
                }).then(() => {
                    // insert the image
                    return liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    return contentWizard.switchToMainFrame();
                }).then(() => {
                    return pageComponentView.openMenu(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    // save the image as fragment
                    return pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
                });
            });

        //verifies the "https://github.com/enonic/app-contentstudio/issues/256"
        //"Save" button doesn't get disabled after saving any changes #256
        it(`GIVEN existing fragment is opened WHEN image has been changed and the fragment saved THEN Save button gets Saved`,
            () => {
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME1).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    //the image has been removed in 'inspection panel'
                    return imageInspectionPanel.clickOnRemoveIcon();
                }).pause(1000).then(() => {
                    // new image has been selected
                    return imageInspectionPanel.typeNameAndSelectImage(IMAGE_DISPLAY_NAME2);
                }).then(() => {
                    //clicks on 'Save' button
                    return contentWizard.waitAndClickOnSave();
                }).then(() => {
                    return assert.eventually.isTrue(contentWizard.waitForSavedButtonVisible(),
                        "`Saved` button should appears on the toolbar");
                })
            });

        //checks alert after clicking on Close icon(nothing was changed)
        it(`GIVEN existing fragment is opened AND Components View is opened WHEN image has been clicked in Components View  AND close browser tab has been clicked THEN Alert with warning about unsaved changes should not appear`,
            () => {
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME1).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    // just click on the image (nothing is changing)
                    return pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME2);
                }).then(() => {
                    //`Close tab` has been clicked
                    return contentWizard.doClickOnCloseInBrowser();
                }).then(() => {
                    return contentWizard.isAlertPresent();
                }).then(result => {
                    assert.isFalse(result, "Alert dialog should not be present, because nothing was changed!");
                })
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => {
            return contentWizard.isAlertPresent().then(result => {
                if (result) {
                    return contentWizard.alertAccept();
                }
            }).pause(500).then(() => {
                return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            })
        });
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
