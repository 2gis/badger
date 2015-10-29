'use strict';

var app = angular.module('testReport.auth.settings', [
    'ngRoute',
    'ngCookies',
    'testReportServices',
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/profile/settings', {
        templateUrl: '/static/app/partials/auth/settings/settings.html',
        controller: 'ProfileSettingsCtrl'
    });
}]);

app.controller('ProfileSettingsCtrl', ['$rootScope', '$scope', '$routeParams', 'Auth', 'Project',
    function ($rootScope, $scope, $routeParams, Auth, Project) {
        $scope.launchesOnPage = [10, 25, 50];
        $scope.resultsOnPage = [10, 25, 50, 100];

        Project.query(function (response) {
            $scope.projectOptions = response.results;

        });

        $rootScope.getProfile();

        $scope.update = function (settings) {
            Auth.api.update(settings, function (result) {
                $scope.formUpdate = result.message;
                $scope.formErrors = null;
            }, function (result) {
                $scope.formUpdate = null;
                $scope.formErrors = result.data.message;
            });
        };
    }
]);
