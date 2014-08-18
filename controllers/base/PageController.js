var Controller = require(PATHS.APP + '/controllers/base/Controller.js');

module.exports = helpers.extendController(Controller, {

    name: 'PageController',

    isAbstract: true,

    // pageName: STRING, required, for css / js includes

    // path: STRING, required

    // template: STRING, required

    // priority: STRING,

    // type: STRING || ARRAY, example: 'GET'; ['GET', 'POST']

    // adlCSS: ARRAY,

    // adlJS: ARRAY,

    buildPageCSS: function() {
        var result,
            baseCSS = ['base.css', 'temp.css'],
            pageName = this.pageName;

        result = _.union(baseCSS, this.adlCSS || []);

        if (pageName) result.push('pages/' + pageName + '.css');

        result = result.map(function(link) {
            return '/css/' + link;
        });

        return result;
    },

    buildPageJS: function() {
        var result,
            baseJS = [
                'vendor/jquery-2.0.0.js',
                'vendor/underscore-1.4.4.min.js',
                'vendor/handlebars-1.0.0-rc.3.js',
                'base.js'
            ],
            pageName = this.pageName;

        result = _.union(baseJS, this.adlJS || []);

        if (pageName) result.push(pageName + '.js');

        result = result.map(function(link) {
            return '/js/' + link;
        });

        return result;
    },

    middlewares: function(req) {
        var result = [].concat(this._super.apply(this, arguments) || []);

        result.push('partials', 'flash');

        return result;
    },

    mapping: function() {
        var result = null;

        if (this.path) {
            result = {
                index: {
                    path: this.path,
                    priority: this.priority || 1,
                    type: this.type || 'GET'
                }
            };
        }

        return result;
    },

    end: function(req, res) {
        var that = this,
            messagesTempStorage,
            params = req.stor.params || {};

        params.css = params.hasOwnProperty('css') ? params.css : this.buildPageCSS();
        params.js = params.hasOwnProperty('js') ? params.js : this.buildPageJS();

        if (req.flash) {
            params.messages = {};

            if ((messagesTempStorage = req.flash('status')).length) params.messages.status = messagesTempStorage;
            if ((messagesTempStorage = req.flash('info')).length) params.messages.info = messagesTempStorage;
            if ((messagesTempStorage = req.flash('error')).length) params.messages.error = messagesTempStorage;
        }

        params.pageName = this.pageName || null;

        res.render(that.template || 'pages/' + that.pageName, params);
    }

});