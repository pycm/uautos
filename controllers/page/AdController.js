var PageController = require(PATHS.APP + '/controllers/base/PageController.js');

module.exports = helpers.extendController(PageController, {

    name: 'AdController',

    path: '/ad/:adID',

    pageName: 'ad',

    template: 'pages/ad',

    env: function(req, res) {
        req.stor.adID = req.params.adID;
        req.stor.forView = req.query.view;
    },

    model: function(stor, env) {
        var d = Q.defer();

        models.Ad.take({
            find: { _id: stor.adID },
            populate: true,
            single: true
        }).then(function(adJSON) {
            stor.adJSON = adJSON;

            d.resolve();
        }, function(err) {
            d.reject(err);
        });

        return d.promise;
    },

    processAdJSONForView: function(data) {
        var result = {};

        ['id', 'vin', 'year', 'mileage', 'colorOptions', 'fuel', 'engine', 'transmission', 'drive', 'state', 'owners', 'tokens', 'price'].forEach(function(paramName) {
            result[paramName] = data[paramName];
        });

        result.author = {
            id: data.author.id,
            disabled: null, // todo: !!!
            name: data.author.name,
            email: data.author.email,
            phone: data.author.phone
        };

        result.vehicleType = {
            id: data.vehicleType.id,
            key: data.vehicleType.key,
            display: data.vehicleType.display
        };

        result.bodyType = {
            id: data.bodyType.id,
            key: data.bodyType.key,
            display: data.bodyType.display
        };

        result.brand = {
            id: data.brand.id,
            name: data.brand.name
        };

        result.model = {
            id: data.model.id,
            name: data.model.name,
            yearStart: data.model.yearStart,
            yearEnd: data.model.yearEnd
        };

        result.photos = (data.photos || []).map(function(photo) {
            return {
                id: photo.id,
                name: photo.name,
                path: photo.path
            };
        });

        return result;
    },

    view: function(stor, env) {
        if (stor.adJSON.disabled) {
            throw new Error('Ad is disabled.');
        }

        stor.params = {
            title: 'UAutos Ad Page JSON',
            adJSON: JSON.stringify(stor.forView ? this.processAdJSONForView(stor.adJSON) : stor.adJSON, null, 4)
        };
    }

});