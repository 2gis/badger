'use strict';

var app = angular.module('testReport.auth.login', [
    'ngRoute',
    'ngCookies',
    'testReportServices',
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/auth/login/', {
        templateUrl: '/static/app/partials/auth/login/login.html',
        controller: 'Login'
    });
}]);

app.controller('Login', ['$rootScope', '$scope', '$http', 'Auth', '$location', '$cookies',
    function ($rootScope, $scope, $http, Auth, $location, $cookies) {
        $scope.username = '';
        $scope.password = '';
        $scope.error = '';
        $scope.login = function() {
            var auth = new Auth.api();
            auth.username = $scope.username;
            auth.password = $scope.password;
            $scope.password = '';
            Auth.api.login(auth, function(data) {
                $rootScope.profile = data;
                Auth.api.get_current(function(result) {
                    if (typeof $rootScope.originLoginPath == 'undefined' || $rootScope.originLoginPath === '/auth/login/') {
                        $location.path('/');
                        if ($rootScope.profile.settings.default_project !== null) {
                            $location.path('/dashboard/' + $rootScope.profile.settings.default_project);
                        }
                    } else {
                        $location.path($rootScope.originLoginPath);
                        if ($rootScope.originLoginPath === '/dashboard' && $rootScope.profile.settings.default_project !== null) {
                            $location.path('/dashboard/' + $rootScope.profile.settings.default_project);
                        }
                    }
                });
            }, function (data){
                $scope.error = data.data.message;
            });
        }
    }
]);
