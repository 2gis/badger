'use strict';

var app = angular.module('testReport.testPlan.add', [
    'ngRoute',
    'ngCookies',
    'testReportServices'
]);

app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/testplan/:projectId/add',{
            templateUrl: '/static/app/partials/testplan/add/add.html',
            controller: 'TestPlanAdd'
        });
    }
]);

app.run(function ($http, $cookies) {
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
    $http.defaults.xsrfCookieName = 'csrftoken';
    $http.defaults.xsrfHeaderName = 'X-CSRFToken';
});

app.controller('TestPlanAdd', ['$rootScope', '$scope', '$routeParams', '$location', '$q','TestPlan', 'LaunchItem',
    function ($rootScope, $scope, $routeParams, $location, $q, TestPlan, LaunchItem) {
        $rootScope.selectProject($routeParams.projectId);
        $scope.formErrors = null;
        $scope.projectId = $routeParams.projectId;
        $scope.testPlan = {hidden: true};

        $scope.save = function(formData) {
            var testPlan;

            testPlan = new TestPlan();
            testPlan.project = $scope.projectId;
            TestPlan.get({ name: formData.name, project: testPlan.project}, function (result) {
                if (result.count === 1) {
                    $scope.formErrors = 'Testplan "'+ formData.name + '" already exists. ' +
                    'Please, choose another name.';
                } else {
                    _.each(formData, function (value, property) {
                        testPlan[property] = value;
                    });

                    TestPlan.save(testPlan, function (result) {
                        var deploy = new LaunchItem();
                        deploy.test_plan = result.id;
                        deploy.name = 'Deploy task'
                        deploy.type = 1;
                        deploy.timeout = 120;
                        deploy.command = 'echo "Edit me"';
                        LaunchItem.save(deploy, function(result) {
                            $location.path('testplan/' + deploy.test_plan);
                            $rootScope.reloadProjects();
                        });
                    }, function (result) {
                        $scope.formErrors = result.data.detail;
                    });
                }
            });

        };
    }
]);
