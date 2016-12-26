describe('Registration Controller test', function() {

    beforeEach(module('itsyouonline.registration'));

    var scope;

    beforeEach(inject(function ( $window, $cookies, $mdUtil, $rootScope, configService, registrationService, $controller) {

        scope = $rootScope.$new();

        registrationController = $controller('registrationController', {
            $scope: scope,
            $window: $window,
            $cookies: $cookies,
            $mdUtil: $mdUtil,
            $rootScope: $rootScope,
            configService: configService,
            registrationService: registrationService
        });
    }));

    it('Registration Controller should be defined', function () {
        expect(registrationController).toBeDefined();
    });
});
