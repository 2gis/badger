module.exports.metricMock = function () {

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

    angular.module('metricMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/metrics\/\?project=1/)
                .respond( function() {
                     requestNumber += 1;
                     if (requestNumber === 1) {
                        return [200, {count: 0, results: []}];
                     }
                     if (requestNumber === 2) {
                        return [200, {count: 1, results: [metric]}];
                     }
             });
            $httpBackend.whenPOST(/.*/, {
                    project: '1',
                    schedule: '0 0 * * *',
                    weight: 1,
                    name: 'NEW METRIC',
                    query: 'NEW QUERY',
                    handler: 'count'
                }).respond(function () {
                    return [201, metric, {}]
            });
            $httpBackend.whenPOST(/.*/, {
                    project: '1',
                    schedule: '0 0 * * *',
                    weight: 1,
                    name: 'EXISTENT METRIC',
                    query: 'NEW QUERY',
                    handler: 'count'
                }).respond(function () {
                    return [400, {message: 'Metric already exist, choose another name'}, {}]
            });
            $httpBackend.whenPOST(/.*/, {
                    project: '1',
                    schedule: '0 0 * * *',
                    weight: 1,
                    name: 'NEW METRIC',
                    query: 'NEW QUERY',
                    handler: 'count',
                    query_period: 'RESTORE FILTER',
                    query_field: 'created',
                    query_step: 7
                }).respond(function () {
                    return [201, metric, {}];
            });
            $httpBackend.whenGET(/.*/).passThrough();
        });
}
