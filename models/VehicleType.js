var VehicleTypeSchema, VehicleTypeModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose');

// defaults
// validations
// unique

VehicleTypeSchema = mongoose.Schema({
    key: { type: String, required: true },
    display: { type: String, required: true }
});

VehicleTypeModel = mongoose.model('VehicleType', VehicleTypeSchema);

function mockDataGenerator() {
    var vTypesList,
        d = Q.defer(),
        vTypesDefers = [],
        errorStatus = false;

    try{
        vTypesList = fs.readFileSync(PATHS.MODELS + '/mocks/vehicleTypes.txt', 'utf-8').split(os.EOL).filter(function(line){
            return !!line;
        })
    }
    catch (err) {
        log('Can\'t read file with vehicle types.', err.toString());

        vTypesList = [];
        errorStatus = true;
    }

    vTypesList.forEach(function(vType) {
        var vTypeD = Q.defer(),
            vTypeParts = vType.split('|');

        vTypesDefers.push(vTypeD.promise);

        models.VehicleType.create({
            display: vTypeParts[0],
            key: vTypeParts[1]
        }, function(err, doc) {
            if (err) {
                log('error', err.toString());
                errorStatus = true;
            }

            vTypeD.resolve();
        });
    });

    Q.allResolved(vTypesDefers).then(function() {
        if (errorStatus) {
            log('notice', 'Vehicle types was created with errors.');
        } else {
            log('Vehicle types was added.');
        }

        d.resolve();
    }).done();

    return d.promise;
}

module.exports = {
    name: 'VehicleType',
    model: VehicleTypeModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: []
    }
};