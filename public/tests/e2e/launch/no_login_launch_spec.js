describe('Launch for unlogin user', function () {

    var launchPage = require('./launch_page.js');

    var mockModule;

    beforeEach(function(){
        mockModule = require('./no_login_launch_mock.js');
        browser.addMockModule('launchMock', mockModule.launchMock);
        browser.get('/#/testplan/100');
    });

    afterEach(function(){
        browser.removeMockModule('launchMock');
    });

    it('Edit and Delete buttons should be disabled for not login user', function(){
        launchPage.launchItemsList.click();
        element.all(by.id('launch-item-edit-button')).each(function(element) {
            expect(element.getAttribute('disabled')).toBe('true');
        });
        element.all(by.id('launch-item-delete-button')).each(function(element) {
            expect(element.getAttribute('disabled')).toBe('true');
        });
    });

    it('add new launch not allowed for not login user', function(){
        browser.get('/#/testplan/100/launch-item/add');
        launchPage.launchItemNameInput.sendKeys('NEW ITEM');
        launchPage.launchItemCommandInput.sendKeys('ECHO 1');
        launchPage.launchItemTimeoutInput.sendKeys('1200');
        launchPage.regularRadioButton.click();
        launchPage.addNewLaunchSubmit.click();
        expect(element(by.id('add-new-launch-login-fail')).getText()).toBe('Authentication fail');
    });

});