exports.addTestplanMock = function () {

    var project = {
        "count": 1,
        "next": null,
        "previous": null,
        "results": [{
            "id": 1,
            "name": "WEBAPI"
        }]
    };

    var testPlans = {"detail": "Not found"};

    var testPlan = {
        "id": 100,
        "name": "Barsuk",
        "project": 1,
        "hidden": true,
        "owner": 1
    };

    var profile = {
        "id": 1,
        "email": "user@test.zone",
        "username": "user",
        "is_active": true,
        "is_staff": true
    };

    var addPostData = {"project": "1", "hidden": true, "name": "Barsuk"};

    var addPostRequest = {
        "id": 100,
        "name": "Barsuk",
        "project": 1,
        "hidden": true,
        "owner": 1
    };

    var deployPostData = {
        "test_plan": 100,
        "name": "Deploy task",
        "type": 1,
        "timeout": 120,
        "command": "echo \"Edit me\""
    };

    angular.module('addMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenGET(/.*api\/auth\/get\//).respond(profile);
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/testplans\/\?project=1/).respond(testPlans);
            $httpBackend.whenGET(/.*api\/testplans\/\?project=&project_id__in=&name=Barsuk&project=1/)
                .respond({ count: 0, results: [] });
            $httpBackend.whenPOST(/.*/, addPostData).respond(function(){
                return [201, addPostRequest, {}]
            });
            $httpBackend.whenPOST(/.*/, deployPostData).respond(function(){
                return [201, {}, {}];
            });
            $httpBackend.whenGET(/.*api\/testplans\/100\/\?project=/).respond(testPlan);
            $httpBackend.whenGET(/.*/).passThrough();
        });
}