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
function on(name, preRender, callback){

    if (routes[name].name != name) return;

    routes[name].preRender = preRender || routes[name].preRender;
    routes[name].callback  = callback  || routes[name].callback;
}

/**
 * 
 * @param {number} port 
 */
function init(port){
    return new Promise(ok => {

        utils.each(routes, function(name, route){
            route.set = function(options){
                route.options = Object.assign(route.options, options);
            };
            app.get(route.path, function (req, res) {
                route.preRender(req.params, route);
                route.set({ viewName: route.name });
                res.render(route.view, route.options);
            });
        });

        // app.get('*',function (req, res) {
        //     res.render("index");
        // });

        app.use(express.static(path.join(__dirname, 'public/')));
        app.listen(Number(port), ok);
    });
}


module.exports = {
    init,
    on
};