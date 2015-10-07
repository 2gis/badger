'use strict';

var app = angular.module('testReport.launchItem.form', [
    'ngRoute',
    'ngCookies'
]);

app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/testplan/:testPlanId/launch-item/add', {
            templateUrl: '/static/app/partials/launch_item/form/form.html',
            controller: 'LaunchItemFormCtrl'
        });
    }
]);

app.run(function($http, $cookies) {
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
    $http.defaults.xsrfCookieName = 'csrftoken';
    $http.defaults.xsrfHeaderName = 'X-CSRFToken';
});

app.controller('LaunchItemFormCtrl', ['$scope', '$routeParams', '$location', 'appConfig', 'LaunchItem',
    function ($scope, $routeParams, $location, appConfig, LaunchItem) {
        // We can't add more then one deploy script
        LaunchItem.get({
            test_plan: $routeParams.testPlanId,
            type: appConfig.TASK_TYPE_DEPLOY
        }, function (result) {
            if (result.count > 0) {
                $scope.isDeployScriptExists = true;
            }
        });

        $scope.master = {};
        $scope.formErrors = null;

        $scope.save = function(formData) {
            var launchItem;

            $scope.master = angular.copy(formData);
            launchItem = new LaunchItem();
            launchItem.test_plan = $routeParams.testPlanId;
            _.each(formData, function (value, property) {
                launchItem[property] = value;
            });
            launchItem.$save(function () {
                $location.path('testplan/' + $routeParams.testPlanId);
            }, function (result) {
                $scope.formErrors = result.data.detail;
            });
        };

        $scope.reset = function() {
            $scope.launchItem = angular.copy($scope.master);
            $scope.launchItem.type = appConfig.TASK_TYPE_REGULAR;
        };
        $scope.reset();
    }
]);
