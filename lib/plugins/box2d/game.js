ig.module(
    'plugins.box2d.game'
)
.requires(
    'plugins.box2d.lib',
    'impact.game'
)
.defines(function(){

    ig.Game.inject({

        allowSleep: true,
        collisionRects: [],
        debugCollisionRects: false,

        checkEntities: function() {},

        loadLevel: function(data) {
            // Find the collision layer and create the box2d world from it
            for (var i = 0; i < data.layer.length; i++) {
                var ld = data.layer[i];
                if (ld.name == 'collision') {
                    ig.world = this.createWorldFromMap(ld.data, ld.width, ld.height, ld.tilesize);
                    break;
                }
            }
            this.parent(data);
            this.setupContactListener();
        },

        update: function() {
            ig.world.Step(ig.system.tick, 5, 5);
            ig.world.ClearForces();
            this.parent();
        },

        draw: function() {
            this.parent();

            if (this.debugCollisionRects) {
                // Draw outlines of all collision rects
                var ts = this.collisionMap.tilesize;
                for (var i = 0; i < this.collisionRects.length; i++) {
                    var rect = this.collisionRects[i];
                    ig.system.context.strokeStyle = '#00ff00';
                    ig.system.context.strokeRect(
                        ig.system.getDrawPos(rect.x * ts - this.screen.x),
                        ig.system.getDrawPos(rect.y * ts - this.screen.y),
                        ig.system.getDrawPos(rect.width * ts),
                        ig.system.getDrawPos(rect.height * ts));
                }
            }
        },

        setupContactListener: function() {
            var callback = function(method, contact, argument) {
                var a = contact.GetFixtureA().GetBody().entity;
                var b = contact.GetFixtureB().GetBody().entity;
                if(a && b) {
                    a[method](b, contact, argument);
                    b[method](a, contact, argument);
                } else if(a && !b) {
                    a[method](null, contact, argument);
                } else if(b && !a) {
                    b[method](null, contact, argument);
                }
            };
            var listener = new Box2D.Dynamics.b2ContactListener();
            listener.BeginContact = function(contact) {
                callback('beginContact', contact);
            };
            listener.EndContact = function(contact) {
                callback('endContact', contact);
            };
            listener.PostSolve = function(contact, impulse) {
                callback('postSolve', contact, impulse);
            };
            listener.PreSolve = function(contact, oldManifold) {
                callback('preSolve', contact, oldManifold);
            };
            ig.world.SetContactListener(listener);
        },

        createWorldFromMap: function(origData, width, height, tilesize) {

            // Gravity is applied to entities individually.
            var gravity = new Box2D.Common.Math.b2Vec2(0, 0);
            var world = new Box2D.Dynamics.b2World(gravity, this.allowSleep);

            // We need to delete those tiles that we already processed. The original
            // map data is copied, so we don't destroy the original.
            var data = ig.copy(origData);

            // Get all the Collision Rects from the map
            this.collisionRects = [];
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    // If this tile is solid, find the rect of solid tiles starting
                    // with this one
                    if (data[y][x]) {
                        var r = this._extractRectFromMap(data, width, height, x, y);
                        this.collisionRects.push(r);
                    }
                }
            }

            // Go through all rects we gathered and create Box2D objects from them
            for (var i = 0; i < this.collisionRects.length; i++) {
                var rect = this.collisionRects[i];

                var bodyDef = new Box2D.Dynamics.b2BodyDef();
                bodyDef.position.Set(
                    rect.x * tilesize * Box2D.SCALE + rect.width * tilesize / 2 * Box2D.SCALE,
                    rect.y * tilesize * Box2D.SCALE + rect.height * tilesize / 2 * Box2D.SCALE);

                var body = world.CreateBody(bodyDef);
                var shape = new Box2D.Collision.Shapes.b2PolygonShape();
                shape.SetAsBox(
                    rect.width * tilesize / 2 * Box2D.SCALE,
                    rect.height * tilesize / 2 * Box2D.SCALE);
                body.CreateFixture2(shape);
            }

            return world;
        },

        _extractRectFromMap: function(data, width, height, x, y) {
            var rect = {
                x: x,
                y: y,
                width: 1,
                height: 1
            };

            // Find the width of this rect
            for (var wx = x + 1; wx < width && data[y][wx]; wx++) {
                rect.width++;
                data[y][wx] = 0; // unset tile
            }

            // Check if the next row with the same width is also completely solid
            for (var wy = y + 1; wy < height; wy++) {
                var rowWidth = 0;
                for (wx = x; wx < x + rect.width && data[wy][wx]; wx++) {
                    rowWidth++;
                }

                // Same width as the rect? -> All tiles are solid; increase height
                // of this rect
                if (rowWidth == rect.width) {
                    rect.height++;

                    // Unset tile row from the map
                    for (wx = x; wx < x + rect.width; wx++) {
                        data[wy][wx] = 0;
                    }
                } else {
                    return rect;
                }
            }
            return rect;
        }

    });

    // Using Box2D.SCALE == 0.1, the maximum speed any body may
    // move will be approximately (max * 300) pixels per second.
    var max = 10; // default 2
    Box2D.Common.b2Settings.b2_maxTranslation = max;
    Box2D.Common.b2Settings.b2_maxTranslationSquared = max * max;

});

