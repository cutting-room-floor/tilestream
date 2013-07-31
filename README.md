TileStream
----------
TileStream is a high-performance map tile server powered by [MBTiles][1] files.

It's like TileCache, TileStache, and other map servers in that it serves normal
image files that can be used in OpenLayers, Google Maps, Modest Maps, and other
Javascript APIs without much trouble - and with lots of enhancements when you
use [Wax](http://mapbox.com/wax/).

It's not like those tile servers in that it doesn't yet generate maps, it only
serves maps that are generated with [TileMill](http://mapbox.com/tilemill).
This means that it's reliably fast but not designed to serve live data.

[MapBox Hosting](http://mapbox.com/hosting/) uses the same internals as
TileStream but adds many features and is a hosted service rather than an
installable application.


Features
--------
- MBTiles-based tile server
- Minimal gallery view and map viewer for tiles
- Support for MBTiles interaction using [Wax][2]


Requirements
------------
- *TileStream client*
  - Tested: Chrome 6+, Firefox 3+, IE8+
  - May work: Opera 11
- *TileStream server*
  - Tested: Mac OS X 10.6, Ubuntu 10.04, Ubuntu 11.04
  - Tested: node 0.8.x
  - At least 613MB memory
  - May work: Older versions, other POSIX-compliant systems


Installation: Mac OS X 10.6
---------------------------
Install [Xcode][3] for Mac OS X.

Install [node][4]. If you are using [HomeBrew][12], use these steps:

    brew install node       # Installs the latest node: should be v0.8.x
    brew versions node      # Find all the different versions of node available
    brew switch node 0.8.15  # set current node version


Install TileStream:

    git clone https://github.com/mapbox/tilestream.git
    cd tilestream
    npm install

Start TileStream:

    ./index.js (if running from the source copy)

Get options:

    ./index.js start --help

TileStream should now be accessible from a browser at `http://localhost:8888`.


Installation: Ubuntu 10.04
--------------------------
Install build requirements:

    sudo apt-get install curl build-essential libssl-dev libsqlite3-0 libsqlite3-dev git-core

Install node:

    sudo apt-add-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs nodejs-dev npm

Install TileStream:

    git clone https://github.com/mapbox/tilestream.git
    cd tilestream
    npm install

Start TileStream:

    ./index.js (if running from the source copy)

Get options:

    ./index.js start --help
    

Ubuntu alternate installation procedure
---------------------------------------

An alternate option is to use a nodeenv (which functions somewhat like python virtualenv). Using
this approach will ensure that you get the correct version of node needed by tilestream and 
will allow you to install more than one node based application on your host without worrying
about conflicting node versions. A simple installation process would work like this::
    
    sudo apt-get install curl build-essential libssl-dev libsqlite3-0 libsqlite3-dev git-core python-pip
    sudo pip install nodeenv
    git clone http://github.com/mapbox/tilestream.git
    cd tilestream
    nodeenv env --node=0.8.15
    . env/bin/activate
    npm install
    

If something goes wrong do a  ```rm -rf node_modules``` then fix the underlying issue 
and rerun ```npm install```.

Now you can start Tilestream::
    
    ./index.js start

Some handy options::
    
    ./index.js start --uiPort=[80] --tilePort=[80] --tiles=/usr/share/tilestream

The above example specifies custom ports for the user interface and the tile store, and
also demonstrates how to specify a directory other than :file:`~/Documents/MapBox/tiles`
for the mbtiles directory.


Custom configuration
--------------------

If you intend to run TileStream as a server on a hostname or an IP rather than
as localhost, specify that hostname when you run TileStream:

    tilestream --host 127.0.0.1
    tilestream --host yourhost.com


In these examples, you would only be able to access tilestream from `127.0.0.1`
or `yourhost.com`, respectively, due to security restrictions.


Usage
-----
MBTiles files should be placed in the `~/Documents/MapBox/tiles` directory,
which is created at first run. Each tileset can be previewed at
`http://localhost:8888/map/[filename]` where `[filename]` is the name of the
tileset file without the `.mbtiles` extension.

Tileset filenames:

- May contain letters (lower or upper case), numbers, underscores or dashes.

        world-light.mbtiles
        control_room.mbtiles
        PartyLikeIts1999.mbtiles

- May not contain periods, spaces, non ASCII characters or other punctuation.

        World Light.mbtiles
        BlueWorld-1.0.mbtiles

To see the options available for use with TileStream, run

    ./index.js start --help


Tests
-----
TileStream tests use [Expresso][6].

    cd tilestream
    npm install expresso
    npm test


### Deployment

See the `configuration_examples` directory for configuration examples with
[nginx](http://nginx.net) and upstart.


Troubleshooting
---------------

If you run into problems during install, such as unfound dependent versions, first try deleting the node_modules/ folder and re-run `node install`. It seems that some errors leave the installation in an unclean state (for example if you accidentally switched node versions during the install in the hopes of making things work!).

### Build Failures

`npm install` may cause:

    Waf: Leaving directory '/Users/sundar/Projects/tilestream/node_modules/sqlite3/build'
    Build failed:
    -> task failed (err #1):
    {task: cxx statement.cc -> statement_1.o}
    -> task failed (err #1):
    {task: cxx database.cc -> database_1.o}
    -> task failed (err #1):
    {task: cxx sqlite3.cc -> sqlite3_1.o}
    npm ERR! sqlite3@2.1.1 preinstall: `node-waf clean || (exit 0); node-waf configure build`
    npm ERR! `sh "-c" "node-waf clean || (exit 0); node-waf configure build"` failed with 1
    npm ERR!
    npm ERR! Failed at the sqlite3@2.1.1 preinstall script.

Manually installing sqlite3 via npm install sqlite3 resolved this issue. Then re-run npm install in the tilestream folder:

    npm install sqlite3
    npm install

If you STILL get errors when launching index.js, there may be more modules to install manually. This is the list that worked for me:

    npm install sqlite3
    npm install mbtiles
    npm install jsdom
    npm install uglify-js
    npm install connect
    npm install qs
    npm install mime

But again, all this headache may be solved by just deleting your node_modules/ folder and re-running `node install`.

Contributors
------------
- [Young Hahn][7]
- [Tom MacWright][8]
- [Will White][9]
- [Konstantin Käfer][10]
- [Dane Springmeyer][11]


[1]:http://mbtiles.org
[2]:https://github.com/mapbox/wax
[3]:http://developer.apple.com/technologies/tools/xcode.html
[4]:https://github.com/joyent/node/wiki/Installation
[5]:http://npmjs.org/
[6]:http://visionmedia.github.com/expresso
[7]:https://github.com/yhahn
[8]:https://github.com/tmcw
[9]:https://github.com/willwhite
[10]:https://github.com/kkaefer
[11]:https://github.com/springmeyer
[12]:https://github.com/mxcl/homebrew
