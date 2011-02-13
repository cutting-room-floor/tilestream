module.exports = {
    'port': 9000,
    'UIPort': 9000,
    'tile_hostnames': [],
    'tiles': __dirname + '/tiles',
    'features': {
        'info': true,
        'download': true
    },
    'header_defaults': {
        'Expires': new Date(Date.now() +
            1000 // second
            * 60 // minute
            * 60 // hour
            * 24 // day
            * 365 // year
            )
    }
}

// Compile settings for variable assingment in browser.
module.exports.toJS = function() {
    return 'var Settings = ' + JSON.stringify(this);
}
