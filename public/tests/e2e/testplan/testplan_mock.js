module.exports.testplanMock = function () {

    var profile = {
        "id": 1,
        "email": "user@test.zone",
        "username": "user",
        "is_active": true,
        "is_staff": true
    };

    var project = {
        "count": 1,
        "results": [{
            "id": 1,
            "name": "WEBAPI"
        }]
    };

    var testPlans = {
        "count": 1,
        "results": [{
            "id": 1,
            "name": "FIRST",
            "project": 1,
            "hidden": false,
            "owner": 2
        }]
    };

    var testPlan = {
        "id": 100,
        "name": "Barsuk",
        "project": 1,
        "hidden": true,
        "owner": 1
    };

    angular.module('testplanMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/\?project=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/testplans\/100\/\?project=/).respond(testPlan);
            $httpBackend.whenGET(/.*api\/testplans\/custom_list\/\?project=&project_id__in=1/).respond(testPlans);
            $httpBackend.whenPATCH(/.*/, {
                "id":100,
                "name":"Barsuk",
                "project":1,
                "hidden":true,
                "owner":1,
                "main":true,
                "filter":"full"
            }).respond(function () {
                return [200, {}, {}];
            });
            $httpBackend.whenDELETE(/.*api\/testplans\/100\/\?project=&project_id__in=/).respond(function () {
                return [204];
            });
            $httpBackend.whenGET(/.*/).passThrough();
        });
}