module.exports.authMock = function () {

    var profile = {
        "id": 1,
        "email": "user@test.zone",
        "username": "test_user",
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

    var logout = {
        "status": "Success",
        "message": "Logout done."
    };

    var reguestNumber = 0;

    angular.module('authMock', ['testReportServices', 'ngMockE2E'])
        .run(function ($httpBackend) {
            $httpBackend.whenPOST(/.*/, {"username":"test_user","password":"test_user"})
                .respond(function () { return [201, profile, {}];
            });
            $httpBackend.whenPOST(/.*/, {"username":"user","password":"user"})
                .respond(function () { return [401, {
                    "message": "Authentication failed",
                    "status": "Unauthorized"
                }, {}];
            });
            $httpBackend.whenPOST(/.*/, {"username":"","password":""})
                .respond(function () { return [401, {
                    "message": "Authentication failed",
                    "status": "Unauthorized"
                }, {}];
            });
            $httpBackend.whenGET(/.*api\/auth\/get\//)
                .respond( function() {
                     reguestNumber += 1;
                     if (reguestNumber === 1) {
                        return [401, {"message": "Unauthorized", "status": "Unauthorized"}];
                     }
                     if (reguestNumber === 2) {
                        return [200, profile];
                     }
             });
            $httpBackend.whenGET(/.*api\/projects\//).respond(project);
            $httpBackend.whenGET(/.*api\/auth\/logout\//).respond(logout);
            $httpBackend.whenGET(/.*/).passThrough();
        });
}