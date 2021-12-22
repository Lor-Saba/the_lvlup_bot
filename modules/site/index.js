const express = require('express');
const exphbs  = require('express-handlebars');
const path    = require('path');
const helpers = require('./helpers');
const routes  = require('./routes');
// modulo con vari metodi di utilità
const utils = require('../utils');

const app = express();
const hbs = exphbs.create({ helpers, extname: '.hbs' });

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine("hbs", hbs.engine);
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "hbs");

/**
 * 
 * @param {string} path 
 * @param {function} preRender 
 * @param {function} callback 
 */
function on(name, config){

    if (!(config && config.constructor === Object)) return;
    if (!routes[name]) return;

    routes[name].getHandler   = config.get  || null;
    routes[name].postHandler  = config.post || null;
}

/**
 * 
 * @param {number} port 
 */
function init(port){
    return new Promise(ok => {

        utils.each(routes, function(name, route){

            if (route.getHandler) {
                app.get(route.path, function (req, res) {
                    let data = route.getHandler(req.params, route);

                    if (data != false) {
                        res.render(route.view, Object.assign(data || {}, { viewName: route.view }));
                    } else {
                        res.render('404', data);
                    }                    
                });                
            }

            if (route.postHandler) {
                app.post(route.path, function (req, res) {
                    let data = route.postHandler(req, res, route);
                    let result = null;

                    if (data != false) {
                        result = { data: options };
                        res.status(200);
                        // ok
                    } else {
                        result = { error: true, data: options }
                        res.status(501);
                        // error
                    }      

                    res.json(result);
                });
            }

        });

        app.use(express.static(path.join(__dirname, 'public/')));
        app.use((req, res) => res.render('404', {})); 
        app.listen(Number(port), ok);
    });
}


module.exports = {
    init,
    on
};