ig.module(
	'game.entities.robot'
	)
.requires(
	//'impact.entity',
	'plugins.box2d.entity'
	)
.defines(function(){
	EntityRobot = ig.Entity.extend({

		animSheet: new ig.AnimationSheet( 'media/RedEvilRobot.png', 16, 16 ),
		size: {x: 8, y: 14},
		offset: {x: 4, y: 2},
		maxVel: {x: 100, y: 400},
		flip: false,
		friction: {x: 150, y: 0},
		speed: 1,
		type: ig.Entity.TYPE.B,
		checkAgainst: ig.Entity.TYPE.A,
		isFixedRotation: true,
		categoryBits: 0x0002,	// collsion type enemy
		maskBits: 0x0001,		// collides with player

		

		init: function( x, y , settings ) {
			this.parent( x, y, settings );
			this.addAnim( 'walk', .07, [0,1,2,3,4,5,6]);

			

		},

		update: function() {
			// 1st attempt at collision filtering
			this.b2FilterData();

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

		b2FilterData :function(){
			this.parent();
		},

	});
});