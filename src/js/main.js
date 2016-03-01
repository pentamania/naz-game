enchant();

window.onload = function(){
    // var SCREEN_WIDTH = 256 + 112; // original width / field width + Interface window width
    // var SCREEN_HEIGHT = 288; // original height
    var SCREEN_WIDTH = 320; // for 9leap
    var SCREEN_HEIGHT = 320; // for 9leap
    var STATUS_AREA_WIDTH = 112;
    // var FIELD_WIDTH = 256; // original field width
    var FIELD_WIDTH = SCREEN_WIDTH - STATUS_AREA_WIDTH;
    var SCREEN_CENTER_X = SCREEN_WIDTH / 2;
    var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;
    var TITLE_NAZ_POS = {
        x: SCREEN_WIDTH * 0.45,
        y: SCREEN_HEIGHT * 0.14
    }
    var ITEM_SIZE = 32;
    var MAPCHIP_SIZE = 16;
    var GRID_NUM_X = Math.round(SCREEN_WIDTH / MAPCHIP_SIZE);
    var GRID_NUM_Y = Math.round(SCREEN_HEIGHT / MAPCHIP_SIZE);

    var DEFAULT_VOLUME = 0.2;

    var TARGET_TIME_LIMIT = 1000; // スコアが加算されるリミット
    var JUDGE_TEXTS = ['SUGOI !!!', 'GOOD', 'IMAICHI...'];
    var DAWSER_RATINGS = ['ルーキー級ダウザー', 'ふつう級ダウザー', 'すごい級ダウザー！', '毘沙門天級ダウザー！'];

    var resultScore = 0;
    var highScore = 0;
    var target = null; // さがしものを格納
    var TARGETS_DATA = [
        /*
        *[name, frameIndex, difficultyRating]
        *nameはいまのところ使っていない
        */
      	['チーズ',0,1],
      	['Pアイテム',1,1],
      	['点アイテム',2,1],
      	['傘',3,2],
      	['一輪の輪',4,2],
      	['柄杓',5,2],
      	['巻物',6,3],
      	['狐面',7,3],
      	['三叉槍',8,3]
    ];
    //最後のターゲットはランダムで決定（難易度は一緒）
    var _nU = Math.floor( new Date().getTime() / 1000 );
    if (_nU%8 === 0) {
       TARGETS_DATA.push(['こいし',10,4]);
    } else {
        TARGETS_DATA.push(['宝塔',9,4]);
    }

    //ターゲットレベル総計：スコア判定に利用
    var targetLevelSum = 0;
    TARGETS_DATA.forEach(function(target){
        targetLevelSum += target[2];
    });

    var LastTargetNum = TARGETS_DATA.length; //クリアとなる探しものの数
    //var LastTargetNum = 1; // for debug
    var currentTargetLevel = 0; // 現在の探しもの難易度
    var targetCount = 0; // さがしもの回収数

    var targetFrameIndex = null;
    var remainedTargets = null;
    var searching = true;

    // 高難易度モード：ターゲットが移動する。一度、最高評価を獲得するとタイトル画面に設定ボタン出現
    var EX_unlocked = false;
    var EX_mode = false;

    /*メイン処理ここから==============================*/

    Sound.enabledInMobileSafari = true; // ios用
    var core = new Core(SCREEN_WIDTH, SCREEN_HEIGHT);
  	core.fps = 30;
    core.preload(
        'img/title/startButton.png','img/title/titleNaz.png','img/title/BG.png','img/title/logo.png',
        'img/map0.png', 'img/baseWindow.png','img/window01.png','img/targets.png','img/emotion.png','img/nazrins.png',
        'img/resultTitle.png','img/others.png','img/tutorialBG.png',
        'sound/mp3/HaruMinato.mp3',
        'sound/wav/se_search.wav', 'sound/wav/se_close.wav', 'sound/wav/se_veryClose.wav', 'sound/wav/se_findIt.wav',
        'sound/wav/se_snap.wav'
    );
    core.onload = function(e){
      	// サウンド定義
      	var BGM = core.assets['sound/mp3/HaruMinato.mp3'];
      	var bingoSE = core.assets['sound/wav/se_findIt.wav'].clone(),
            searchSE = core.assets['sound/wav/se_search.wav'].clone(),
            closeSE = core.assets['sound/wav/se_close.wav'].clone(),
            veryCloseSE = core.assets['sound/wav/se_veryClose.wav'].clone();
      	var pagenationSE = core.assets['sound/wav/se_snap.wav'].clone();
      	var SOUNDS = [
      	    BGM, bingoSE, searchSE, closeSE, veryCloseSE, pagenationSE
      	];
    	// イメージ定義
    	// images: titlescene
    	var titleLogoImage = core.assets['img/title/logo.png'],
        titleBackgroundImage = core.assets['img/title/BG.png'],
        titleNazImage = core.assets['img/title/titleNaz.png'],
        titleStartImage = core.assets['img/title/startButton.png'];
    	// images: tutorialScene
    	var tutorialImage = core.assets['img/tutorialBG.png'];
    	// images: mainscene
    	var emotionImage =  core.assets['img/emotion.png'],
        baseWindowImage = core.assets['img/baseWindow.png'],
        targetWindowImage = core.assets['img/window01.png'],
        targetsImage = core.assets['img/targets.png'],
        hintNazImage = core.assets['img/nazrins.png'];
        // images: gameoverscene
    	var resultTitleImage =  core.assets['img/resultTitle.png'],
    	     otherImage = core.assets['img/others.png'];

    	/* Scene定義 */
    	var titleScene = core.rootScene; //タイトル画面
    	var tutorialScene = new Scene(); //遊び方
    	var pregameScene = new Scene(); // ゲーム開始前のカウントダウン
    	var gameScene = new Scene(); //メイン
    	var postgameScene = new Scene(); //ゲーム終了
    	var gameoverScene = new Scene(); // ゲームオーバー

    	/*　タイトルシーンアセット　*/
    	// 背景画像
    	var titleBackGround = new MySprite(titleBackgroundImage, 640, 480, 0, 0);

    	// ロゴ
    	var titleLogo = new MySprite(titleLogoImage,401,188);
        titleLogo.setScale(0.7);
        titleLogo.x = SCREEN_CENTER_X - titleLogo.width*0.5; //ど真ん中
        titleLogo.y = -240; //初期位置は画面外

    	var TitleLogoEndY = SCREEN_HEIGHT*0.4-titleLogo.height*0.5; //最終位置

    	// ナズーリンシルエット
    	var titleNaz = new MySprite(titleNazImage, 256, 344, TITLE_NAZ_POS.x, TITLE_NAZ_POS.y);
        titleNaz.setScale(0.6);

    	// 説明メッセージ
    	//var titleMes = new MyLabel('クリック（タップ）でゲームスタート！',null,null,16,'ＭＳゴシック'); // タイトル下メッセージ
    	//titleMes.x = SCREEN_WIDTH*0.5 - titleMes.fontSize*titleMes.text.length*0.5;
    	//titleMes.y = SCREEN_CENTER_Y + 80;
    	//titleMes.opacity = 0 // fadeInを使う際は必ず必要
    	//titleMes.color = 'white';

    	//スタートボタン
    	var startButton = new MySprite(titleStartImage, 235, 43, 0, SCREEN_CENTER_Y+50);
        startButton.setScale(0.8);
        startButton.x = SCREEN_CENTER_X - startButton.width*0.5;

    	//チュートリアルボタン
    	var tutorialButton = new MyButton("遊び方",20,230);
        //tutorialButton.color = "red";
        tutorialButton.moveTo(SCREEN_CENTER_X-tutorialButton.width*0.5,startButton.y+50);

    	//エキストラモード変更
    	var EXmodeButton = new MyButton("EX",18);
    	    EXmodeButton.moveTo(SCREEN_WIDTH-64,8);
    	    EXmodeButton.width -= 8; //サイズ調整
    	    EXmodeButton.isToggle = true;
    	    EXmodeButton.visible = false;
    	    EXmodeButton.on('touchstart', function(){
    		      EX_mode = !EX_mode;
    	    });

    	//ハイスコア表示
    	var highScoreTextLabel = new MutableText(4,4);
          highScoreTextLabel.text = "Hi-SCORE";
    	var highScoreNumLabel = new MutableText(4,16+4);
          highScoreNumLabel.text = highScore.toString();

    	// addchild
    	titleScene.addChildren([
    	    titleBackGround,titleNaz,titleLogo,
    	    startButton,
    	    tutorialButton,
    	    highScoreTextLabel,highScoreNumLabel,
    	    EXmodeButton
    	]);

    	// アニメーションキュー
    	titleScene.tl.cue({
    	    15: function(){titleLogo.tl.moveTo(titleLogo.x, TitleLogoEndY, 55, enchant.Easing.BOUNCE_EASEOUT)},
    	    //40: function(){titleMes.tl.fadeIn(40).fadeOut(40).loop();},
    	    //40: function(){titleNaz.tl.moveTo(titleLogo.x, TitleLogoEndY, 55, enchant.Easing.QUAD_EASEOUT),
    	    40: function(){startButton.tl.fadeIn(30).fadeOut(30).loop();}
    	});

    	// gamestart
    	//titleScene.on('touchend', function() {
    	startButton.on('touchend', function() {
          titleLogo.tl.skip(100); //アニメーションを終わらせる
    	    //現在表示しているシーンをゲームシーンに置き換え
    	    core.replaceScene(gameScene);
    	    switchVisibility(hidedEntities); //スコア等隠す

    	    core.pushScene(pregameScene); //カウントダウンシーン
    	    countdown(); //カウントダウンスタート
    	});

    	tutorialButton.on('touchend', function() {
    	    pagenationSE.stop();pagenationSE.play();
    	    core.pushScene(tutorialScene);
          titleLogo.tl.skip(100); //アニメーションを終わらせる
    	});
    	//--titleScene end

    	//Scene:チュートリアルシーン
    	tutorialScene.backgroundColor ='rgba(0,0,0,1)';

    	//チュートリアル画像
    	var gameTutorialImage = new MySprite(tutorialImage,SCREEN_WIDTH,SCREEN_HEIGHT);
    	var tutorialMessage = new MyLabel("画面タップで戻ります",4,4,12,'meirio');
        tutorialMessage.color = "rgb(230,230,230)";

    	tutorialScene.addChildren([
    	    gameTutorialImage,
    	    tutorialMessage
    	]);

    	tutorialScene.on('touchend', function() {
    	    pagenationSE.stop();
    	    pagenationSE.play();
    	    core.popScene();
    	});

    	/* Scene: prestartScene */
    	pregameScene.backgroundColor = 'rgba(0, 0, 0, 0.5)'; //フィルター
    	var countdownCount = 3;

    	var countdownNumLabel = new ScoreLabel(SCREEN_CENTER_X - 50, SCREEN_CENTER_Y);
        countdownNumLabel.score = countdownCount;

    	var countdownText = new MutableText(null, countdownNumLabel.y+24);
        countdownText.text = "START!!";
        countdownText.x = SCREEN_CENTER_X - countdownText.width*0.75;
        countdownText.visible = 0;

    	function countdown(){
        var countdownId = setInterval(function () {
          	countdownCount--;
          	countdownNumLabel.score = countdownCount;
          	if (countdownCount === 0) {
          	    countdownNumLabel.score = "";
          	    countdownText.visible = 1;
          	} else if (countdownCount === -1) {
          	    //初期化
          	    //countdownNumLabel.visible = 0;
          	    countdownCount = 3;
          	    countdownNumLabel.score = countdownCount;
          	    countdownText.visible = 0;
          	    core.popScene();
          	    clearTimeout(countdownId);

        		    init(); //初期処理開始
        		}
        },700);
    	};

    	pregameScene.addChildren([
    	    countdownNumLabel,
    	    countdownText
    	]);

    	// Scene: postgameScene　ゲームクリア後
    	postgameScene.backgroundColor = 'rgba(0, 0, 0, 0.5)'; //フィルター代わり
    	var gamesetMessage = new Label("おしまい！");
    	    gamesetMessage.font = '30px "HG行書体"';
    	    gamesetMessage.color = 'rgba(0, 255, 255, 1)'
    	    gamesetMessage.opacity = 0;
    	postgameScene.addChild(gamesetMessage);

    	// Scene: ゲームオーバーシーン
    	gameoverScene.backgroundColor = 'rgba(255, 220, 59, 1)'; //黄色っぽい
    	//var gameoverMessage = new MyLabel("りざると", SCREEN_WIDTH*0.25, SCREEN_HEIGHT*0.05, 32, "HG行書体"); // 下のaddChildする前に定義すること

    	//"リザルト"
    	var resultTitle = new MySprite(resultTitleImage,174,63);
    	    resultTitle.moveTo(SCREEN_CENTER_X - resultTitle.width*0.5, SCREEN_HEIGHT*0.05);

    	// ”すこあ”
    	var gameoverScoreText = new MyLabel("すこあ",null,SCREEN_HEIGHT*0.3,32,"HG行書体");
    	    gameoverScoreText.x = SCREEN_WIDTH*0.1;
    	    gameoverScoreText.color = 'rgba(112, 255, 255, 1)';// 結果スコア

    	// スコアレーベル
    	var gameoverScoreLabel = new MyLabel("(dummyText)",SCREEN_WIDTH*0.5,SCREEN_HEIGHT*0.3);
    	    gameoverScoreLabel.font = '48px "Sigmar One","Impact"';
    	    gameoverScoreLabel.color = 'rgba(0, 255, 255, 0.7)';
    	    gameoverScoreLabel.strokeColor = 'rgba(0, 202, 100, 0.7)';

    	// テキスト（”あなたは・・・”）
    	var dawserRatingMessageText = new MyLabel("ひょうか...",null,null,20, "HG行書体");
    	    dawserRatingMessageText.x = gameoverScoreText.x;
    	    dawserRatingMessageText.y = gameoverScoreLabel.y+60;
    	    dawserRatingMessageText.color = 'rgba(0, 255, 255, 0.9)';

    	// ダウザー評価：時間差で表示
    	var dawserRatingMessageLabel = new MyLabel("(dummy)",null,null,28,"HG行書体");
    	    dawserRatingMessageLabel.y = dawserRatingMessageText.y + 30;
    	    dawserRatingMessageLabel.color = dawserRatingMessageText.color;
    	    dawserRatingMessageLabel.strokeColor = 'rgba(0, 20, 230, 0.9)';
    	    dawserRatingMessageLabel.opacity = 0;

    	// リスタートボタン
    	var restartButton = new MyButton("タイトルにもどる", 20, 100);
    	restartButton.moveTo(Math.floor(SCREEN_CENTER_X-restartButton.width/2), Math.floor(SCREEN_HEIGHT*12/16));
    	restartButton.on('touchend', function() {
    		EXmodeButton.visible = (EX_unlocked) ? true : false; //EXモードボタン状態変更
    		core.replaceScene(titleScene); //スタート画面に戻る
    	});

    	//var nineleapButton = new Button("スコアを投稿する",'blue',null,restartButton.width);
    	//    nineleapButton.moveTo(~~(SCREEN_CENTER_X-nineleapButton.width/2),~~(SCREEN_HEIGHT*14/16));
    	var nineleapButton = new MyButton("スコアを投稿する", 20, 50);
    	nineleapButton.moveTo(Math.floor(SCREEN_CENTER_X-nineleapButton.width/2), Math.floor(SCREEN_HEIGHT*14/16));
    	nineleapButton.on('touchend', function() {
    		  core.end(
    			  resultScore,
    			"[スコア:"+resultScore+"] 君は…"+dawserRatingMessageLabel.text
    		);
    	});

    	gameoverScene.addChildren([
    	    //gameoverMessage,
    	    resultTitle,
    	    gameoverScoreText,gameoverScoreLabel,
    	    dawserRatingMessageText,dawserRatingMessageLabel,
    	    restartButton,
    	    nineleapButton
    	]);

    	/* BGM */
    	//BGMループ: DOMSound用
    	titleScene.on('enterframe', function(){
    	    if (!BGM.src){
    	        BGM.play();
    	    }
    	});
    	gameScene.on('enterframe', function(){
    	    if (!BGM.src){
    		      BGM.play();
    	    }
    	});
    	gameoverScene.on('enterframe', function(){
    	    if (!BGM.src){
    		      BGM.play();
    	    }
    	});

    	//　音量 ＆ サウンド初期化処理：再生前にvolumeをいじった場合、一度再生させないとエラーになる
    	// いきなり鳴らないよう ０ にセット (たまに効かない時あり)
    	SOUNDS.forEach(function(sound){
    	    if (sound.src){ //web audio
          		sound._volume = 0; //直接volumeをいじる
          		sound.play();
          		if (sound == BGM){
          		    sound.src.loop = true; //BGMループ
          		    //sound.volume = DEFAULT_VOLUME;
          		}
        		//iOsでタップでいきなり音画鳴らないように対策 きかない？
        		// setTimeout(function(){
        		    //sound._volume = DEFAULT_VOLUME;
        		// },1000);
    	    } else { //DOM audio
        		sound.volume = 0;
    	    }
        });

    	//調整ボタン
    	var volumeIcon = new MySprite(otherImage,32,32);
    	volumeIcon.x = SCREEN_WIDTH - volumeIcon.width*1.2;
    	volumeIcon.y = SCREEN_HEIGHT - volumeIcon.width*1.2;
    	volumeIcon.frame = 2; //初期値：onの場合は1　offなら2
    	var switchVolume = function(){
          if (BGM.volume == 0) {
          		//音ON
          		SOUNDS.forEach(function(sound){
      		    if (sound == BGM){
            			sound.stop();sound.play();//BGMリプレイ
            			if (sound.src) sound.src.loop = true; //BGMループ(止めるたびにfalseになってしまう模様)
      		    }
      		    sound.volume = DEFAULT_VOLUME;
      		    });
      		      volumeIcon.frame = 1;
          } else {
      		    //音OFF
      	      SOUNDS.forEach(function(sound){
      		        sound.volume = 0;
              });
      	      volumeIcon.frame = 2; //ペケ印
          }
    	}

    	volumeIcon.on('touchend',switchVolume);

    	/*
    	 * とりあえずタイトルシーンのみaddChild
    	 * 全シーンに共通してつけるにはシーン遷移ごとにaddChildしなければならないっぽい
    	*/
    	titleScene.addChild(volumeIcon);

    	//mainscene関連--------------------

        // Scene: メインゲーム画面はアセット追加は後述
    	/*ステータスウィンドウ*/
    	var statusWindow = new Group();
	    statusWindow.x = FIELD_WIDTH;

    	// 表示するマップのデータを用意
    	var decoTiles = [null,2,18,19,23]; //木とかの上乗せ用
    	var map = new Map(16, 16);
	    map.image = core.assets['img/map0.png'];
    	// loadMap用配列の生成
        var _baseLayer = []
        for (var row = 0; row < GRID_NUM_Y; row++) {
            _baseLayer[row] = [];
            for (var col = 0; col < GRID_NUM_X; col++) {
                _baseLayer[row][col] = 0;
            }
        }
        var _decoLayer = [];
        for (var i = 0; i < GRID_NUM_Y-2; i++) {
            _decoLayer[i] = mapArrayMaker(GRID_NUM_X-2, decoTiles);
        }
        map.loadData(_baseLayer, _decoLayer);

    	// window　レイヤー
    	var baseWindow = new Map(16, 16);
    	baseWindow.image = core.assets['img/baseWindow.png'];
        // loadmap用array
        var _baseWindowArray = [[0,1,1,1,1,1,2]];
        for (var i = 0; i < GRID_NUM_Y-2; i++) {
            _baseWindowArray.push([3,4,4,4,4,4,5]);
        }
        _baseWindowArray.push([6,7,7,7,7,7,8]);
    	baseWindow.loadData(_baseWindowArray);

    	//ターゲット表示ウィンドウレイヤー
    	targetWindow = new Map(16, 16);
    	targetWindow.image = targetWindowImage;
    	targetWindow.opacity = 0.8;
    	// 4×4マス = 48px * 48px
    	targetWindow.loadData([
    	    [0,1,1,2],
    	    [3,4,4,5],
    	    [3,4,4,5],
    	    [6,7,7,8]
    	]);
    	targetWindow.moveTo(24,24);//set position

    	//リトライボタン
    	var retireButton = new MyButton("リタイア", 12, 50);
    	retireButton.moveTo(SCREEN_WIDTH-retireButton.width-4, 5);
    	retireButton.on("touchstart", function(){
    		if(confirm("本当にやめますか？")){
    			hintBalloon.visible = false;
    			if (target !== null) {
    				target.destroy();
    			}
    			core.replaceScene(titleScene);
    		} else {
    			retireButton.isPressed = false;
    			return;
    		}
    	});

    	// ターゲットレベル表示
    	//var targetLevelTextLabel = new MyLabel("レベル:",24,targetWindow.y+64+8,14);
    	//    targetLevelTextLabel.color = "white";
    	var targetLevelTextLabel = new MutableText(24,targetWindow.y+64+8);
	    targetLevelTextLabel.text = "LV:"; //dummy ターゲット出現時に書き換え
    	var targetLevelNumLabel = new MutableText(targetLevelTextLabel.x+50, targetLevelTextLabel.y);
	    targetLevelNumLabel.text = "0"; //dummy ターゲット出現時に書き換え

    	// ターゲットイメージ
    	var targetReference = new Sprite(32,32);
	    targetReference.image = targetsImage;
	    targetReference.x = targetWindow.x+targetReference.width/2;
	    targetReference.y = targetWindow.y+targetReference.height/2;
	    targetReference.frame = targetFrameIndex;

    	//"SCORE"表記
    	var scoreText = new MutableText(16, SCREEN_HEIGHT*7/16);
	    scoreText.text = "SCORE";

    	// スコア表示 （ui.enchant.jsのScoreLabelクラスを使用、ui.enchant.jsそのものもちょっといじった）
    	var scoreLabel = new ScoreLabel(scoreText.x, scoreText.y+20);
	    scoreLabel.score = resultScore; // == 0

    	// 多目的メッセージ用：今は獲得スコア表示のみ
    	var infoMessage = new MutableText(scoreLabel.x, scoreLabel.y + 20);
	    infoMessage.text = "";

    	//　ヒント表示　（"!"と"?"）
    	var hintBalloon = new MySprite (emotionImage,32,32);
    	hintBalloon.moveTo(40,SCREEN_HEIGHT*11/16 | 0);
    	hintBalloon.visible = false;

    	// ヒントナズーリン画像
    	var hintNaz = new MySprite (hintNazImage,32,32,hintBalloon.x,hintBalloon.y+hintBalloon.height*1.2,0);

    	//"YARUKI"の表記
    	var gaugeText = new MutableText(8, SCREEN_HEIGHT-32);
        gaugeText.text = "YARUKI";

    	//やる気ゲージ
    	var gauge = new HorizontalGauge(FIELD_WIDTH*0.8, 8, 120);
        gauge.x = gaugeText.x;
        gauge.y = gaugeText.y + 16;
        gauge.opacity = 0.7;

    	//ステータスウインドウ addchild
    	statusWindow.addChildren([
    	    baseWindow,targetWindow, //ウインドウ表示
    	    targetLevelTextLabel,targetLevelNumLabel,
    	    targetReference,infoMessage,scoreLabel,scoreText,
    	    hintNaz,hintBalloon,
    	    //timeText,timeLabel,
    	]);

    	// mainscene addchild
    	gameScene.addChildren([
    	    map,statusWindow, // マップ・ステータス状態
    	    gaugeText,gauge,
    	    retireButton
    	]);
    	//シーンによって隠したりする要素
    	var hidedEntities = [scoreLabel,targetReference,targetLevelNumLabel,gauge,retireButton];

        //--mainscene end--------------------

        /* ３．処理関係--------------------*/
    	// エフェクト(判定)　出現位置などは後で随時更新
    	// 探しものクラス
    	var Target = Class.create(Sprite, {
    	    TIME_LIMIT: TARGET_TIME_LIMIT,
    	    FADE_DURATION: 25,
    	    counter: 0,
    	    score: null,
    	    initialize: function (x, y, frame, difficulty, isMoving){ //クラスの初期化(コンストラクタ)
          		Sprite.call(this, 32, 32);

          		this.x = rand(x - this.width/2);
          		this.y = rand(y - this.height/2);
          		this.frame = frame;
          		this.opacity = 0;
          		this.image = targetsImage;
          		this.difficulty = difficulty || 0; // 探索難度

          		//動くターゲット用
          		this.isMoving = (isMoving !== null || isMoving !== undefined) ? isMoving : false;
          		this.vector = {x:(rand(3)+1)*0.5,y:(rand(3)+1)*0.5};

          		// 判定メッセージ
          		this.rateMessage = new MyLabel("dummytext",8,16);
          		this.rateMessage.color = 'gold';
          		this.rateMessage.strokeColor = 'brown';
          		this.rateMessage.font = '24px "Sigmar One","Impact"';
    	    },
    	    onenterframe: function(){
          		this.counter++;
          		//動く場合の処理
          		if (this.isMoving) {
          		    if (this.x<0 || this.x>FIELD_WIDTH-this.width) {
          			this.vector.x = this.vector.x * (-1);
          			this.vector.y = this.vector.y * (-1);
          		    }
          		    if (this.y<0 || this.y>SCREEN_HEIGHT-this.height) {
          			this.vector.x = this.vector.x * (-1);
          			this.vector.y = this.vector.y * (-1);
          		    }
          		    this.x += this.vector.x;
          		    this.y += this.vector.y;
          		}
          		//時間経過でヒント
          		if (this.counter > this.TIME_LIMIT) {
          		    this.opacity = 0.3;
          		}
    	    },
    	    // 見つけたときの挙動
    	    detected: function(){
        		searching = true; // クリック禁止
        		targetCount++; // 問題数　増
        		this.isMoving = false; //動き止める
        		this.opacity = 1;　//表示

          		// スコア・判定　関係
          		var timeBonus = ((this.TIME_LIMIT-this.counter)>0) ? (this.TIME_LIMIT-this.counter) : 0;
          		this.score = Math.floor((timeBonus) * this.difficulty);
          		rewriteScore(this.score); // 加点&スコア書き換え
          		console.log("捜索時間：　"+this.counter);

          		// 判定評価ラベル
          		var detectRating = this.getDetectRating(this.counter); //0,1,2
          		this.rateMessage.text = JUDGE_TEXTS[detectRating];
          		//this.rateMessage.moveTo(this.x-8,this.y+16);
          		this.parentNode.addChild(this.rateMessage); //mainsceneに追加
          		//アニメーション（横にすぅ～・・・）
          		this.rateMessage.tl
          		    .tween({opacity:1, x:this.rateMessage.x+8,time:8}) //fadeIn
          		    .delay(16)
          		    .moveBy(32,0,32,enchant.Easing.BACK_EASEIN).and()
          		    .fadeOut(32)//fadeOut
          		    .then(function(){this.tl.removeFromScene();})
          		;

    			// 上にスーッと消える -> remove
          		this._fadeAnimation();
    	    },

    	    getDetectRating: function(number){
          		var b1 = this.TIME_LIMIT*0.2, //200
    				  b2 = this.TIME_LIMIT*0.5;
          		if (number <= b1) {
          		    return 0; //最高
          		} else if (b1 < number && number <= b2) {
          		    return 1;
          		} else {
          		    return 2;
          		}
    	    },

    	    _fadeAnimation: function(){
          		this.tl
          		    .fadeOut(this.FADE_DURATION)
          		    .and().moveBy(0, -18, this.FADE_DURATION)
          		    .then(function(){
                        this.callback();
          		    }.bind(this))
          		;
    	    },
    	    callback: function(){
          		//非表示
          		infoMessage.text = "";
          		hintBalloon.visible = false;
          		this.destroy();
          		 // ゲームオーバー処理
          		if (targetCount === LastTargetNum) {
          		    this.rateMessage.tl.skip(9999); //評価メッセージを消す
          		    gameset();
          		} else {
          		    setNextTarget();
          		}
    	    },

    	    destroy: function(){
    	        this.parentNode.removeChild(this);
    	    }
    	});//--targetクラス

    	// gamescene初期化処理
    	function init() {
    	    resultScore = 0; //　内部スコアをリセット
    	    scoreLabel.score = resultScore; //　スコア表示をリセット
    	    targetCount = 0; // 問題数カウントをゼロをもどす
    	    hintNaz.frame = 0; // ナズーリンの顔を元に戻す
    	    gauge.value = gauge.maxValue; // ゲージを回復
    	    remainedTargets = TARGETS_DATA.concat(); //ターゲット情報リストア
    	    hintBalloon.visible = false; // ヒント消す
    	    setNextTarget(); //ターゲット生成
    	    switchVisibility(hidedEntities); //スコア等表示
    	};

    	// 初期化処理:ゲームが始まる前に表示を隠す/ 始まったら表示
    	function switchVisibility(array){
    	    array.forEach(function(element){
                element.visible = !element.visible;
    	    });
    	};

    	// 新しいターゲットの設定
    	function setNextTarget(){
    	    var i;
    	    if (remainedTargets.length > 2) {
                i = Math.floor(Math.random()*(remainedTargets.length-1));
    	    } else {
                //最終ターゲット
                i = 0;
    	    }

    	    var nextTarget = remainedTargets[i];
    	    var targetName = nextTarget[0],
    		targetFrameIndex = nextTarget[1],
    		targetDifficulty = nextTarget[2],
    		targetIsMoving = (EX_mode) ? true : false;

    	    remainedTargets.splice(i, 1);
    	    target = new Target(FIELD_WIDTH - ITEM_SIZE,SCREEN_HEIGHT - ITEM_SIZE, targetFrameIndex, targetDifficulty, targetIsMoving); // New探しもの
    	    gameScene.addChild(target);// シーンに追加

    	    //更新
    	    targetReference.frame = targetFrameIndex; //　ターゲット表示のフレーム番号
    	    targetLevelNumLabel.text = targetDifficulty.toString(); //レベル設定
    	    //targetNameLabel.text = targetName; //名前を変える

    	    searching = false; // クリックを許可
    	};

    	// スコア書き換え
    	function rewriteScore(number) {
    	    resultScore += number;
    	    scoreLabel.score = resultScore;
    	    infoMessage.text = "+" + number;
    	};

    	//postGameSceneセットアップ
    	function gameset(){
    	    core.pushScene(postgameScene);

    	    gameoverScoreLabel.text = resultScore;
    	    dawserRatingMessageLabel.text = judgeResultScore(resultScore,TARGET_TIME_LIMIT*targetLevelSum);

    	    // label位置等 初期化
    	    gamesetMessage.x = SCREEN_WIDTH/3 - 20; //初期位置にもどす
    	    gamesetMessage.y = SCREEN_CENTER_Y; //どうじょう
    	    gamesetMessage.tl.fadeIn(8).and().moveBy(20, 0, 8); //アニメーション
    	    setTimeout(function(){
          		gamesetMessage.opacity = 0;

          		//gameoverSceneのアニメーション準備
          		dawserRatingMessageLabel.x = -dawserRatingMessageLabel.width*2; //元の位置（画面外）に
          		var mesDestX = SCREEN_WIDTH-dawserRatingMessageLabel.width;

          		dawserRatingMessageLabel.tl
          		    .delay(16)
          		    .tween({opacity:1, x:mesDestX, time:32, easing:enchant.Easing.QUAD_EASEOUT})
          		;
          		core.pushScene(gameoverScene);
    	    }, 2000)

    	    //ハイスコア更新
    	    if (resultScore > highScore) {
    			highScore = resultScore;
    			highScoreNumLabel.text = resultScore.toString();
    	    }
    	};

    	/*ゲームオーバー時スコア評価*/
    	function judgeResultScore(score, maxScore) {
    	    // arrayは評価メッセージを入れた配列
    	    var array = DAWSER_RATINGS;
    	    /*
    	    　*計算方法
    	    　*理論最大点の何割獲得できたかで評価
    	    　*1000(target.TIME_LIMIT)/レベル1*3, 2*3, 3*3, 4*1の場合...　理論値は3000+6000+9000+4000 = 22000
    	    　*8割がボーダーだったら　22000*0.8 = 17600がボーダー点
    	    */
    	    var max = maxScore;//理論値
    	    var b1 = max * 0.4,
    	    b2 = max * 0.6,
    		b3 = max * 0.8;
    	    var prefix = function(string){
    		      return (EX_mode) ? "EX"+string : string;
    	    }

    	    if (score < b1) {
    		      return prefix(array[0]);
    	    } else if (score >= b1 && score < b2){
    	        return prefix(array[1]);
    	    } else if (score >= b2 && score < b3){
    		      return prefix(array[2])
    	    } else {
    		      EX_unlocked = true; //EXモード解禁
    	        return prefix(array[3]); //最高評価
    	    }
    	};

    	/*クリックイベント（判定）*/
    	gameScene.on('touchstart', function(e){
    	    var distX = Math.abs(e.x - (target.x + target.width/2)); // ターゲットとの相対距離（x軸）　足してるのは計測点をスプライト中心に合わせるため
    	    var distY = Math.abs(e.y - (target.y + target.height/2));　// ターゲットとの相対距離（y軸）
    	    var distance = Math.sqrt(distX*distX + distY*distY);
    	    var hintRange = {
                veryClose : 18 - target.difficulty*2.5,
                close : 34 - target.difficulty*3,
                far : 54 - target.difficulty*3
    	    };

    	    // 連続クリック防止
    	    var delay = function(){
                searching = true;
    	        setTimeout(function(){
    	            searching = false;
              }, 200);
    	    };
    	    // クリック時の反応
    	    var searchReaction = function(sound,frameIndex1,visible,frameIndex2){
          		sound.stop(); // DOMsound用
          		sound.play();
          		hintBalloon.visible = visible; //boolean
          		hintBalloon.frame = frameIndex1 || 0;
          		hintNaz.frame = frameIndex2 || 0;
    	    };

    	    //砂埃エフェクト
    	    var dustEffect = function(){
    			for (var i=0; i<8; i++){
    				var randX = e.x + randInt(-8,8);
    				var randY = e.y + randInt(-8,8);
    				var dust = new Dust(randX,randY,8,8,30);
    				this.addChild(dust);
    			};
    			// var dust = new Dust2(e.x, e.y, 128, 128);
    			// dust.image = core.assets['img/dust.png'];
    		    // this.addChild(dust);
    	    }.bind(this);

    	    // クリック出来ない状態：　連続クリック防止、フィールド外、やる気が無い
    	    if (searching === true || e.x > FIELD_WIDTH || gauge.value<10) return;

    	    /*リアクション*/
    	    // どんぴしゃ
    	    if (distance < hintRange.veryClose){
    			searching = true;
    	        searchReaction(bingoSE,9,true,3);
    			target.detected();
    			gauge.value += 20;
    	    //　すごく近い
    	    } else if (distance > hintRange.veryClose && distance < hintRange.close){
                searchReaction(veryCloseSE,0,true,2);
                gauge.value -= 4;
                dustEffect();
                delay();
    	    // 近い
    	    } else if (distance > hintRange.close && distance < hintRange.far){
          		searchReaction(closeSE,4,true,1);
          		gauge.value -= 6;
          		dustEffect();
          		delay();
           // 遠い
    	    } else {
          		searchReaction(searchSE,41,true,0);
          		gauge.value -= 6;
          		dustEffect();
          		// 疲れた・・・
        		if (gauge.remainingRatio < 0.2) {
        		    hintNaz.frame = 4;
        		}
        		delay();
    	    }
    	}); // -- scene ontouchstart
    }; // -- core.onload

    core.start();
};
