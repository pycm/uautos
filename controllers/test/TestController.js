var Controller = require(PATHS.APP + '/controllers/base/Controller.js'),
    fs = require('fs');

module.exports = helpers.extendController(Controller, {

    name: 'TestController',

    mapping: function() {
        return {
            index: {
                path: '/test',
                end: function(req, res) {
                    var models = fs.readFileSync(PATHS.APP + '/models.json', 'utf-8');


                    res.end(models);
                }
            }
        }
    }

});