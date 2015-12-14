'use strict';

var app = angular.module('testReport.auth.settings', [
    'ngRoute',
    'ngCookies',
    'testReportServices',
    'angular-multi-select'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/profile/settings', {
        templateUrl: '/static/app/partials/auth/settings/settings.html',
        controller: 'ProfileSettingsCtrl'
    });
}]);

app.controller('ProfileSettingsCtrl', ['$rootScope', '$scope', '$routeParams', '$q', '$location', 'Auth', 'Project', 'TestPlan', 'Filters',
    function ($rootScope, $scope, $routeParams, $q, $location, Auth, Project, TestPlan, Filters) {
        $scope.launchesOnPage = [10, 25, 50];
        $scope.resultsOnPage = [10, 25, 50, 100];
        $scope.addNew = false;
        $scope.dashboardName = null;
        $scope.select_cache = null;
        $scope.addErrors = null;

        function getProjectsAndTestplansData() {
            var deferred = $q.defer();

            var multiData = [];
            _.each($scope.projects, function (project) {
                TestPlan.get({ projectId: project.id }, function (response) {
                    project.testplans = _.filter(response.results, Filters.isMain);
                    project.testplans = _.filter(project.testplans, Filters.removeHidden);
                    project.testplans = _.sortBy(project.testplans, 'name');

                    if (project.testplans.length !== 0) {
                        multiData.push({name: project.name, sub: project.testplans});
                    }
                });
            });

            deferred.resolve(multiData);
            return deferred.promise;
        };

        Project.query(function (response) {
            $scope.projects = response.results;
            getProjectsAndTestplansData().then(function(data) {
                $scope.multiData = data;
            });
        });

        $rootScope.getProfile().then(function(profile) {
            $scope.userDashboards = profile.settings.dashboards;
        });

        $scope.addDashboard = function (dashboardName, dashboards) {
            if (checkDashboardExist(dashboardName)) {
                $scope.addErrors = 'Dashboard "'+ dashboardName + '" already exists. ' +
                    'Please, choose another name.';
                return;
            }
            if (dashboardName === null || dashboards.length === 0) {
                $scope.addErrors = 'Some fields are empty. Please, fill them.';
                return;
            }
            var plans = [];
            _.each(dashboards, function(dashboard) {
                _.each(dashboard.sub, function(item) {
                    plans.push({id: item.id, name: item.name, project_name: dashboard.name});
                });
            });
            $scope.userDashboards.push({name: dashboardName, testplans: plans});
            $scope.addErrors = null;
        };

        $scope.deleteDashboard = function(dashboardName) {
            $scope.userDashboards = _.filter($scope.userDashboards, function(dashboard) {
                return dashboard.name !== dashboardName;
            });
        };

        $scope.update = function (settings) {
            settings.dashboards = $scope.userDashboards;
            Auth.api.update(settings, function (result) {
                $scope.formUpdate = result.message;
                $scope.formErrors = null;
            }, function (result) {
                $scope.formUpdate = null;
                $scope.formErrors = result.data.message;
            });
        };

        $scope.reset = function(multiSelect) {
            multiSelect.select_none();
        };

        function checkDashboardExist(name) {
            return _.find($scope.userDashboards, function(item) {
                return item.name === name;
            });
        }
    }
]);
