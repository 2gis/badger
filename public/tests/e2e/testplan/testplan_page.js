var TestplanPage = function() {

    this.actionsList = element(by.id('actions_list'));
    this.deleteButton = element(by.css('[ng-click="deleteTestPlan(testplan)"]'));
    this.updateButton = element(by.css('[ng-click="updateTestPlan(testplan)"]'));
    this.statisticFilter = element(by.model('testplan.filter'));
    this.showStatistics = element(by.model('testplan.main'));

};

module.exports = new TestplanPage();
