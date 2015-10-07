describe('Add new launch', function () {

    var launchPage = require('./launch_page.js');

    var mockModule;

    beforeEach(function(){
        mockModule = require('./launch_mock.js');
        browser.addMockModule('launchMock', mockModule.launchMock);
        browser.get('/#/testplan/100');
    });

    afterEach(function(){
        browser.removeMockModule('launchMock');
    });

    it('add new launch (regular) should send POST request and navigate to testplan page', function(){
        browser.get('/#/testplan/100/launch-item/add');
        launchPage.launchItemNameInput.sendKeys('NEW ITEM');
        launchPage.launchItemCommandInput.sendKeys('ECHO 1');
        launchPage.launchItemTimeoutInput.sendKeys('1200');
        launchPage.regularRadioButton.click();
        launchPage.addNewLaunchSubmit.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/100');
    });

    it('add new launch (conclusive) should send POST request and navigate to testplan page', function(){
        browser.get('/#/testplan/100/launch-item/add');
        launchPage.launchItemNameInput.sendKeys('NEW ITEM');
        launchPage.launchItemCommandInput.sendKeys('ECHO 1');
        launchPage.launchItemTimeoutInput.sendKeys('1200');
        launchPage.conclusiveRadioButton.click();
        launchPage.addNewLaunchSubmit.click();
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/testplan/100');
    });

});