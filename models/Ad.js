var AdSchema, AdModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamp');

// defaults
// validations
// unique

AdSchema = mongoose.Schema({
    disabled: { type: Boolean, 'default': false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true },
    bodyType: { type: mongoose.Schema.Types.ObjectId, ref: 'BodyType', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
    // modification: { type: mongoose.Schema.Types.ObjectId, ref: 'Modification' },
    vin: { type: String },
    year: { type: Number, required: true },
    mileage: { type: Number, required: true },
    colorOptions: {
        color: { type: String },
        options: [ { type: String, 'enum': ['metallic', 'chameleon', 'pearl', 'airbrush'] } ]
    },
    fuel: { type: String, 'enum': ['gasoline', 'diesel', 'gas', 'hybrid', 'electro'] },
    engine: {
        volume: { type: Number },
        power: { type: Number },
        options: [ { type: String, 'enum': ['turbo'] } ]
    },
    transmission: { type: String, 'enum': ['automatic', 'manual'] },
    drive: { type: String, 'enum': ['front', 'back'] },
    state: { type: String, 'enum': ['excellent', 'good', 'repair', 'accident'] },
    owners: { type: Number },
    tokens: [ { type: String, enum: ['credit', 'not cleared', 'accidents', 'warranty', 'exchange', 'trade', 'urgently', 'tuning', 'right wheel'] } ],
    price: { type: Number, required: true }, // $, -1 === договорная
    photos: [ { type: mongoose.Schema.Types.ObjectId, ref: 'File'  } ]
});

AdSchema.plugin(timestamps);

// todo: use 'populate' inside take
AdSchema.statics.take = function(options) {
    var d = Q.defer(),
        query = this.find(options.find || {});

    if (options.limit) query = query.limit(options.limit);
    if (options.sort) query = query.sort(options.sort);
    if (options.select) query = query.select(options.select);

    query.exec(function(err, items) {
        var defers = [],
            populate = options.populate || {},
            populateAll = populate === true;

        if (!err) {
            items.forEach(function(item) {
                var authorD = Q.defer(), vehicleTypeD = Q.defer(), bodyTypeD = Q.defer(),
                    brandD = Q.defer(), modelD = Q.defer(), photosD = Q.defer(),
                    itemD = Q.defer(),
                    itemJSON = item.toJSON({ virtuals: true });

                defers.push(itemD.promise);

                if ((populateAll || populate.author) && item.author) {
                    models.User.findById(item.author, function(err, result) {
                        if (!err && result) {
                            authorD.resolve(result.toJSON({ virtuals: true }));
                        }
                        else if (!err) {
                            authorD.reject('no-author-for-ad');
                        }
                        else {
                            authorD.reject(err);
                        }
                    });
                }
                else {
                    authorD.resolve();
                }

                if ((populateAll || populate.vehicleType) && item.vehicleType) {
                    models.VehicleType.findById(item.vehicleType, function(err, result) {
                        if (!err && result) {
                            vehicleTypeD.resolve(result.toJSON({ virtuals: true }));
                        }
                        else if (!err) {
                            vehicleTypeD.reject('no-vehicle-type-for-ad');
                        }
                        else {
                            vehicleTypeD.reject(err);
                        }
                    });
                }
                else {
                    vehicleTypeD.resolve();
                }

                if ((populateAll || populate.bodyType) && item.bodyType) {
                    models.BodyType.findById(item.bodyType, function(err, result) {
                        if (!err && result) {
                            bodyTypeD.resolve(result.toJSON({ virtuals: true }));
                        }
                        else if (!err) {
                            bodyTypeD.reject('no-body-type-for-ad');
                        }
                        else {
                            bodyTypeD.reject(err);
                        }
                    });
                }
                else {
                    bodyTypeD.resolve();
                }


                if ((populateAll || populate.brand) && item.brand) {
                    models.Brand.findById(item.brand, function(err, result) {
                        if (!err && result) {
                            brandD.resolve(result.toJSON({ virtuals: true }));
                        }
                        else if (!err) {
                            brandD.reject('no-brand-type-for-ad');
                        }
                        else {
                            brandD.reject(err);
                        }
                    });
                }
                else {
                    brandD.resolve();
                }

                if ((populateAll || populate.model) && item.model) {
                    models.Model.findById(item.model, function(err, result) {
                        if (!err && result) {
                            modelD.resolve(result.toJSON({ virtuals: true }));
                        }
                        else if (!err) {
                            modelD.reject('no-model-type-for-ad');
                        }
                        else {
                            modelD.reject(err);
                        }
                    });
                }
                else {
                    modelD.resolve();
                }

                if ((populateAll || populate.photos) && item.photos && item.photos.length) { // todo: ensure that all photos found
                    models.File.find({ _id: { $in: item.photos } }, function(err, result) {
                        if (!err && result.length) {
                            photosD.resolve(result.map(function(item) {
                                return item.toJSON({ virtuals: true });
                            }));
                        }
                        else if (!err) {
                            photosD.reject('not-photos-for-ad');
                        }
                        else {
                            photosD.reject(err);
                        }
                    });
                }
                else {
                    photosD.resolve();
                }

                Q.spread([authorD.promise, vehicleTypeD.promise, bodyTypeD.promise, brandD.promise, modelD.promise, photosD.promise], function(author, vehicleType, bodyType, brand, model, photos) {
                    itemJSON.author = author !== undefined ? author : item.author;
                    itemJSON.vehicleType = vehicleType !== undefined ? vehicleType : item.vehicleType;
                    itemJSON.bodyType = bodyType !== undefined ? bodyType : item.bodyType;
                    itemJSON.brand = brand !== undefined ? brand : item.brand;
                    itemJSON.model = model !== undefined ? model : item.model;
                    itemJSON.photos = photos !== undefined ? photos : item.photos;

                    itemD.resolve(itemJSON);
                }, function(err) {
                    itemD.reject(err);
                });
            });

            Q.all(defers).then(function(items) {
                var result;

                if (options.single) {
                    result = items && items.length ? items[0] : null;
                }
                else {
                    result = items;
                }

                d.resolve(result);
            }, function(err) {
                d.reject(err);
            });
        }
        else {
            d.reject(err);
        }
    });

    return d.promise;
};

AdModel = mongoose.model('Ad', AdSchema);

function mockDataGenerator() {
    var users, vTypes, bTypes, modelsDB, files,
        d = Q.defer(),
        usersD = Q.defer(), vTypesD = Q.defer(), bTypesD = Q.defer(), modelsD = Q.defer(), filesD = Q.defer(),
        count = 100,
        rc = helpers.randomChance,
        rb = helpers.randomBetween,
        ra = helpers.randomFromArray,
        errorStatus = false;

    models.User.find(function(err, result) {
        if (!err) {
            users = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });
        } else {
            log('error', 'Can\'t get users for ads generator.', err.toString());
            users = null;
        }

        usersD.resolve();
    });

    models.VehicleType.find(function(err, result) {
        if (!err) {
            vTypes = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });
        } else {
            log('error', 'Can\'t get vehicle types for ads generator.', err.toString());
            vTypes = null;
        }

        vTypesD.resolve();
    });

    models.BodyType.find(function(err, result) {
        if (!err) {
            bTypes = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });
        } else {
            log('error', 'Can\'t get body types for ads generator.', err.toString());
            bTypes = null;
        }

        bTypesD.resolve();
    });

    models.Model.find(function(err, result) {
        if (!err) {
            modelsDB = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });
        } else {
            log('error', 'Can\'t get models for ads generator.', err.toString());
            modelsDB = null;
        }

        modelsD.resolve();
    });

    models.File.find({ type: 'ad' }, function(err, result) {
        if (!err) {
            files = result.map(function(item) {
                return item.toJSON({ virtuals: true }).id;
            });
        } else {
            log('error', 'Can\'t get files for ads generator.', err.toString());
            files = null;
        }

        filesD.resolve();
    });

    Q.allResolved([usersD.promise, vTypesD.promise, bTypesD.promise, modelsD.promise, filesD.promise]).then(function() {
        var i,
            adDefers = [];

        if (users && users.length && vTypes && vTypes.length && bTypes && bTypes.length && modelsDB && modelsDB.length && files && files.length) {
            for (i = 0; i < count; i++) {
                try {
                    (function() {
                        var adData, bodyType, model,
                            adD = Q.defer();

                        adDefers.push(adD.promise);

                        adData = {
                            disabled: rc(2),
                            author: users[rb(0, users.length - 1)].id,
                            year: rb(1970, 2014),
                            mileage: rb(0, 1000),
                            colorOptions: {},
                            engine: {},
                            tokens: ra(['credit', 'not cleared', 'accidents', 'warranty', 'exchange', 'trade', 'urgently', 'tuning', 'right wheel'], 20),
                            price: rc(10) ? -1 : rb(0, 100000)
                        };

                        bodyType = bTypes[rb(0, bTypes.length - 1)];
                        adData.bodyType = bodyType.id;
                        adData.vehicleType = bodyType.vehicle;

                        model = modelsDB[rb(0, modelsDB.length - 1)];
                        adData.model = model.id;
                        adData.brand = model.brand;

                        adData.photos = ra(files, 25);

                        if (rc(10)) adData.vin = helpers.generateRandomToken();
                        if (rc(75)) adData.colorOptions.color = ['white', 'blue', 'red', 'orange', 'green'][rb(0, 4)];
                        if (rc(75)) adData.colorOptions.options = ['metallic', 'chameleon', 'pearl', 'airbrush'][rb(0, 3)];
                        if (rc(75)) adData.fuel = ['gasoline', 'diesel', 'gas', 'hybrid', 'electro'][rb(0, 4)];
                        if (rc(75)) adData.engine.volume = rb(500, 10000);
                        if (rc(75)) adData.engine.power = rb(50, 1000);
                        if (rc(5)) adData.engine.options = ['turbo'];
                        if (rc(75)) adData.transmission = ['automatic', 'manual'][rb(0, 1)];
                        if (rc(75)) adData.drive = ['front', 'back'][rb(0, 1)];
                        if (rc(75)) adData.state = ['excellent', 'good', 'repair', 'accident'][rb(0, 3)];
                        if (rc(75)) adData.owners = rb(1, 5);

                        models.Ad.create(adData, function(err, doc) {
                            if (err) {
                                log('error', 'Error at saving new ad.', err.toString());
                                errorStatus = true;
                            }

                            adD.resolve();
                        });
                    }());
                }
                catch (err) {
                    log(err.toString());
                    errorStatus = true;
                }
            }

            Q.allResolved(adDefers).then(function() {
                if (!errorStatus) log('Ads was added.');
                else log('notice', 'Ads was added with errors.');

                d.resolve();
            });
        }
        else {
            log('error', 'Not enougth data for generate ads.', users && users.length, vTypes && vTypes.length, bTypes && bTypes.length, modelsDB && modelsDB.length, files && files.length);
            d.resolve();
        }
    });

    return d.promise;
}

module.exports = {
    name: 'Ad',
    model: AdModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: ['User', 'BodyType', 'Model' ] // 'Modification'
    }
};