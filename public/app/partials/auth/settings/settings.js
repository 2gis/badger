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

app.controller('ProfileSettingsCtrl', ['$rootScope', '$scope', '$routeParams', '$q', '$filter', '$location', 'Auth', 'Project', 'TestPlan', 'Filters',
    function ($rootScope, $scope, $routeParams, $q, $filter, $location, Auth, Project, TestPlan, Filters) {
        $rootScope.isMainDashboard = false;
        $scope.launchesOnPage = [10, 25, 50];
        $scope.resultsOnPage = [10, 25, 50, 100];
        $scope.addNew = false;
        $scope.dashboardName = null;
        $scope.select_cache = null;
        $scope.addErrors = null;

        $scope.options = [
            {name: 'Show head of test result', code: 'head'},
            {name: 'Show tail of test result', code: 'tail'}
        ];

        function getTestplans(project) {
            var deferred = $q.defer();

            TestPlan.get({ projectId: project.id }, function (response) {
                var testplans = _.filter(response.results, Filters.removeHidden);
                testplans = _.sortBy(testplans, 'name');
                deferred.resolve({name: project.name, sub: testplans,
                    weight: $rootScope.getProjectSettings(project.id, 'weight')});
            });
            return deferred.promise;
        }

        function getProjectsAndTestplansData() {
            var promises = [];
            _.each($scope.projects, function(project) {
                var promise = getTestplans(project);
                promises.push(promise);
            });
            return $q.all(promises);
        }

        Project.query(function (response) {
            $scope.projects = response.results;
            getProjectsAndTestplansData().then(function(data) {
                data =  $filter('orderBy')(data, ['weight', 'name']);
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
