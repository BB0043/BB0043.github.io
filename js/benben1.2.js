//var serial_info = {type: 'serial'};
/*	*/


(function(ext){
    var connected = false;
    var notifyConnection = false;
	var poller = null;
    var device = null;
	var dirFlag = "";
	var flightFlag = "";
	var dirSpeed;
	var flightSpeed;
	var trimPitch = 0;
	var trimRoll = 0;
	var userKey = 0;
	var lang = 'zh';
	var blocks = {
		en:[
			[' ', 'Calibrate', 'calibrate'],
			[' ', 'LED %d.led %d.onoff','runLed','ALL','ON'],
			[' ', 'colorLight %d.flightDir','colorLed','BLACK'],
			[' ', 'buzzer buzz %d.beep','beeper',"OFF"],
            [' ', 'Arm Flight','armFlight'],
			[' ', 'Disarm Flight','disarmFlight'],
            //[' ', 'Set run Motor %d.motorQuad at speed %d.motorPWM','runMotor', "LF", '30'],
            [' ', 'Set go %d.flightDir at speed %d.speed','runDirection', "Forward", '100'],
            [' ', 'Set rotate %d.flightRotate at speed %d.speed','runRotate', "CR", '100'],
            [' ', 'Set altitude at speed %d %d.flightUpOrDown','runAltitude','100','UP'],
			[' ', 'Set trim: pitch add %d.trimValue and roll add %d.trimValue', 'trimPitchAndRoll', '0', '0'],
			//[' ', 'Run set motor','runSet'],
			//[' ', 'open altitude hold mode %d.openAndClose','altMode','OPEN'],
			//['h', "when pressed the remote keys %d.key", 'when_key', 'U1'],
			['r', 'Throttle', 'thr'],
			['r', 'Pitch', 'pitch'],
			['r', 'Roll', 'roll'],
			['r', 'Yaw', 'yaw'],
			['r', 'YawAngle', 'yAngle'],
			['r', 'RollAngle', 'rAngle'],
			['r', 'PitchAngle', 'pAngle'],
			['r', 'flight voltage', 'voltage'],
		],
		zh:[
			//[' ', '校准', 'calibrate'],
			[' ', '懸停', 'calibrate'],
            [' ', '让LED灯 %d.onoff','runLed','亮'],
			[' ', '讓飛機向 %d.flightDir 翻轉','colorLed','前邊'],
			[' ', '讓蜂鳴器 %d.beep','beeper','關閉'],
			[' ', '電機解鎖','armFlight'],
			[' ', '電機上鎖','disarmFlight'],
            //[' ', '設置 %d.motorQuad 的電機的轉速為 %d.motorPWM','runMotor', "左前方", '0'],
            [' ', '設置讓飛機往 %d.flightDir 以速度 %d.speed 飛行','runDirection', "前邊", '100'],
            [' ', '設置讓飛機往 %d.flightRotate 以速度 %d.speed 旋轉','runRotate', "順時針", '100'],
            [' ', '設置讓飛機以速度為 %d 往 %d.flightUpOrDown 飛','runAltitude','100','上'],
			[' ', '設置飛機 俯仰方向微調增加 %d.trimValue ，橫滾方向微調增加 %d.trimValue', 'trimPitchAndRoll', '0', '0'],
			//[' ', '運行之前的設置','runSet'],
			//[' ', '%d.openAndClose 定高模式','altMode','打開'],
			//['h', '當遙控按了 %d.key 按鈕時', 'when_key', 'K4'],
			['r', '油門', 'thr'],
			['r', '俯仰', 'pitch'],
			['r', '橫滾', 'roll'],
			['r', '航向', 'yaw'],
			['r', '航向角', 'yAngle'],
			['r', '橫滾角', 'rAngle'],
			['r', '俯仰角', 'pAngle'],
			['r', '飛機電壓', 'voltage'],
		]
	}
	var menus = {
		en:{
			onoff: ['ON', 'OFF'],
            led:['ALL','A','B','C','D'],
            motorQuad:["LF","RF","LB","RB","ALL"],
            motorPWM:['0','30','60','90'],
            flightDir:['FORWARD',"BACKWARD","LEFT","RIGHT"],
            flightRotate:['CR','CCR'],
			flightUpOrDown:['UP','DOWN'],
			trimValue:['-30','-20','-10','-5','0','5','10','20','30'],
			openAndClose:['OPEN','CLOSE'],
			color:["BLACK","WHITE","RED","ORANGE","YELLOW","GREEN","BLUE","PINK","VIOLET"],
			beep:["ON","OFF","LESS","MEDIUM","MORE"],
			key:["K4","K3","K8","K7"],
			speed:["0","20","50","80","100","125"],
		},
		zh:{
			onoff: ['亮', '滅','快閃','慢閃','呼吸'],
            led:['所有','A','B','C','D'],
            motorQuad:["左前方","右前方","左後方","右後方","所有"],
            motorPWM:['0','30','60','90'],
            flightDir:['前邊',"後邊","左邊","右邊"],
            flightRotate:['順時針','逆時針'],
			flightUpOrDown:['上','下'],
			trimValue:['-30','-20','-10','-5','0','5','10','20','30'],
			openAndClose:['打開','關閉'],
			color:['黑色','白色','紅色','橙色','黃色','綠色','藍色','粉色','紫色'],
			beep:["常開","關閉","短鳴","中鳴","長鳴"],
			key:["K4","K3","K8","K7"],
			speed:["0","20","50","80","100","125"],
		}
	}
	
    ext._getStatus = function() {
		
        if (!connected){
            sendMsg({'proto':'probe'}); // check if host app online
            return { status:1, msg:'Disconnected' };
        }else{
            return { status:2, msg:'Connected' };
        }
		
		if(!device) return {status: 1, msg: 'disconnected'};
        return {status: 2, msg: 'connected'};
    };

    ext._deviceRemoved = function(dev) {
        console.log('Device removed');
		if(device != dev) return;
		if(poller) poller = clearInterval(poller);
		device = null;
        // Not currently implemented with serial devices
    };
	
	
	
    var potentialDevices = [];
    ext._deviceConnected = function(dev) {
        console.log("Device Connected "+dev.id);
		
    };
	
    ext._shutdown = function() {
        // TODO: Bring all pins down
        if (device) device.close();
        if (poller) clearInterval(poller);
        device = null;
    };

    ext.armFlight = function(){
        console.log("arm flight ");
		
		sendMsg({'proto':'arm'}); // arm quadcopter
    };
	
	ext.disarmFlight = function(){
        console.log("disarm flight ");
        sendMsg({'proto':'disarm'}); // disarm quadcopter
		
    };

    ext.calibrate = function(){
        sendMsg({'proto':'calibrate'}); // calibrate quadcopter
    };

    ext.runMotor =  function(motor, speed){
        console.log("run motor "+motor+" "+speed);
		if(motor == menus.zh.motorQuad[0]){
			motor = menus.en.motorQuad[0];
		}else if(motor == menus.zh.motorQuad[1]){
			motor = menus.en.motorQuad[1];
		}else if(motor == menus.zh.motorQuad[2]){
			motor = menus.en.motorQuad[2];
		}else if(motor == menus.zh.motorQuad[3]){
			motor = menus.en.motorQuad[3];
		}else if(motor == menus.zh.motorQuad[4]){
			motor = menus.en.motorQuad[4];
		}
		sendMsg({'proto':'runMotor','motor':motor,'speed':speed}); // runMotor quadcopter
    };

    ext.runLed = function(led,onoff){
		console.log("run led "+led+" "+onoff);
		if(led == menus.zh.led[0]){
			led = "ALL";
		}
		if(onoff == "亮"){
			onoff = "ON";
		}else if(onoff == "滅"){
			onoff = "OFF";
		}
        sendMsg({'proto':'runLed','led':led,'onoff':onoff});
    };
	
	ext.colorLed = function(color){
		console.log("color:" + color);
		if(color == menus.zh.color[0]){
			color = menus.en.color[0];
		}else if(color == menus.zh.color[1]){
			color = menus.en.color[1];
		}else if(color == menus.zh.color[2]){
			color = menus.en.color[2];
		}else if(color == menus.zh.color[3]){
			color = menus.en.color[3];
		}else if(color == menus.zh.color[4]){
			color = menus.en.color[4];
		}else if(color == menus.zh.color[5]){
			color = menus.en.color[5];
		}else if(color == menus.zh.color[6]){
			color = menus.en.color[6];
		}else if(color == menus.zh.color[7]){
			color = menus.en.color[7];
		}else if(color == menus.zh.color[8]){
			color = menus.en.color[8];
		}
		sendMsg({'proto':'colorLed','color':color});
	}
	
	ext.beeper = function(time){
		console.log("beep:"+time);
		if(time == menus.zh.beep[0]){
			time = menus.en.beep[0];
		}else if(time == menus.zh.beep[1]){
			time = menus.en.beep[1];
		}else if(time == menus.zh.beep[2]){
			time = menus.en.beep[2];
		}else if(time == menus.zh.beep[3]){
			time = menus.en.beep[3];
		}else if(time == menus.zh.beep[4]){
			time = menus.en.beep[4];
		}
		sendMsg({'proto':'beeper','time':time});
	}
	
	ext.runDirection = function(dir,speed) {
		console.log("run flight direction "+dir+" "+speed);
		if(dir == menus.zh.flightDir[0]){
			dir = menus.en.flightDir[0]
		}else if(dir == menus.zh.flightDir[1]){
			dir = menus.en.flightDir[1]
		}else if(dir == menus.zh.flightDir[2]){
			dir = menus.en.flightDir[2]
		}else if(dir == menus.zh.flightDir[3]){
			dir = menus.en.flightDir[3]
		}
        sendMsg({'proto':'runDirection','flightDir':dir,'speed':speed});
		dirSpeed = speed;
		dirFlag = dir;
	};
	
	ext.runRotate = function(rotate,speed) {
		console.log("run flight rotate "+rotate+" "+speed);
		if(rotate == "順時針"){
			rotate = "CR";
		}else if(rotate == "逆時針"){
			rotate = "CCR";
		}
        sendMsg({'proto':'runRotate','flightRotate':rotate,'speed':speed});
	};
	
	ext.runAltitude = function(speed,dir) {
		console.log("run altitude "+dir+" "+speed);
		if((dir == menus.zh.flightUpOrDown[0]) || (dir == 'UP'))
		{
			speed += 125;
		}
		else
		{
			speed = 125 - speed;
		}
		if(speed > 250)
		{
			speed = 250;
		}
		else if(speed < 0)
		{
			speed = 0;
		}
        sendMsg({'proto':'runAltitude','flight':"UP",'speed':speed});
		flightSpeed = speed;
		flightFlag = "UP";
	};
	
	ext.trimPitchAndRoll = function(pitch, roll) {
		trimPitch = pitch;
		trimRoll = roll;
		console.log('pitch: '+trimPitch + "  roll:"+trimRoll);
		sendMsg({'proto':'trimPitchAndRoll','trimPitch':trimPitch,'trimRoll':trimRoll});
	};
	ext.runSet = function() {
		console.log("run Set"+trimPitch+" "+trimRoll);
        sendMsg({'proto':'runSet','dirFlag':dirFlag,"flightFlag":flightFlag,'dirSpeed':dirSpeed,"flightSpeed":flightSpeed,"trimPitch":trimPitch,"trimRoll":trimRoll});
		dirFlag = "";
		flightFlag = "";
	};
	
	var flightData = new Object();
	//var port = chrome.runtime.connect('hemahponoooggniochchkkbldlgkdaga',{name: "LiteBee"});
	var port = chrome.runtime.connect('ojkmijfhdabdfcifimpafffjhjoknaki',{name: "benben"});
	//port.postMessage({joke: "Knock knock"});
	port.onMessage.addListener(function(msg) {
		if (msg.greeting == "hello")
			console.log("hello~");
		else if (msg)
		{
			console.log(msg);
			flightData = msg;
		}
	});

	ext.thr = function() {
		return Number(flightData.thrStick);
	};
	ext.yaw = function() {
		return Number(flightData.yawStick);
	};
	ext.roll = function() {
		return Number(flightData.rollStick);
	};
	ext.pitch = function() {
		return Number(flightData.pitchStick);
	};
	ext.pAngle = function() {
		return Number(flightData.pitch);
	};
	ext.yAngle = function() {
		return Number(flightData.yaw);
	};
	ext.rAngle = function() {
		return Number(flightData.roll);
	};
	ext.voltage = function() {
		return Number(flightData.voltage);
	};
	ext.altMode = function(altFlag) {
		if(altFlag == '打開'){
			sendMsg({'proto':'altMode','mode':'OPEN'});
		}else if(altFlag == '關閉'){
			sendMsg({'proto':'altMode','mode':'CLOSE'});
		}else{
			sendMsg({'proto':'altMode','mode':altFlag});
		}
	};
	ext.when_key = function(key){
		console.log("choose key:"+key);
		if(flightData.key != userKey)
		{
			var tmpKey = 0;
			
			userKey = flightData.key;
			console.log("user press key:"+userKey);
			if(userKey == "1")
			{
				tmpKey = 4;
			} else if(userKey == "2")
			{
				tmpKey = 3;
			} else if(userKey == "3")
			{
				tmpKey = 8;
			} else if(userKey == "4")
			{
				tmpKey = 7;
			}
			if(key === ("K"+tmpKey)){
				return true;
			}
		}
		
		return false;
	};

    function processInput(msg) {
        console.log("Input "+msg.proto);
        if(msg.proto=='online'){
            connected = true;
        }
    }

    function sendMsg(msg){
        //console.log("send msg: "+msg);
        chrome.runtime.sendMessage('ojkmijfhdabdfcifimpafffjhjoknaki', msg, processInput)
		//chrome.runtime.sendMessage('hemahponoooggniochchkkbldlgkdaga', msg, processInput)
    }
	
	var paramString = window.location.search.replace(/^\?|\/$/g, '');
	var vars = paramString.split("&");
	for (var i=0; i<vars.length; i++) {
		var pair = vars[i].split('=');
			if (pair.length > 1 && pair[0]=='lang')
				console.log(lang);
			  //lang = pair[1];
	}
    // Block and block menu descriptions
	
    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang],

        url: 'http://www.benben.com/'
    };

    // Register the extension
    ScratchExtensions.register('benben', descriptor, ext);

})({});




