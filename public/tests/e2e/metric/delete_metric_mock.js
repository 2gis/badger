module.exports.deleteMetricMock = function () {

    var profile = {
        id: 1,
        email: 'user@test.zone',
        username: 'user',
        is_active: true,
        is_staff: true
    };

    var project = {
        count: 1,
        results: [{
            id: 1,
            name: 'WEBAPI'
        }]
    };

    var testPlans = {
        count: 1,
        results: [{
            id: 1,
            name: 'FIRST',
            project: 1,
            hidden: false,
            owner: 2
        }]
    };

    var metric = {
        id: 1,
        project: 1,
        schedule: '0 0 * * *',
        weight: 1,
        name: 'NEW METRIC',
        query: 'NEW QUERY',
        handler: 'count'
    }

    var requestNumber = 0;

    angular.module('deleteMetricMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/metrics\/\?project=1/)
                .respond( function() {
                     requestNumber += 1;
                     if (requestNumber === 1) {
                        return [200, {count: 0, results: [metric]}];
                     }
                     if (requestNumber === 2) {
                        return [200, {count: 1, results: []}];
                     }
             });
            $httpBackend.whenDELETE(/.*api\/metrics\/1/).respond(function () {
                return [200, {message: 'Metric and all values deleted'}, {}];
            });
            $httpBackend.whenGET(/.*/).passThrough();
        });
}

