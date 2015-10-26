module.exports.authMock = function () {

    var profile = {
        id: 1,
        email: "user@test.zone",
        username: "test_user",
        is_active: true,
        is_staff: true,
        settings: {
            default_project: 1,
            launches_on_page: 10,
            testresults_on_page: 25
        }
    };

    var project = {
        "count": 1,
        "results": [{
            "id": 1,
            "name": "WEBAPI"
        }]
    };

    var requestNumber = 0;

    angular.module('redirectMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenPOST(/.*/, {"username":"test_user","password":"test_user"})
                .respond(function () { return [201, profile, {}];
            });
            $httpBackend.whenGET(/.*api\/auth\/get\//)
                .respond( function() {
                     requestNumber += 1;
                     if (requestNumber === 1) {
                        return [401, {"message": "Unauthorized", "status": "Unauthorized"}];
                     }
                     if (requestNumber === 2) {
                        return [200, profile];
                     }
             });
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*/).passThrough();
        });
}