(function () {
    'use strict';
    angular.module('itsyouonlineApp')
        .constant('ContractConstants', ContractConstants());

    function ContractConstants() {
        return {
            partyTypes: [{
                type: 'user',
                label: 'User'
            }, {
                type: 'organizations',
                label: 'Organization'
            }],
            contentTypes: [{
                type: 'text',
                label: 'Text'
            }, {
                type: 'image',
                label: 'Image'
            }]
        };
    }
})();