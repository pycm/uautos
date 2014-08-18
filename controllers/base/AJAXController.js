var Controller = require(PATHS.APP + '/controllers/base/Controller.js');

module.exports = helpers.extendController(Controller, {

    name: 'AJAXController',

    isAbstract: true,

    end: function(req, res) {
        res.json(req.stor.json);
    }

});
