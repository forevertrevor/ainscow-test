var lib = angular.module('lib', ['ionic']);
lib.factory('d3Service', function ($window) {
    return $window.d3;
});
lib.factory('_', function ($window) {
    return $window._;
});
lib.factory('moment', function ($window) {
    return $window.moment;
});



