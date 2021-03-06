var ship = {
	p_player:true,
	p_direction: 0,
	// power forward, back, left, right
	p_power: [100 , -30, -0.01, 0.01],
	p_spin: 0,
	p_hpregenamount: 0.002,
	p_hpregencumative: 0,
	p_maxhpregen: 0.8,
	p_money: 1000,
	p_goods: 50,
	p_goodplanet: 0,
	
	p_maxhp: 100,
	p_hp: 100,
	p_armour: 50,
	p_maxarmour: 50,
	p_invunrable: 160,
	//Status: 0 fine, 9 destroyed
	p_status: 0,
	p_fuel: 10000,
	p_maxfuel:10000,
	// One means completly random, any number higher adds a minimum
	p_armourpower: 1,

	create: function(){
		var obj = Object.create(this);
		 //12680000
		obj.physical = particle.create("ship", 10300, 9000000, 10, 10);
		obj.weapon = weapon.create("machinegun", 50, 200, 500, 4000, 300, 20, 0.9);
		obj.ship = obj;
		return obj;
	},
	
	update: function(time){
		if(this.p_invunrable > 0){this.p_invunrable--;}
		this.physical.update(time);
		this.p_direction += (this.p_spin * time);
		if(this.p_direction > Math.PI){this.p_direction = -Math.PI;}
		if(this.p_direction < -Math.PI){this.p_direction = Math.PI;}
		if(this.p_hp <= 0){this.destroy();}
		
		//If hp is less than max
		if((this.p_hp + 1) < (this.p_maxhp * this.p_maxhpregen)){
			//add the regen amount
			this.p_hpregencumative += this.p_hpregenamount;
			//If reached one add it back on
			if(this.p_hpregencumative >= 1){
				this.p_hp++;
				this.p_hpregencumative = 0;
			}
		}

		return this.p_status;
	},
	
	draw: function() {
		//this has to be here, otherwise the shooting does not line up as all the ships have not updated
		this.weapon.update();

		game.getcontext().fillStyle= '#' + '900';
		game.getcontext().beginPath();

		//https://en.wikipedia.org/wiki/Circle#Equations
		
		game.getcontext().moveTo(this.physical.getx() + game.screen.x + (this.physical.getradius() * Math.cos(this.p_direction)) , this.physical.gety() + game.screen.y + (this.physical.getradius() * Math.sin(this.p_direction)));
		game.getcontext().lineTo(this.physical.getx() + game.screen.x + (this.physical.getradius() * Math.cos(this.p_direction + 2.4)) , this.physical.gety() + game.screen.y + (this.physical.getradius() * Math.sin(this.p_direction + 2.4)));
		game.getcontext().lineTo(this.physical.getx() + game.screen.x + (this.physical.getradius() * Math.cos(this.p_direction + 3.8)) , this.physical.gety() + game.screen.y + (this.physical.getradius() * Math.sin(this.p_direction + 3.8)));
		
		game.getcontext().closePath();
		game.getcontext().fill();
		
		this.weapon.draw(this);
	},

	left: function(){
		if(this.p_fuel > 0){
		this.spin(false);
		this.removefuel(this.p_power[2]);
		}
	},

	right: function(){
		if(this.p_fuel > 0){
		this.spin(true);
		this.removefuel(this.p_power[3]);
		}
	},

	up: function(){
		if(this.p_fuel > 0){
		this.forward(this.p_power[0]);
		this.removefuel(this.p_power[0]);
			if(this.p_player){
			game.audio.engine.play();
			game.audio.engine.volume = 0.2 * game.audio.getsoundvol();
			}
		}
	},

	down: function(){
		if(this.p_fuel > 0){
		this.forward(this.p_power[1]);
		this.removefuel(this.p_power[1]);
		}
	},
	
	spin: function(right){
		var spinner = right ? this.p_power[3] : this.p_power[2];
		this.p_spin += (spinner / this.physical.getmass());
		if(this.p_spin > 4.5){this.p_spin = 4.5;}
		if(this.p_spin < -4.5){this.p_spin = -4.5}
	},
	
	forward: function(power){
		this.physical.addforce(power * Math.cos(this.p_direction) , power * Math.sin(this.p_direction));
	},
	
	collided: function(obj){

		if(this.physical.havecollided(obj)){		
			//Does damage equal to this value
			var speedhit = calculate_distance(this.physical.getxspeed(), obj.getxspeed(), this.physical.getyspeed(), obj.getyspeed());
			
			if(speedhit > 10){
				this.damage(Math.pow(speedhit, 1.3) - 19);

				var musicdist = calculate_distance(this.physical.getx() , game.getplayer().physical.getx(), this.physical.gety(), game.getplayer().physical.gety());
				var musicvolume = ((-(Math.pow(Math.abs(musicdist), 1.1)))/10000) +1;
				if(musicvolume < 0){game.audio.slap.volume = game.audio.getsoundvol() *  musicvolume * 0.2;}
				game.audio.slap.volume = game.audio.slap.volume *  game.audio.getsoundvol();
				game.audio.slap.play();


			}

			this.physical.collided(obj);
		}
	},
	
	getrotation: function(){
		return this.p_direction;
	},
	
	shoot: function() {
        	this.weapon.trigger(this);
	},
	
	destroy: function() {
		var musicdist = calculate_distance(this.physical.getx() , game.getplayer().physical.getx(), this.physical.gety(), game.getplayer().physical.gety());
		var musicvolume = ((-(Math.pow(Math.abs(musicdist), 1.1)))/10000) +1;
		if(musicvolume < 0){musicvolume = 0;}
		game.audio.explosion.volume = game.audio.getsoundvol() *  musicvolume;
		game.audio.explosion.volume = game.audio.explosion.volume *  game.audio.getsoundvol();
		game.audio.explosion.play();
		this.p_status = 9;
	},
	
	damage: function(damage){
		if(this.p_invunrable > 0){return this.p_hp;}
	
		var armoureffect = Math.min(((Math.random() * (1/this.p_armourpower))  + ((this.p_armourpower - 1)/this.p_armourpower)) * this.p_armour, damage);
		
		this.p_armour -= armoureffect;
		this.p_hp -= (damage - armoureffect);

		return this.p_hp;

	},
	
	gethp: function(){
		return this.p_hp;
	},
	
	getarmour: function(){
		return this.p_armour;
	},
	
	getfuel: function(){
		return this.p_fuel;
	},
	
	removefuel: function(power){
		this.p_fuel -= (Math.abs(power)/100);
	},

	getmoney: function(){
		return this.p_money;
	},

	addmoney: function(newmoney){
		this.p_money += newmoney;
	}
};

var weapon = {
	p_type: 0, //Weapon Type (machinegun, laser, rocket, sniper)
	p_magrounds: 0, // Rounds in magazine
	p_firetime: 0, // Time betweenshots
	p_ammo: 0, // Total ammo
	p_reloadtime: 0, // reload time
	p_maxdistance: 0, //distance rounds fires
	p_power: 0, //damage
	p_accuraccy: 0, //accuraccy
	p_draw: 0, // internal draw varible
	
	p_currentmag: 0, //Players mag ammo
	p_currentammo: 0, // Players ammo
	p_currentreloadreadytime: 0, //If time is after this then ready
	p_currentshootagaintime: 0, //time till they can shoot again

	p_shootpressed: 0,
	
	create: function(type, magrounds, firetime, ammo, reloadtime, maxdistance, power, accuraccy){
		var obj = Object.create(this);
		obj.p_type = type;
		obj.p_magrounds = obj.p_currentmag = magrounds;
		obj.p_firetime = firetime;
		obj.p_ammo = obj.p_currentammo = ammo;
		obj.p_reloadtime = reloadtime;
		obj.p_maxdistance = maxdistance;
		obj.p_power = power;
		obj.p_accuraccy = accuraccy;
		obj.p_currentreloadreadytime = obj.p_currentshootagaintime = game.gettime();
		return obj;
	},
	
	draw: function(ship){
		//moved to draw so lines up
		if(this.p_shootpressed != 0){
			this.shoot(this.p_shootpressed);
			this.p_shootpressed = 0;
		}

		if(this.p_draw != 0){
			game.getcontext().lineWidth = 2;
			game.getcontext().strokeStyle= '#' +  '0f0'; // 'ddb';
			game.getcontext().beginPath();
			game.getcontext().moveTo(ship.physical.getx() + game.screen.x + (ship.physical.getradius() * Math.cos(ship.p_direction)) , ship.physical.gety() + game.screen.y + (ship.physical.getradius() * Math.sin(ship.p_direction)));
			game.getcontext().lineTo(game.screen.x + this.p_draw.x, game.screen.y + this.p_draw.y);
			game.getcontext().stroke();
			
			this.p_draw = 0;
		}
	},
	
	gettype:function(){
		return this.p_type;
	},

	trigger:function(ship){
		this.p_shootpressed = ship;
	},

	update:function(){

	},
	
	shoot: function(ship){
		if(this.reload() != 1){return 0;} //Still reloading or now reloading
		
		//Now checks time to shoot has passed
		if(this.p_currentshootagaintime > game.gettime()){return 0;}	
		
		//console.log(this.p_currentmag + " " + this.p_currentammo);
		
		//Adds reshoot time
		this.p_currentshootagaintime = game.gettime() + this.p_firetime;

		//shoot noise
		var musicdist = calculate_distance(ship.physical.getx() , game.getplayer().physical.getx(), ship.physical.gety(), game.getplayer().physical.gety());
		var musicvolume = ((-(Math.pow(Math.abs(musicdist), 1.1)))/10000) +1;
		if(musicvolume < 0){game.audio.shoot.volume = game.audio.getsoundvol() *  musicvolume * 0.2;}
		game.audio.shoot.volume = game.audio.shoot.volume *  game.audio.getsoundvol();
		game.audio.shoot.play();

		// Removes one from current mag
		this.p_currentmag--;
		
		//Needs to do do damage
		var shipf = {x: ship.physical.getx() + (ship.physical.getradius() * Math.cos(ship.p_direction)), y: ship.physical.gety() + (ship.physical.getradius() * Math.sin(ship.p_direction))};
		var shot = {x: ship.physical.getx() + (this.p_maxdistance * (Math.cos(ship.p_direction) + this.accuracyeffect())), y:ship.physical.gety() + (this.p_maxdistance * (Math.sin(ship.p_direction) + this.accuracyeffect()))};
		this.p_draw = {x: shot.x, y:shot.y};
		
		var closestobj = {dist: 10000000000, obj: 0};
		
		for(var i = game.p_objects.length - 1; i >= 0; i--) {
			if(typeof game.p_objects[i] === 'undefined'){continue;}
			if(game.p_objects[i].physical.gettype() != "ship"){continue;}

			var object = {x: game.p_objects[i].physical.getx(), y: game.p_objects[i].physical.gety()};
			
			
			//Tests if the ship is within the distance the ship can shoot
			if(calculate_distance(shipf.x, object.x, shipf.y, object.y) > calculate_distance(shipf.x, shot.x, shipf.y, shot.y)){continue;}
			//Now tests if the ship is within the circle of the endpoint
			if(calculate_distance(shipf.x, shot.x, shipf.y, shot.y) < calculate_distance(object.x, shot.x, object.y, shot.y)){continue;}
			
			//https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line - based off
			//However this does not check that its on the right side so above check avoids that
			var dist = Math.abs(((((shot.y - shipf.y) * object.x) - ((shot.x - shipf.x) * object.y)) + (shot.x * shipf.y)) - (shot.y * shipf.x)) / Math.sqrt(Math.pow((shot.y - shipf.y), 2) + Math.pow((shot.x - shipf.x) , 2));

			var damage = (Math.random() * (this.p_power/2)) + (this.p_power/2);
			if(dist < game.p_objects[i].physical.getradius()){
				var tempdist = calculate_distance(shipf.x, object.x, shipf.y, object.y);
				if(tempdist < closestobj.dist){
					closestobj.dist = tempdist;
					closestobj.obj = game.p_objects[i];
				}
			}
		}
		
		if(closestobj.obj != 0){
			this.p_draw = {x: closestobj.obj.physical.getx(), y:closestobj.obj.physical.gety()}; 
			if(closestobj.obj.ship.damage(damage) < 10){
				ship.addmoney(closestobj.obj.ship.physical.getmass());
			}
		}
		
	},
	
	reload: function(){
		
		//This would mean its still reloading.
		if(game.gettime() <= this.p_currentreloadreadytime){
			return 0;
		}
		
		//means a reload is needed as no ammo
		if(this.p_currentmag == 1){
			this.p_currentreloadreadytime = game.gettime() + this.p_reloadtime;
			this.p_currentmag = 0;
			return 1;
		}
		
		//times past and reload can happen
		if(this.p_currentmag <= 0){
			var amountofrounds = Math.min(this.p_currentammo, this.p_magrounds);
 
			this.p_currentmag = amountofrounds;
			this.p_currentammo -= amountofrounds;
			
			if(this.p_currentmag == 0){
				return 0;
			}
		}
		
		return 1;
		
	},
	
	manualreload: function(){
		this.p_currentammo += this.p_currentmag;
		this.p_currentmag = 0;
		this.p_currentreloadreadytime = game.gettime() + this.p_reloadtime;
	},
	
	accuracyeffect: function(){
		var accuracytop = (1 - this.p_accuraccy);
		var accuracybottom = 0 - (1 - this.p_accuraccy);
		return ((Math.random() * accuracytop * 2) + accuracybottom);
	},
	
	gettype: function(){
		return this.p_type;
	},
	
	getammo: function(){
		return this.p_currentmag + "/" + this.p_currentammo;
	}
}
