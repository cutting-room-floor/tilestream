// MBTiles db connection pools. Each db is given a pool based on its filename
// limited to 5 connections.
//
// *TODO* This only limits the number of connections to a single given
// database. The number of open files can surpass a safe level if many distinct
// databases are being requested.
module.exports = function(max) {
    return {
        max: max || 5,
        pools: {},
        acquire: function(id, options, callback) {
            if (!this.pools[id]) {
                var that = this;
                this.pools[id] = require('generic-pool').Pool({
                    name: id,
                    create: options.create,
                    destroy: options.destroy,
                    max: that.max,
                    idleTimeoutMillis: 5000,
                    log: false
                });
            }
            this.pools[id].acquire(callback);
        },
        release: function(id, obj) {
            this.pools[id] && this.pools[id].release(obj);
        }
    }
}

