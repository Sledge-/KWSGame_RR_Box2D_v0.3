ig.module(
	'game.entities.orangerobot'
	)
.requires(
	//'impact.entity',
	'plugins.box2d.entity'
	)
.defines(function(){
	EntityOrangerobot = ig.Entity.extend({
		animSheet: new ig.AnimationSheet( 'media/OrangeEvilRobot2.png', 16, 16 ),
		size: {x: 8, y: 14},
		offset: {x: 4, y: 2},
		maxVel: {x: 100, y: 100},
		flip: false,
		friction: {x: 150, y: 0},
		speed: 40,
		updateShootTimer: 1,
		type: ig.Entity.TYPE.B,
		checkAgainst: ig.Entity.TYPE.A,
		collides: ig.Entity.COLLIDES.PASSIVE,
		isFixedRotation: true,
		categoryBits: 0x002,	// collsion type enemy
		maskBits: 0x000,		// collides with player

		init: function( x, y , settings ) {
			this.parent( x, y, settings );
			this.addAnim( 'walk', .07, [0,1,2,3,4,5,6]);
			this.addAnim( 'shoot', .5, [7]);
			this.idleTimer = new ig.Timer();

		},

		update: function() {
			// near an edge? return
			if( !ig.game.collisionMap.getTile(
				this.pos.x + (this.flip ? -2 : this.size.x +2),
				this.pos.y + this.size.y+1
				)
			) {
				this.flip = !this.flip;
			}
			var xdir = this.flip ? -1 : 1;
			this.body.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(this.speed * xdir, 0));
			this.currentAnim.flip.x = this.flip;

			if( this.updateShootTimer == 1 ){
				this.idleTimer.set(4);
				this.updateShootTimer = 0;
			} else if ( this.idleTimer.delta() > 0 && this.updateShootTimer == 0 ){
				if(this.updateShootTimer == 0){
					//ig.game.spawnEntity( EntityBullet, this.pos.x+(this.flip ? -2 : 2 ), this.pos.y, {flip:this.flip} );	
				}
				this.updateShootTime = 1;	
				this.currentAnim = this.anims.shoot;
			}
			this.parent();
		},

		handleMovementTrace: function( res ) {
			this.parent( res );
			// collision with a wall? return
			if( res.collision.x ) {
				this.flip = !this.flip;
			}
		},

		receiveDamage: function( value ) {
			this.parent( value );
			if(this.health > 0 )
				ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {particles: 2, colorOffset: 1});
		},

		kill: function(){
			ig.game.stats.kills ++;
			this.parent();
			ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {particles: 15, colorOffset: 0});
		},

		check: function( other ) {
			other.receiveDamage( 10, this );
		},


	});

	EntityBullet = ig.Entity.extend({

		size: {x: 5, y: 4},
		animSheet: new ig.AnimationSheet( 'media/bullet.png', 5, 3),
		maxVel:{x:200, y: 0},

		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.A,
		collides: ig.Entity.COLLIDES.PASSIVE,

		init: function(x , y, settings) {
			this.parent( x + (settings.flip ? -4: 8), y+8, settings );
			this.vel.x = this.accel.x = (settings.flip ? -this.maxVel.x : this.maxVel.x);
			this.addAnim( 'idle', 0.2, [0] );

		},

		handleMovementTrace: function( res ) {
			this.parent( res );
			if( res.collision.x || res.collision.y ){
				this.kill();
			}
		},

		check: function( other ) {
			other.receiveDamage( 3, this );
			this.kill();
		},

	});
});