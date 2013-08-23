ig.module(
	'game.entities.player'
	)
.requires(
	'impact.sound',
	//'impact.entity',
	'plugins.box2d.entity'
)
.defines(function(){
	EntityPlayer = ig.Entity.extend({
		startPosition: null,
		animSheet: new ig.AnimationSheet( 'media/RedPlayerRocket_3.png', 16, 16 ),
		size: {x: 8, y: 16},
		offset: {x: 4, y: 0},					// seems like size and/or collision box is off... 1/24/2013
		flip: false,
		maxVel: {x: 10, y: 10},		// this may be useless for box 2D entities
		friction: 0.7,				// this may be useless for box 2D entities
		accelGround: 20,			// this may be useless for box 2D entities
		accelAir: 10,				// this may be useless for box 2D entities
		jump: 20,					// jumping originally set to 500 in non-physics engine
		health: 20,
		weapon: 2,
		totalWeapons: 3,
		activeWeapon: "EntityRocket",
		type: ig.Entity.TYPE.A,
		checkAgainst: ig.Entity.TYPE.NONE,
		collides: ig.Entity.COLLIDES.NEVER,		// was previously passive
		invincible: true,
		invincibleDelay: 2,
		invincibleTimer: null,
		punchTimer: null,
		debugCollisionRects: true,
		speedLimit: 10,
		punchAnimStop: 1,

		jumpSFX: new ig.Sound( 'media/sounds/jump.*' ),
		shootSFX: new ig.Sound( 'media/sounds/shoot.*' ),
		deathSFX: new ig.Sound( 'media/sounds/death.*' ),

		// createBody: function(){
			// var redManDef = new b2.BodyDef();

			// redManDef.position.Set(
			// 	(this.pos.x + this.size.x/2 )*b2.SCALE,
			// 	(this.pos.y + this.size.y/2 )*b2.SCALE
			// );
			// redManDef.userData = "REDMAN"
			// this.body = ig.world.CreateBody( redManDef );

			// var redManShapeDef = new b2.PolygonDef();		// this needs to go in createBody: function(){};
			// redManShapeDef.SetAsBox(8.0,16.0);
			// redManShapeDef.friction = 0.5;
			// redManShapeDef.density = 1;
			// this.body.CreateShape( redManShapeDef );
			// this.body.SetMassFromShapes();

		// },
		
		init: function( x, y, settings) {
			this.startPosition = {x:x, y:y};
			this.parent( x, y, settings );
			this.setupAnimation(this.weapon);
			this.invincibleTimer = new ig.Timer();
			this.makeInvincible();
		},

		setupAnimation: function( offset ) {
			offset = offset * 7;
			this.addAnim('idle', 1, [0+offset] );
			this.addAnim('run', .1, [0+offset,1+offset,0+offset,2+offset] );
			this.addAnim('jump', 1, [3+offset] );
			this.addAnim('fall', 1, [5+offset] );
			this.addAnim('duck', 1, [4+offset] );
			this.addAnim('punch', 1, [6+offset] );
		},		

		update: function() {
			//move left or right
			//var accel = this.standing ? this.accelGround : this.accelAir;
			if( ig.input.state('left') && ( this.body.m_linearVelocity.x > -this.speedLimit ) ) {

				//this.accel.x = -accel;													// non physics movement
				this.body.ApplyImpulse( new b2.Vec2(-1,0), this.body.GetPosition() );		// Box 2D apply force
				//this.body.m_linearVelocity.x = -accel;
				this.flip = true;

			}else if( ig.input.state('right') && (this.body.m_linearVelocity.x < this.speedLimit ) ) {

				//this.accel.x = accel;
				this.body.ApplyImpulse( new b2.Vec2(1,0), this.body.GetPosition() );
				//this.body.m_linearVelocity.x = accel;
				this.flip = false;

			}else{
				this.accel.x = 0;
			}
			
			// jump
			//if( this.standing && ig.input.pressed('jump') ) {
			if( ig.input.pressed('jump') ) {

				//this.vel.y = -this.jump;
				this.body.ApplyImpulse( new b2.Vec2(0,-this.jump), this.body.GetPosition() );

				this.jumpSFX.play();
			}

			// // jetpack
			// if( ig.input.state('jump') ) {
			// 	this.body.ApplyForce( new b2.Vec2(0,-30), this.body.GetPosition() );
			// 	this.currentAnim = this.anims.jump;
			// }
			// else {
			// 	this.currentAnim = this.anims.idle;
			// }

			// switch weapon
			if( ig.input.pressed('switch') ) {
				this.weapon++;
				if(this.weapon >= this.totalWeapons)
					this.weapon = 0;
				switch(this.weapon) {
					case(0):
						this.activeWeapon = "EntityGrenade";
						break;
					case(1):
						this.activeWeapon = "EntityBullet";
						break;
					case(2):
						this.activeWeapon = "EntityRocket";
						break;
					break;
				}
				this.setupAnimation(this.weapon);
			}
			

			//this.body.m_linearVelocity.y

			// new code for detecting jump animation
			if( !this.punchAnimStop ) {
				this.currentAnim = this.anims.punch;
				this.punchAnimStop = this.punchTimer.delta() < 0.15 ? 0 : 1;
			}
			else if( this.body.m_linearVelocity.y < -0.1 ) {
				this.currentAnim = this.anims.jump;
			}else if( this.body.m_linearVelocity.y > 0.1) {
				this.currentAnim = this.anims.fall;
			//}else if( this.body.m_linearVelocity.x != 0 && (this.vel.y < 0.1 || this.vel.y > -0.1) ) {
			}else if( (this.body.m_linearVelocity.x != 0) && (this.body.m_linearVelocity.y < 2) && (this.body.m_linearVelocity.y > -2) ) {
				this.currentAnim = this.anims.run;	
			}else{
				this.currentAnim = this.anims.idle;
			}


			// original code for detecting jump animation
			// if( this.vel.y <0 ) {
			// 	this.currentAnim = this.anims.jump;
			// }else if( this.vel.y > 0) {
			// 	this.currentAnim = this.anims.fall;
			// //}else if( this.vel.x != 0 ) {
			// }else if( this.body.m_linearVelocity.x != 0 && (this.vel.y < 0.1 || this.vel.y > -0.1) ) {
			// 	this.currentAnim = this.anims.run;
			// }else{
			// 	this.currentAnim = this.anims.idle;
			// }

			// duck
			if( ig.input.state('duck') ) {
				this.currentAnim = this.anims.duck;
			}

			// shoot
			if( ig.input.pressed('shoot') ) {
				ig.game.spawnEntity( this.activeWeapon, this.pos.x+(this.flip ? -2 : 2 ), this.pos.y, {flip:this.flip} );
				this.shootSFX.play();
			}

			// punch
			if( ig.input.pressed('punch') ) {
				ig.game.spawnEntity( "EntityDragonPunch", this.pos.x, this.pos.y, {flip:this.flip, xInitVel:this.body.m_linearVelocity.x }); //xInitVel
				this.body.ApplyImpulse( new b2.Vec2(this.flip ? 1 : -1 ,0), this.body.GetPosition());
				this.punchTimer = new ig.Timer();
				this.currentAnim = this.anims.punch;
				this.punchAnimStop =  0;
			}

			// invincibility after death
			if(this.invincibleTimer.delta() > this.invincibleDelay ) {
				this.invincible = false;
				this.currentAnim.alpha = 1;
			}

			// move!
			this.currentAnim.flip.x = this.flip
			
			// This sets the position and angle. We use the position the object
			// currently has, but always set the angle to 0 so it does not rotate
			this.body.SetXForm(this.body.GetPosition(), 0);
		
			this.parent();
		},

		// this is where EntityBullet was previously
		
		kill: function () {
			this.deathSFX.play();
			this.parent();
			ig.game.respawnPosition = this.startPosition;
			//ig.game.spawnEntity(EntityDeathExplosion, this.pos.x, this.pos.y, {callBack:this.onDeath} );
			ig.game.spawnEntity(EntityDeathExplosionKWS, this.pos.x, this.pos.y, {callBack:this.onDeath} );		// KWS
		},

		onDeath: function() {
			ig.game.stats.deaths ++;
			ig.game.lives --;
			if( ig.game.lives < 0 ){
				ig.game.gameOver();
			} else {
				ig.game.spawnEntity( EntityPlayer, ig.game.respawnPosition.x, ig.game.respawnPosition.y	);
			}
		},

		makeInvincible: function() {
			this.invincible = true;
			this.invincibleTimer.reset();
		},

		receiveDamage: function(amount, from) {
			if(this.invincible)
				return;
			this.parent(amount, from);
		},

		// // KWS - code to apply force from explosion
		// receiveImpulse: function(amount, from, direction) {
		// 	this.parent(amount, from, direction);
		// 	this.body.ApplyImpulse( direction, this.body.GetPosition() );
		// },

		draw: function(){
			if(this.invincible)
				this.currentAnim.alpha = this.invincibleTimer.delta()/this.invincibleDelay*1;
			this.parent()
		},
	});

	EntityBullet = ig.Entity.extend({

		size: {x: 5, y: 4},
		animSheet: new ig.AnimationSheet( 'media/bullet.png', 5, 3),
		maxVel:{x:200, y: 0},

		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.B,
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

	EntityGrenade = ig.Entity.extend({

		// define size
		size: {x: 4, y: 4},
		offset: {x: 2, y: 2},
		animSheet: new ig.AnimationSheet( 'media/grenade.png', 8, 8),

		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.BOTH,
		collides: ig.Entity.COLLIDES.PASSIVE,

		maxVel: {x: 200, y: 200},
		bounciness: 0.6,
		bounceCounter: 0,
		//this.accel.x = 0,

		init: function(x, y, settings){
			this.parent(x + (settings.flip ? -4 : 7), y, settings );
			this.vel.x = (settings.flip ? -this.maxVel.x : this.maxVel.x );
			this.vel.y = -(50 + (Math.random()*100) );
			this.addAnim( 'idle', 0.2, [0,1] );
		},

		handleMovementTrace: function( res ) {
			this.parent( res );
			if( res.collision.x || res.collision.y ) {
				// only bounce 3 times
				this.bounceCounter++;
				if( this.bounceCounter > 3 ) {
					this.kill();
				}
			}
		},

		kill: function(){
			for(var i = 0; i < 20; i++)
				ig.game.spawnEntity( EntityGrenadePartice, this.pos.x, this.pos.y );
			this.parent();
		},

		check: function( other ) {
			other.receiveDamage( 10, this );
			this.kill();
		},
	});

	EntityGrenadePartice = ig.Entity.extend({
		size: {x: 1, y: 1},
		maxVel: {x: 160, y: 200},
		lifetime: 1,
		fadetime: 1,
		bounciness: 0.3,
		vel: {x: 40, y: 50 },
		checkAgainst: ig.Entity.TYPE.B,
		collides: ig.Entity.COLLIDES.LITE,
		animSheet: new ig.AnimationSheet( 'media/explosion.png', 1, 1 ),
		
		init: function( x, y, settings ){
			this.parent( x, y, settings );
			this.vel.x = ( Math.random() * 4 - 1) * this.vel.x;
			this.vel.y = ( Math.random() * 10 - 1) *  this.vel.y;
			this.idleTimer = new ig.Timer();
			var frameID = Math.round(Math.random()*7);
			this.addAnim( 'idle', 0.2, [frameID] );
		},
		
		update: function() {
			if( this.idleTimer.delta() > this.lifetime ) {
				this.kill();
				return;
			}
			this.currentAnim.alpha = this.idleTimer.delta().map(
				this.lifetime - this.fadetime, this.lifetime, 1, 0
			);
			this.parent();
		},
	});

	EntityRocket = ig.Entity.extend({

		// define size
		size: {x: 6, y: 6},
		offset: {x: 0, y: -5},
		animSheet: new ig.AnimationSheet( 'media/rocket.png', 8, 8),

		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.BOTH,
		collides: ig.Entity.COLLIDES.PASSIVE,

		maxVel: {x: 1200, y: 800},
		bounciness: 0,
		bounceCounter: 0,
		smokeRate: 0.05,
		smokeOffsetX: 20,
		//this.accel.x = 0,

		init: function(x, y, settings){
			this.parent(x + (settings.flip ? -7 : 7), y, settings );
			//this.vel.x = (settings.flip ? -this.maxVel.x : this.maxVel.x );
			this.vel.x = (settings.flip ? -200 : 200 );		// KWS adding this
			this.vel.y = -(-60+ (Math.random()*15) );
			this.addAnim( 'idle', 0.2, [0,1] );
			this.accel.x = (settings.flip ? -150 : 150 ); 					// KWS
			this.accel.y = -280;					// KWS

			//ig.game.spawnEntity(EntityRocketSmoke, this.pos.x, this.pos.y );	// KWS rocket smoke code, want to put this in update loop
			this.idleTimer = new ig.Timer();

		},

		handleMovementTrace: function( res ) {
			this.parent( res );
			if( res.collision.x || res.collision.y ) {
				// only bounce 3 times
				this.bounceCounter++;
				if( this.bounceCounter > 1 ) {
					this.kill();
				}
			}
		},

		update: function(x, y, settings){
			this.currentAnim.flip.x = this.flip;
			this.parent();
			if( this.idleTimer.delta() > this.smokeRate ) {
				ig.game.spawnEntity(EntityRocketSmoke, this.pos.x + (this.flip ? this.smokeOffsetX : -this.smokeOffsetX), this.pos.y );
				this.idleTimer.reset();
			}
		},

		kill: function(){
			for(var i = 0; i < 20; i++)
				ig.game.spawnEntity( EntityGrenadePartice, this.pos.x , this.pos.y );
			this.parent();
		},

		check: function( other ) {
			other.receiveDamage( 10, this );
			this.kill();
		},
	});

	EntityRocketSmoke = ig.Entity.extend({

		size: {x: 8, y: 8},
		offset: {x: 4, y: -4},
		animSheet: new ig.AnimationSheet( 'media/rocketSmoke_2.png', 8, 8),

		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.NONE,
		collides: ig.Entity.COLLIDES.NONE,

		maxVel: {x: 0, y: 25},
		bounciness: 0,

		lifetime: 1,
		fadetime: 0.5,
		callBack: null,

		init: function( x, y, settings ) {
			this.parent( x, y, settings );
			var frameOffset = 5;
			this.addAnim( 'idle', 0.1, [0, 0+frameOffset, 1, 1+frameOffset, 2, 2+frameOffset, 3, 3+frameOffset, 4, 4+frameOffset] );
			this.vel.x = 0;
			this.vel.y = 0;
			this.accel.y = -5
			this.idleTimer = new ig.Timer();  // timer to spawn rocket smoke - KWS
		},

		update: function() {

			this.currentAnim.alpha = this.idleTimer.delta().map( this.lifetime - this.fadetime, this.lifetime, 1, 0 );
			this.parent();

			if( this.idleTimer.delta() > this.lifetime ) {
				this.kill();
				if(this.callBack)
					this.callBack();
				return;
			}

		},
		
	});

	EntityDragonPunch = ig.Entity.extend({

		// define size
		size: {x: 6, y: 6},
		offset: {x: 0, y: -5},
		animSheet: new ig.AnimationSheet( 'media/fireball_1.png', 10, 10),		// want to change this to flames

		type: ig.Entity.TYPE.NONE,
		checkAgainst: ig.Entity.TYPE.B,
		collides: ig.Entity.COLLIDES.PASSIVE,

		maxVel: {x: 1000, y: 0},
		bounciness: 0,
		bounceCounter: 0,
		smokeRate: 0.05,
		smokeOffsetX: 20,
		lifetime: 1,
		xInitVel: 70,
		xAccel: 80,
		

		init: function(x, y, settings){
			this.parent(x + (settings.flip ? -7 : 7), y, settings );
			this.vel.x = (settings.flip ? -this.xInitVel : this.xInitVel );											// KWS adding this
			//this.vel.x = (this.parent.x + (settings.flip ? -0 : 0));							// KWS adding this - didn't work in box 2D
			//this.vel.x = (this.parent.m_linearVelocity.x + (settings.flip ? -0 : 0));			// KWS adding this - didn't work in box 2D
			//this.vel.x = (this.parent.vel.x + (settings.flip ? -0 : 0));						// KWS adding this - didn't work in box 2D
			this.vel.y = 0;
			this.addAnim( 'idle', 0.2, [0,1,2,3,4] );
			this.accel.x = (settings.flip ? -this.xAccel : this.xAccel ); 		// KWS
			this.accel.y = 0;									// KWS

			//ig.game.spawnEntity(EntityRocketSmoke, this.pos.x, this.pos.y );	// KWS rocket smoke code, want to put this in update loop
			this.idleTimer = new ig.Timer();

		},

		handleMovementTrace: function( res ) {
			this.parent( res );
		},

		update: function(x, y, settings){
			this.currentAnim.flip.x = this.flip;
			this.parent();
			// if( this.idleTimer.delta() > this.smokeRate ) {
			// 	ig.game.spawnEntity(EntityRocketSmoke, this.pos.x + (this.flip ? this.smokeOffsetX : -this.smokeOffsetX), this.pos.y );
			// 	this.idleTimer.reset();
			// }
			if( this.idleTimer.delta() > this.lifetime ) {
				this.kill();
				if(this.callBack)
					this.callBack();
				return;
			}
		},

		kill: function(){
			this.parent();
		},

		check: function( other ) {
			other.receiveDamage( 50, this );
			this.kill();
		},
	});

	EntityDeathExplosion = ig.Entity.extend({
		lifetime: 1,
		callBack: null,
		particles: 50,
		
		init: function( x, y, settings ) {
			this.parent( x, y, settings );
			for(var i = 0; i < this.particles; i++)
				ig.game.spawnEntity(EntityDeathExplosionParticle, x, y, {colorOffset: settings.colorOffset ? settings.colorOffset : 0});
				this.idleTimer = new ig.Timer();
		},

		update: function() {
			if( this.idleTimer.delta() > this.lifetime ) {
				this.kill();
				if(this.callBack)
					this.callBack();
				return;
			}
		},
	});

	EntityDeathExplosionParticle = ig.Entity.extend({
		size: {x: 2, y: 2},
		maxVel: {x: 160, y: 200},
		lifetime: 2,
		fadetime: 1,
		bounciness: 0,
		vel: {x: 100, y: 30},
		friction: {x: 100, y: 0},
		collides: ig.Entity.COLLIDES.LITE,
		colorOffset: 0,
		totalColors: 7,
		animSheet: new ig.AnimationSheet( 'media/blood.png', 2, 2 ),

		init: function( x, y, settings ) {
			this.parent( x, y, settings );
			var frameID = Math.round(Math.random()*this.totalColors) + (this.colorOffset*(this.totalColors+1));
			this.addAnim( 'idle', 0.2, [frameID] );
			this.vel.x = (Math.random() * 2 - 1) * this.vel.x;
			this.vel.y = (Math.random() * 2 - 1) * this.vel.y;
			this.idleTimer = new ig.Timer();
		},

		update: function() {
			if( this.idleTimer.delta() > this.lifetime ) {
				this.kill();
				return;
			}
			this.currentAnim.alpha = this.idleTimer.delta().map(
				this.lifetime - this.fadetime, this.lifetime, 1, 0 
			);
			this.parent();
		},
	});

	// adding player giblets KWS
	EntityDeathExplosionKWS = ig.Entity.extend({
		lifetime: 2,
		callBack: null,
		particles: 8,
		
		init: function( x, y, settings ) {
			this.parent( x, y, settings );
			for(var i = 0; i < this.particles; i++)
				ig.game.spawnEntity(EntityDeathExplosionParticleKWS, x, y, {colorIndex: i });
				this.idleTimer = new ig.Timer();
		},

		update: function() {
			if( this.idleTimer.delta() > this.lifetime ) {
				this.kill();
				if(this.callBack)
					this.callBack();
				return;
			}
		},
	});


	EntityDeathExplosionParticleKWS = ig.Entity.extend({
		size: {x: 2, y: 2},
		maxVel: {x: 160, y: 200},
		lifetime: 5,
		fadetime: 2,
		bounciness: 1,
		vel: {x: 100, y: 50},
		friction: {x: 100, y: 0},
		collides: ig.Entity.COLLIDES.LITE,
		colorIndex: 0,
		animSheet: new ig.AnimationSheet( 'media/RedPlayerGiblets.png', 8, 8 ),

		// init: function( x, y, settings ) {
		// 	this.parent( x, y, settings );
		// 	var frameID = Math.round(Math.random()*this.totalColors) + (this.colorOffset*(this.totalColors+1));
		// 	this.addAnim( 'idle', 0.2, [frameID] );
		// 	this.vel.x = (Math.random() * 2 - 1) * this.vel.x;
		// 	this.vel.y = (Math.random() * 2 - 1) * this.vel.y;
		// 	this.idleTimer = new ig.Timer();
		// },

		// KWS changing init function - want it to spawn 1 of each giblet in .png
		init: function( x, y, settings ) {
			this.parent( x, y, settings );
			var frameID = this.colorIndex ;
			this.addAnim( 'idle', 0.2, [frameID] );
			this.vel.x = (Math.random() * 2 - 1) * 1.5 * this.vel.x;
			this.vel.y = (Math.random() * 2 - 1) * this.vel.y;
			this.idleTimer = new ig.Timer();
		},

		update: function() {
			if( this.idleTimer.delta() > this.lifetime ) {
				this.kill();
				return;
			}
			this.currentAnim.alpha = this.idleTimer.delta().map(
				this.lifetime - this.fadetime, this.lifetime, 1, 0 
			);
			this.parent();
		},
	});


});