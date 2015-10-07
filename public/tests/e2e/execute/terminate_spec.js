describe('Execute launch', function () {

    var mockModule;

    beforeEach(function(){
        mockModule = require('./terminate_mock.js');
        browser.addMockModule('executeMock', mockModule.executeMock);
    });

    afterEach(function(){
        browser.removeMockModule('executeMock');
    });

    it('terminate button presence on not finished launches', function() {
        browser.get('/#/launch/2222');
        var terminate = element(by.css('[ng-click="terminateLaunchTasks(launch.id)"]'));
        terminate.click();
        expect(terminate.getAttribute('disabled')).toBe('true');
        expect(element(by.className('alert-danger')).isDisplayed()).toBe(true);
        expect(terminate.isDisplayed()).toBe(false);
    });

});