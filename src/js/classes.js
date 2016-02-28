enchant();

//Message
var MyLabel = Class.create(Label, {
    initialize: function(text,x,y,fontSize,fontStyle){
        Label.call(this,text);
        this.x = x;
        this.y = y;
        this.fontSize = fontSize;
        this._fontSize = fontSize+"px" || "16px";
        this.fontStyle = fontStyle || 'sans-serif';
        this.font = this._fontSize+" "+this.fontStyle;
        //this.width = this.text.length/2 * this.fontSize; //幅はフォントによって異なる
    },
    setPosition: function (x,y){
	this.x = x;
	this.y = y;
    }
});

//button
var MyButton = Class.create(Group,{
    isPressed: false,
    isToggle: false, //トグルスイッチの場合
    visible: true,
    initialize: function (text, fontSize, colorHue, toggle){
	Group.call(this);
	if (toggle) this.isToggle = toggle;

	//幅,高さ
	var textLength = text.length;
	this.fontSize = (fontSize !== null || fontSize !== undefined) ? fontSize : 16;
	this.fontStyle = "'メイリオ', 'Meiryo', 'sans-serif', 'monospace'";//等幅フォントがいいなあ
	this.width = this.fontSize*(textLength+1);//日本語（全角）フォントの場合
	this.height = this.fontSize*1.5;

	//色
	var hsla = function (h,s,l,a){
	    var str = "hsla("+h+","+s+"%,"+l+"%,"+a+")";
	    return str;
	};
	var h = colorHue || 120;
	var light = 50;
	this.mainColor = hsla(h,50,light,1);
	this.lighterColor = hsla(h,50,light+16,1);
	this.darkerColor = hsla(h,50,light-16,1);
	this.fontColor = hsla(h,50,light-24,1);
	// 角丸の半径
	this.radius = this.fontSize*0.4;

	// label部分
	this.buttonLabel = new Label(text);
	//this.buttonLabel.textAlign = 'center';
	this._fontSize = this.fontSize + "px";
	this.buttonLabel.font = this._fontSize+" "+this.fontStyle;
	this.buttonLabel.x = this.fontSize*0.5;
	this.buttonLabel.y = this.fontSize*0.1; //ブラウザ間のズレはどうしようもないかな？
	//this.buttonLabel.y = this.fontSize*0.3; //HG行書体の場合

	// sprite部分
	this.buttonImage = new Sprite(this.width,this.height);
	this._buttonSurface = new Surface(this.buttonImage.width, this.buttonImage.height);
	this.buttonImage.image = this._buttonSurface;

	this.addChildren([this.buttonImage,this.buttonLabel]);
	//console.log(this.childNodes);
    },
    onenterframe: function(){
    	if (!this.visible) {
    	    this.childNodes.forEach(function(node){
    		if (typeof node.visible == "undefined")return;
    		node.visible = false;
    	    });
    	} else {
    	    this.childNodes.forEach(function(node){
    		if (typeof node.visible == "undefined")return;
    		node.visible = true;
    	    });
    	}
    	this.buttonLabel.color = this.fontColor;
    	this.drawButton();
    },

    ontouchstart: function(){
		if (this.isToggle) {
			if(!this.isPressed){
				this.isPressed = true;
			} else {
				this.isPressed = false;
			}
			return;
		} else {
			this.isPressed = false;
		}
    },

	ontouchend: function(){
		if (!this.isToggle) {
			this.isPressed = false;
		}
    },
    drawButton: function(){
    	var c = this._buttonSurface.context;
    	c.fillStyle = this.mainColor;
    	this.roundRect(c, 0, 0, this.width, this.height, this.radius, true, false);
    	//押下状態の表現
    	c.globalCompositeOperation = 'source-atop';
    	if (!this.isPressed) {
    	    //押されていない状態
    	    c.fillStyle = this.lighterColor;
    	    this.fontColor = this.darkerColor;
    	    this.roundRect(c,-this.height*0.05,-this.height*0.05, this.width, this.height, this.radius, true, false);
    	} else {
    	    //押された状態actives
    	    c.fillStyle = this.mainColor;
    	    this.fontColor = this.lighterColor;
    	    this.roundRect(c,this.height*0.05,this.height*0.05, this.width, this.height, this.radius, true, false);
    	}
    },
    //http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
    roundRect: function(ctx, x, y, width, height, radius, fill, stroke) {
    	if (typeof stroke == "undefined" ) {
    	    stroke = true;
    	}
    	if (typeof radius === "undefined") {
    	    radius = 5;
    	}
    	ctx.beginPath();
    	ctx.moveTo(x + radius, y);
    	ctx.lineTo(x + width - radius, y);
    	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    	ctx.lineTo(x + width, y + height - radius);
    	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    	ctx.lineTo(x + radius, y + height);
    	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    	ctx.lineTo(x, y + radius);
    	ctx.quadraticCurveTo(x, y, x + radius, y);
    	ctx.closePath();
    	if (stroke) {
    	    ctx.stroke();
    	}
    	if (fill) {
    	    ctx.fill();
    	}
    }
});

//Nazrin and Items
var MySprite = Class.create(Sprite, {
    initialize: function(image,w,h,x,y,frameIndex){
        Sprite.call(this,w,h);
        this.image = image;
        //this.originX = x - this.width/2;
        //this.originY = y - this.height/2;
        //this.x = x + this.width/2;
        //this.y = y + this.height/2;
        this.x = x||0;
        this.y = y||0;
        //this.x = this.originX;
        //this.y = this.originY;
        this.frame = (frameIndex !== null || frameIndex !== undefined) ? frameIndex : 0;
        this.itemLevel = null; //索敵難度
    },
    setScale: function(scale){
        this.scaleX = scale;
        this.scaleY = scale;
    }
});

// ゲージクラス
var HorizontalGauge = Class.create(Sprite, {
    initialize: function(width,height,value){
        Sprite.call(this,width,height);
        this.value = value;
        this.maxValue = value; //最大値
        this._maxWidth = width; //最大幅
        this.remainingRatio; //残り割合

    	var color = "skyblue";
    	this._image = new Surface(this.width, this.height);
    	//this._image.context.fillStyle = color;
    	//this._image.context.rect(0, 0, this.width, this.height);
    	//this._image.context.fill();
    	this.image = this._image;
    },

    onenterframe: function(){
    	if (this.value > this.maxValue) this.value = this.maxValue;
            this.remainingRatio = (this.value/this.maxValue < 1) ? this.value/this.maxValue : 1;
            this.width = this._maxWidth * this.remainingRatio;
    	//自動回復
    	if (this.value < this.maxValue) {
    	    this.value += this.maxValue*0.002;
    	}
    	//ゲージ量で色を変える
    	if (this.remainingRatio < 0.2) {
    	    this._redraw("red");
    	} else {
    	    this._redraw("hsl(240,50%,60%)");
    	}
    },
    setValue: function(value){
       if (this.value > value){}
       this.value = value;
    },
    getValue: function(){
       return this.value;
    },
    // surfaceを書き換える
    _redraw: function(color){
    	var c = this._image.context;
    	//this._image.clear(); いらない？
    	c.fillStyle = color;
    	// c.rect(0, 0, this.width, this.height);
    	// c.fill();
    	c.fillRect(0, 0, this.width, this.height);
    }
});

// 砂埃エフェクト
var Dust = Class.create(Sprite, {
    initialize: function(x,y,width,height,duration){
		Sprite.call(this,width,height);
		var self = this;
		var easing = enchant.Easing.SIN_EASEOUT;
		// this.x = x - this.width/2;
		// this.y = y - this.height/2;
		this.x = x;
		this.y = y;
		// this.originX = x;
		// this.originY = y;
		//this.delay = delay || 20;
		this.duration = duration || 30;
		this.visible = false; // 最初は非表示
		this.backgroundColor = 'rgb(209,128,71)';
		// エフェクトの動作設定
		this.tl
			//.delay(this.delay) // 指定時間待つ.
			.then(function() { this.visible = true; })
			//.scaleTo(1.0, 4, easing)
			//.scaleTo(1.5, 6, easing)
			.scaleTo(0.5, this.duration, easing)
			.and().fadeOut(this.duration, easing)
			.and().rotateTo(360, this.duration, easing)
			.and().moveBy(0,-32, this.duration, easing)

			.then(function() {
			//this.tl.removeFromScene();
			self.destroy();
			})
		;
    },
    destroy: function(){
       this.parentNode.removeChild(this);
    }
});

// 砂埃エフェクトSS版：モバイルでは表示がおかしい
// var Dust2 = Class.create(Sprite, {
//     initialize: function(x,y,width,height){
// 		Sprite.call(this,width,height);
// 		var self = this;
// 		var easing = enchant.Easing.SIN_EASEOUT;
// 		// this.image = core.assets['img/dust.png'];
// 		this.x = x - this.width/2;
// 		this.y = y - this.height/2;
// 		this.scaleX = this.scaleY = 0.5;
// 		this.frame = 0;
// 		// this.visible = false; // 最初は非表示
// 		this.duration = 30;
// 		// this.tl
// 		// .then(function() { this.visible = true; })
// 		// .scaleTo(0.5, this.duration, easing)
// 		// .and().moveBy(0,-32, this.duration, easing)
//
// 		// .then(function() {
// 			// self.destroy();
// 		// });
//     },
// 	onenterframe: function(){
// 		if (this.frame < 29) {
// 			this.frame += 1;
// 		} else {
// 			this.destroy();
// 		}
// 	},
//     destroy: function(){
// 		this.parentNode.removeChild(this);
//     }
// });

function mapArrayMaker(n,array) {
    var mapArray = [];
    for (var i=0; i<n; i++) {
        var r = randPickUp(array);
        mapArray.push(r);
    }
    return mapArray;
    function randPickUp(arr) {
        var index = Math.floor(Math.random()*(arr.length+1));
        return array[index];
    };
};

// ランダムな整数を得る
// n =5　なら　1以上6未満の整数 すなわち　1,2,3,4,5　のどれかが得られる
function rand(n){
    return Math.floor(Math.random() * (n+1));
};
function randInt(a,b) {
    return Math.floor(Math.random()*(b-a)+a)
};
