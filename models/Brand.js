var BrandSchema, BrandModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose');

// defaults
// validations
// unique

BrandSchema = mongoose.Schema({
    type: { type: String, required: true },
    name: { type: String, required: true }
});

BrandModel = mongoose.model('Brand', BrandSchema);

function mockDataGenerator() {
    var brandsList, vTypes,
        d = Q.defer(), vTypesD = Q.defer(),
        brandsDefers = [],
        errorStatus = false,
        keys = {
            'Легковые': 'car',
            'Грузовые': 'truck'
        };

    try{
        brandsList = JSON.parse(fs.readFileSync(PATHS.MODELS + '/mocks/models.json', 'utf-8'));
    }
    catch (err) {
        log('Can\'t read file with brands.', err.toString());

        brandsList = null;
        errorStatus = true;
    }

    models.VehicleType.find(function(err, result) {
        var _vTypes;

        if (!err) {
            _vTypes = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });

            vTypes = {};
            _vTypes.forEach(function(vType) {
                vTypes[vType.key] = vType;
            });

        } else {
            log('error', 'Can\'t get vehicle types for brands generator.', err.toString());
            vTypes = null;
        }

        vTypesD.resolve();
    });

    vTypesD.promise.then(function() {
        if (brandsList && vTypes) {
            brandsList.forEach(function(bList) {
                var type = keys[bList.name];

                if (type) {
                    bList.vendors.forEach(function(brand) {
                        var brandData,
                            brandD = Q.defer();

                        brandsDefers.push(brandD.promise);

                        brandData = {
                            type: vTypes[type].id,
                            name: brand.name
                        };

                        models.Brand.create(brandData, function(err, doc) {
                            if (err) {
                                log('error', 'Error at saving new brand.', err.toString());
                                errorStatus = true;
                            }

                            brandD.resolve();
                        });
                    });
                }
            });

            Q.allResolved(brandsDefers).then(function() {
                if (errorStatus) {
                    log('notice', 'Brands was created with errors.');
                } else {
                    log('Brands was added.');
                }

                d.resolve();
            }).done();
        }
        else {
            log('error', 'Not enougth for generate brands.', !!brandsList, !!vTypes);
            d.resolve();
        }
    });

    return d.promise;
}

module.exports = {
    name: 'Brand',
    model: BrandModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: ['VehicleType']
    }
};