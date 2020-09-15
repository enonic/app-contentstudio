/**
 * Created on 18.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const XPATH = {
    wizardStep: `//li[contains(@id,'TabBarItem')]/a[text()='Image selector']`,
    imageContentComboBox: `//div[contains(@id,'ImageContentComboBox')]`,
    flatOptionView: `//div[contains(@id,'ImageSelectorViewer')]`,
    modeTogglerButton: `//button[contains(@id,'ModeTogglerButton')]`,
    selectedOption: "//div[contains(@id,'ImageSelectorSelectedOptionView')]",
    selectedOptions: "//div[contains(@id,'ImageSelectorSelectedOptionsView')]",
    selectedImageByName: function (imageName) {
        return `//div[contains(@id,'ImageSelectorSelectedOptionView') and descendant::div[contains(@class,'label') and text()='${imageName}']]`
    },
    expanderIconByName: function (name) {
        return lib.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
};

class ImageSelectorForm extends Page {

    get imageComboBoxDrppdownHandle() {
        return XPATH.imageContentComboBox + lib.DROP_DOWN_HANDLE;
    }

    get modeTogglerButton() {
        return XPATH.imageContentComboBox + XPATH.modeTogglerButton;
    }

    get imagesOptionsFilterInput() {
        return lib.FORM_VIEW + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    type(contentData) {
        return this.selectImages(contentData.images);
    }

    async clickOnDropdownHandle() {
        try {
            await this.clickOnElement(this.imageComboBoxDrppdownHandle);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_img_sel_dropdown_handle');
            throw  new Error('image combobox dropdown handle not found ' + err);
        }
    }

    async clickOnModeTogglerButton() {
        await this.clickOnElement(this.modeTogglerButton);
        return await this.pause(1500);
    }

    getTreeModeOptionDisplayNames() {
        let options = lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(options);
    }

    getFlatModeOptionImageNames() {
        let titles = [];
        let imgSelector = XPATH.flatOptionView;
        return this.waitForElementDisplayed(imgSelector, appConst.mediumTimeout).then(() => {
            return this.findElements(imgSelector);
        }).then(result => {
            result.forEach(el => {
                titles.push(this.getBrowser().getElementAttribute(el.elementId, 'title'));
            });
            return Promise.all(titles).then(p => {
                return p;
            });
        });
    }

    selectImages(imgNames) {
        let result = Promise.resolve();
        imgNames.forEach(name => {
            result = result.then(() => this.filterOptionsAndSelectImage(name));
        });
        return result;
    }

    clickOnElements(elements, viewport) {
        let result = Promise.resolve();
        let i = 0;
        elements.forEach(el => {
            result = result.then(() => {
                return el.click();
            }).then(() => {
                return this.pause(500);
            }).then(() => {
                i++;
                if (i === 3) {
                    return this.doScroll(viewport, 180);
                }
            }).then(() => {
                return this.pause(500);
            });
        });
        return result;
    }

    async clickOnElements1(elements, viewport) {
        let i = 0;
        for (const item of elements) {
            await item.click();
            await this.pause(300);
            i++;
            if (i === 3) {
                await this.doScroll(viewport, 180);
            }
            await this.pause(300);
        }
    }

    async clickOnDropDownHandleAndSelectImages(numberImages) {
        await this.clickOnDropdownHandle();
        await this.pause(700);
        let selector = XPATH.imageContentComboBox + lib.SLICK_ROW + "//div[contains(@class,'checkboxsel')]";
        let elems = await this.findElements(selector);
        let viewportElement = await this.findElements(
            XPATH.imageContentComboBox + "//div[contains(@id,'OptionsTreeGrid')]" + "//div[contains(@class, 'slick-viewport')]");
        //Scrolls and clicks on options in the dropdown:
        await this.clickOnElements(elems.slice(0, numberImages), viewportElement[0]);
        await this.clickOnApplyButton();
        return await this.pause(1000);
    }

    //Scrolls viewport in dropdown:
    doScroll(viewportElement, step) {
        return this.getBrowser().execute("arguments[0].scrollTop=arguments[1]", viewportElement, step);
    }

    async clickOnApplyButton() {
        let selector = XPATH.imageContentComboBox + "//span[text()='Apply']";
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.clickOnElement(selector);
    }

    filterOptionsAndSelectImage(displayName) {
        let loaderComboBox = new LoaderComboBox();
        return this.typeTextInInput(this.imagesOptionsFilterInput, displayName).then(() => {
            return loaderComboBox.selectOption(displayName);
        });
    }

    async doFilterOptions(displayName) {
        await this.typeTextInInput(this.imagesOptionsFilterInput, displayName);
        return await this.pause(600);
    }

    waitForEmptyOptionsMessage() {
        return this.waitForElementDisplayed(`//div[contains(@class,'empty-options') and text()='No matching items']`,
            appConst.TIMEOUT_4).catch(err => {
            this.saveScreenshot("err_empty_options");
            return false;
        });
    }

    async clickOnExpanderIconInOptions(name) {
        let expanderIcon = XPATH.imageContentComboBox + XPATH.expanderIconByName(name);
        await this.clickOnElement(expanderIcon);
        return await this.pause(700);
    }
};
module.exports = ImageSelectorForm;