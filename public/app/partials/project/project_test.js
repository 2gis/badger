'use strict';

describe('Controller: ProjectCtrl', function () {
    var scope,
        PROJECT_ID = 1;

    beforeEach(module('testReport.project'));

    beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
        scope = $rootScope.$new();

        $controller('ProjectCtrl', {
            $scope: scope,
            $routeParams: {projectId: PROJECT_ID}
        });

        // Mock resource responses
        $httpBackend.whenGET('/api/projects/' + PROJECT_ID).respond({
            id: PROJECT_ID,
            name: 'WebApi'
        });

        $httpBackend.whenGET('/api/testplans/?project=' + PROJECT_ID).respond({
            "count": 1,
            "next": null,
            "previous": null,
            "results": [
                {
                    "id": 1,
                    "name": 'Full regression',
                    "project": PROJECT_ID
                }
            ]
        });

        $httpBackend.flush();
    }));

    it('should return project name', inject(function () {
        expect(scope.name).toEqual('WebApi');
    }));

    it('should return project testplans', inject(function () {
        expect(scope.count).toEqual(1);
        expect(scope.testplans[0].id).toEqual(PROJECT_ID);
        expect(scope.testplans[0].name).toEqual('Full regression');
    }));
});
