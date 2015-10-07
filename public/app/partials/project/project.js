'use strict';

var app = angular.module('testReport.project', [
    'ngRoute',
    'testReportServices'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId', {
        templateUrl: '/static/app/partials/project/project.html',
        controller: 'ProjectCtrl'
    });
}]);

app.controller('ProjectCtrl', ['$scope', '$routeParams', 'Project', 'TestPlan',
    function ($scope, $routeParams, Project, TestPlan) {
        Project.get({ projectId: $routeParams.projectId }, function (result) {
            $scope.name = result.name;
        });

        TestPlan.get({ projectId: $routeParams.projectId }, function (result) {
            $scope.count = result.count;
            $scope.testplans = result.results;
        });
    }
]);
