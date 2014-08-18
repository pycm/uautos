var BodyTypeSchema, BodyTypeModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose');

// defaults
// validations
// unique

BodyTypeSchema = mongoose.Schema({
    key: { type: String, required: true },
    display: { type: String, required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true }
});

BodyTypeModel = mongoose.model('BodyType', BodyTypeSchema);

function mockDataGenerator() {
    var bTypesList,
        d = Q.defer(),
        bTypesDefers = [],
        errorStatus = false;

    try{
        bTypesList = fs.readFileSync(PATHS.MODELS + '/mocks/bodyTypes.txt', 'utf-8').split(os.EOL).filter(function(line){
            return !!line;
        })
    }
    catch (err) {
        log('Can\'t read file with body types.', err.toString());

        bTypesList = [];
        errorStatus = true;
    }

    bTypesList.forEach(function(bType) {
        var bTypeD = Q.defer(),
            bTypeParts = bType.split('|');

        bTypesDefers.push(bTypeD.promise);

        models.VehicleType.findOne({ key: bTypeParts[2] }, function(err, doc) {
            if (err || !doc) {
                log('error', err ? err.toString() : 'Vehicle type for body type wasn\'t found.');
                errorStatus = true;
            }
            else {
                models.BodyType.create({
                    key: bTypeParts[0],
                    display: bTypeParts[1],
                    vehicle: doc.id
                }, function(err, doc) {
                    if (err) {
                        log('error', err.toString());
                        errorStatus = true;
                    }

                    bTypeD.resolve();
                });
            }
        });
    });

    Q.allResolved(bTypesDefers).then(function() {
        if (errorStatus) {
            log('notice', 'Body types was created with errors.');
        } else {
            log('Body types was added.');
        }

        d.resolve();
    }).done();

    return d.promise;
}

module.exports = {
    name: 'BodyType',
    model: BodyTypeModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: ['VehicleType']
    }
};