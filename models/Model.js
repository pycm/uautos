var ModelSchema, ModelModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose');

// defaults
// validations
// unique

ModelSchema = mongoose.Schema({
    brand: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    yearStart: { type: String },
    yearEnd: { type: String }
});

ModelModel = mongoose.model('Model', ModelSchema);

function mockDataGenerator() {
    var brandsList, brandsDB,
        d = Q.defer(), brandsDBD = Q.defer(),
        modelsDefers = [],
        errorStatus = false;

    try{
        brandsList = JSON.parse(fs.readFileSync(PATHS.MODELS + '/mocks/models.json', 'utf-8'));
    }
    catch (err) {
        log('Can\'t read file with brands.', err.toString());

        brandsList = null;
        errorStatus = true;
    }

    models.Brand.find(function(err, result) {
        var _brands;

        if (!err) {
            _brands = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });

            brandsDB = {};
            _brands.forEach(function(brand) {
                brandsDB[brand.name] = brand;
            });

        } else {
            log('error', 'Can\'t get brands for models generator.', err.toString());
            brandsDB = null;
        }

        brandsDBD.resolve();
    });

    brandsDBD.promise.then(function() {
        if (brandsList && brandsDB) {
            brandsList.forEach(function(bList) {
                bList.vendors.forEach(function(brand) {
                    var brandId;

                    if (brandsDB[brand.name]) {
                        brandId = brandsDB[brand.name].id;

                        brand.models.forEach(function(model) {
                            var modelData,
                                modelD = Q.defer();

                            modelsDefers.push(modelD.promise);

                            modelData = {
                                brand: brandId,
                                name: model.name,
                                yearStart: model.year_start,
                                yearEnd: model.year_end
                            };

                            models.Model.create(modelData, function(err, doc) {
                                if (err) {
                                    log('error', 'Error at saving new model.', err.toString());
                                    errorStatus = true;
                                }

                                modelD.resolve();
                            });
                        });
                    }
                    else {
                        log('error', 'Brand "' + brand.name + '" not found for generate brand models.');
                        errorStatus = true;
                    }
                });
            });

            Q.allResolved(modelsDefers).then(function() {
                if (errorStatus) {
                    log('notice', 'Models was created with errors.');
                } else {
                    log('Models was added.');
                }

                d.resolve();
            }).done();
        }
        else {
            log('error', 'Not enougth for generate models.', !!brandsList, !!brandsDB);
            d.resolve();
        }
    });

    return d.promise;
}

module.exports = {
    name: 'Model',
    model: ModelModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: ['Brand']
    }
};