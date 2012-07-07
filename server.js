
/////////////////////////////////////////////

var entities = [], count = 0;
var master_entities = [], master_count=0;
var io = require("socket.io").listen(process.env['app_port'] || 19518);

var INITIAL_X = 80;
var INITIAL_Y = 80;
var INITIAL_VEL_X = 0;
var INITIAL_VEL_Y = 0;
var master = 0;

io.set('log level', 1);
io.sockets.on("connection", function (socket) {
	var Me = [];

	
	socket.on("message", function (data) {
        
		var new_data = data.split(',');
        
		//master initialization
		if (new_data[0] == 'MASTER') {
					
			var master_num = master_count++;
			masterSelf = master_entities[master_num] = [master_num, socket.id];
			Me[0]='master'
			Me[1]=master_num;
			
			//prvi master je glavni master, svim ostalim od javlja poziccije igraèa
			if(master == 0) {
					master = socket.id
					console.log('New MASTERMASTER, id: ' + master);
					io.sockets.socket(master).emit("message", 'MASTERMASTER,'+ master_num + ',' + socket.id);
				} else socket.send('MASTER,' + master_num + ',' + socket.id);
				
			console.log(' New MASTER id:' + masterSelf[0] + ', id' + masterSelf[1])
			
			 //Send to conencting master client the current state of all the other players
			for (var entity_idx = 0; entity_idx < entities.length; entity_idx++) { //send initial update  
				 
					entity = entities[entity_idx];
					if (typeof (entity) != "undefined" && entity != null) {
						console.log('MASTER: To master ' + master_num + ' sent for ' + entity_idx + 'message: ' + 'C,' + entity[0] + ',' + entity[2] + ',' + entity[3] + ',' + entity[4]);
						socket.send('C,' + entity[0] + ',' + entity[2] + ',' + entity[3] + ',' + entity[4]); //send the client that just connected the position of all the other clients 
					 
						
					}
				
			}
			
			
		}
		
		//player initilazitanaton
		
		if (new_data[0] == 'PLAYER') {
			var myNumber = count++;    
			var mySelf = entities[myNumber] = [myNumber, socket.id, new_data[1], INITIAL_X, INITIAL_Y];//new_data[1]=name of player
			console.log(mySelf + 'entitier my num= ' + entities[myNumber]);
			Me[0]='player'
			Me[1]=myNumber;
			//Send the initial position and ID to connecting player
			console.log(myNumber + ' sent: ' + 'I,' + mySelf[0] + ',' + mySelf[1] + ',' + mySelf[2]);
			socket.send('I,' + mySelf[0]+ ',' + mySelf[1]);
			for (var masterentity_idx = 0; masterentity_idx < master_entities.length; masterentity_idx++) { //send initial update  
				  
					masterentity = master_entities[masterentity_idx];
					
					if (typeof (masterentity) != "undefined" && masterentity != null) {
						console.log('PLAYER: To master ' + masterentity[0] + ' sent for ' + myNumber+ ' to id ' + masterentity[1] + ' Message: C,' + mySelf[0] + ',' +  mySelf[2] + ',' + mySelf[3] + ',' + mySelf[4]);
						//tu šaljemo masteru iz liste init poziciju novog pleyera (C,mynumber,name,x,y)
						io.sockets.socket(masterentity[1]).emit("message",'C,' + mySelf[0] + ',' +  mySelf[2] + ',' + mySelf[3] + ',' + mySelf[4]); 
						
					}
				
			}
		
		
		}
		
		if (new_data[0] == 'POSITION') {// a POSITION message for MASTER
			for (var masterentity_idx = 0; masterentity_idx < master_entities.length; masterentity_idx++) { //send initial update  
				  
					masterentity = master_entities[masterentity_idx];
					
					if (typeof (masterentity) != "undefined" && masterentity != null) {
						//console.log('to ' + masterentity[1] + ' position ' + new_data[2] + ',' +new_data[3] );
						//tu šaljemo masteru iz liste poziciju pleyera (POSITION,mynumber,x,y)
						io.sockets.socket(masterentity[1]).emit("message",'POSITION,' + new_data[1] + ',' +  new_data[2] + ',' + new_data[3]); 
						
					}
				
			}
		
		}
		
		if (new_data[0] == 'UM') { // a UM message for MASTERMASTER
			
			io.sockets.socket(master).emit("message",'UM,' + new_data[2] + ',' +  new_data[1]);
        }
        else if (new_data[0] == 'S') { // a Shooting message
			
			var shoot_info = [];
            shoot_info[0] = new_data[1]; //ini x
            shoot_info[1] = new_data[2]; //ini y

            
            //Update MASTERs about my shooting
            socket.broadcast.emit("message",'S,' + shoot_info[0] + ',' + shoot_info[1]);
        }
		else if (new_data[0] == 'H') { // a health message
			console.log('Health:' + new_data[1] + ',' + new_data[2]);
            //Update clients about new health
            socket.broadcast.emit("message", 'H' + ',' + new_data[1] + ',' + new_data[2]);
        }
		else if (new_data[0] == 'D') { // a Death message
			
            socket.broadcast.emit("message",'D,'+ new_data[1]);
        }
		else if (new_data[0] == 'OG') { // a OGLAS message
			console.log('Emiting OG');
            socket.broadcast.emit("message",'OG,'+ new_data[1]);
        }
		else if (new_data[0] == 'OGJOY') { // a OGLAS JPYSTIC message
			console.log('Emiting OGJOY');
            socket.broadcast.emit("message",'OGJOY,'+ new_data[1]);
        }
		else if (new_data[0] == 'CREATE') { // a OGLAS JPYSTIC message
			console.log('Emiting CREATE');
            socket.broadcast.emit("message",'CREATE,' + new_data[1] );
        }
		else if (new_data[0] == 'MICE') { // a OGLAS JPYSTIC message
			console.log('Emiting MICE set value');
            socket.broadcast.emit("message",'MICE,' + new_data[1] );
        }
		
    });
	
	 socket.on('disconnect', function (data) {
		if (Me[0]='player') {
		
		socket.broadcast.emit("message",'D,'+ Me[1]);
		entities[Me[1]]=null;
		}
		if (socket.id==master) {
		
		master_entities[Me[1]]=null;
		
		for (var masterentity_idx = 0; masterentity_idx < master_entities.length; masterentity_idx++) { //send initial update  
				    
					masterentity = master_entities[masterentity_idx];
					
					if (typeof (masterentity) != "undefined" && masterentity != null && masterentity[1]!=master) {
						console.log('new MASTERMASTER is: ' + masterentity[1]);
						master=masterentity[1];
						//tu šaljemo masteru iz liste init poziciju novog pleyera (C,mynumber,name,x,y)
						io.sockets.socket(masterentity[1]).emit("message",'MASTERMASTER'); 
						break;
					} 
					else {
						master=0;
						console.log('No MASTERMASTERs!!!');
					}
				
			}
		
		
		}
  });

});

