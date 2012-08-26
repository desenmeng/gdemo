/**
 * User: mdemo
 * Date: 12-3-28
 * Time: 上午11:13
 * File: gdemo is a html5 game engine
 * Version: 1.2
 * ©2012 FiveNode Studio
 * 1.1版本
 * 加强了团队合作方面
 * 1.2版本
 * 增加本地存储
 * 如果只有一个canvas，自动激活
 * 对引擎中的对象进行类封装
 * 修复sprite类的bug
 * 1.3版本
 * 增加跨平台的支持，对不同分辨率的平铺自动适应
 * 对渲染循环函数进行修改，增加游戏渲染的精度。
 */
(function (win) {
    /**
     * gdemo框架的全局对象，也是框架内部所有类的命名空间
     */
    var gdemo = win.gdemo = {
        version:"1.3",
        global:win
    };
    win.requestAnimFrame = (function () {
        return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
    win.clearRequestTimeout = function (handle) {
        window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
            window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) :
                window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
                    window.oCancelRequestAnimationFrame ? window.oCancelRequestAnimationFrame(handle.value) :
                        window.msCancelRequestAnimationFrame ? msCancelRequestAnimationFrame(handle.value) :
                            clearTimeout(handle);
    };
    //私有枚举变量
    var _enums = {
    };
    //私有参数变量
    var _vars = {
        div:null,
        images:{},
        canvases:{},
        contexts:{},
        frames:{},
        maps:{},
        levels:{},
        states:{},
        animations:{},
        elements:{},
        fps:0,
        screenType:true,
        gameState:null

    };
    //私有函数
    var _funs = {
        ready:null, //TODO:初始化修改
        start:null,
        end:null,
        pause:null,
        selectLevel:null,
        loop:function () {
            var fps = _vars.fps,
                interval = 1000 / fps,
                now = Date.now(),
                lastSecond = Math.floor(now / 1000),
                frameCount = 0;

            window.setInterval(function () {
                var now = Date.now(),
                    second = Math.floor(now / 1000),
                    millSecond = now % 1000;
                if (second != lastSecond) {
                    frameCount = 0;
                    lastSecond = second;
                }
                if (frameCount < fps && millSecond >= frameCount * interval) {
                    frameCount++;
                    gdemo.Context.clearScreen();
                    if (_vars.gameState) {
                        _vars.gameState.action();
                    }
                }
            }, 1);
        },
        caculateFrames:function (options) {//TODO:考虑方向 长度 多行
            var frames = [];
            var imgWidth = _vars.images[options.imageId].width;
            var imgHeight = _vars.images[options.imageId].height;
            var beginX = options.beginX;
            var beginY = options.beginY;
            var width = options.width;
            var height = options.height;
            var direction = options.direction;
            var number = options.number;
            var frame = {};
            if (direction === "right") {
                if (number === 0) {
                    number = parseInt(imgWidth / width);
                }
                for (var i = 0; i < number; i++) {
                    frame = {};
                    frame.x = beginX + width * i;
                    frame.y = beginY;
                    frames.push(frame);
                }
            }
            else if (direction === "down") {
                if (number === 0) {
                    number = parseInt(imgHeight / height);
                }
                for (var j = 0; j < number; j++) {
                    frame = {};
                    frame.x = beginX;
                    frame.y = beginY + height * j;
                    frames.push(frame);
                }
            }
            return frames;
        }
    };
    /**
     * 共有参数变量
     */
    gdemo.vars = {
        /**
         * [int] 当前图片加载器需要加载的图片总数
         */
        sum:0,
        /**
         * [int] 当前图片加载器已经加载的图片总数
         */
        loaded:0,
        SCREEN_OFFSET_LEFT:0,
        SCREEN_OFFSET_TOP:0,
        width:800, //TODO:这个还需要修改
        height:480,
        ifPc:true,
        ratio_x:1,
        ratio_y:1
    };
    /**
     * 公有函数
     */
    gdemo.funs = {
        /**
         * rectangleCollision 矩形碰撞检测
         * @param  [gdemo.Sprite] s1 [元素1]
         * @param  [gdemo.Sprite] s2 [元素2]
         * @return [bool]    [是否碰撞]
         */
        rectangleCollision:function (s1, s2) {
            return s1._x <= s2._x + s2._width && s2._x <= s1._x + s1._width && s1._y <= s2._y + s2._height && s2._y <= s1._y + s1._height;
        },
        /**
         * 将所有 s 的属性复制给 r
         * @param r {Object}
         * @param s {Object}
         * @param is_overwrite {Boolean} 如指定为 false ，则不覆盖已有的值，其它值
         *      包括 undefined ，都表示 s 中的同名属性将覆盖 r 中的值
         */
        extend:function (r, s, is_overwrite) {
            if (!s || !r) return r;

            for (var p in s) {
                if (is_overwrite !== false || !(p in r)) {
                    r[p] = s[p];
                }
            }
            return r;
        },
        ifPC:function () {
            var _nav = navigator.userAgent.toLowerCase();
            if (_nav.indexOf("iphone") != -1 ||
                _nav.indexOf("ipod") != -1 ||
                _nav.indexOf("ipad") != -1 ||
                _nav.indexOf("opera mobi") != -1 ||
                _nav.indexOf("android") != -1 ||
                _nav.indexOf("iemobile") != -1
                ) {
                return false;
            }
            else if (_nav.indexOf("chrome") != -1 ||
                _nav.indexOf("opera") != -1 ||
                _nav.indexOf("msie") != -1 ||
                _nav.indexOf("safari") != -1 ||
                _nav.indexOf("gecko") != -1) {
                return true;
            }
            return false;
        },
        resizeGame:function () {
            var getMyCanvasDom = document.getElementById('canvas');
            if (gdemo.funs.ifPC()) {
                document.body.style.overflow = 'hidden';
                if (getMyCanvasDom && getMyCanvasDom.parentNode) {
                    getMyCanvasDom.parentNode.style.textAlign = 'center';
                    getMyCanvasDom.parentNode.style.marginTop = parseInt((window.innerHeight - 480) >> 1) + 'px';
                }
                document.body.style.backgroundImage = "url('img/Twilight_empire_BG.jpg')";//TODO:这个需要修改
                document.body.style.backgroundPosition = "-320px 0px";
            }
            else{
               getMyCanvasDom.width = win.innerWidth;
               getMyCanvasDom.style.width = win.innerWidth+"px";
               getMyCanvasDom.height = win.innerHeight;
               getMyCanvasDom.style.height = win.innerHeight+"px";
               gdemo.vars.height = win.innerHeight;
               gdemo.vars.ratio_y = win.innerHeight/480;
            }
        },
        /**
         * 对setTimeout进行封装，以提高准确性
         * @param fn 回调函数
         * @param tick 回调时间差
         * @param that 当前作用域
         */
        requestTimeout:function (fn, tick, that) {
            var start = new Date().getTime(),
                id = 0;

            var loop = function () {
                var current = new Date().getTime(),
                    delta = current - start;

                delta >= tick ? fn.call(that) : id = win.requestAnimFrame(loop, tick);
            };
            id = win.requestAnimFrame(loop, tick);
            return id;
        }
    };
    /**
     * init 引擎初始化函数
     * @param [int] fps        帧数
     * @param [bool] screenType 竖屏还是横屏
     * @param [array] canvases   canvas数组集合 格式{id:"canvas", width:800, height:480}
     */
    gdemo.init = function (fps, screenType, canvases, div) {
        _vars.div = document.getElementById(div);//TODO:关于offect 需要实时调整，因为用户可能会调整浏览器的大小
        _vars.fps = fps;
        _vars.screenType = screenType;//TODO:联机游戏时，如果用户切换手机的横竖屏时，应该考虑实时性问题。
        gdemo.Context.init(canvases);
        gdemo.funs.resizeGame();
        win.addEventListener('resize', gdemo.funs.resizeGame, false);
        win.addEventListener('orientationchange', gdemo.funs.resizeGame, false);
    };
    /**
     * initStates 初始化游戏状态
     * @param options 游戏状态集合 格式{id:"dieLeft", action:function(){}},
     */
    gdemo.initStates = function (args) {
        for (var j = 0; j < arguments.length; j++) {
            var options = arguments[j];
            for (var i = 0; i < options.length; i++) {
                _vars.states[options[i].id] = options[i];
            }
        }
    };
    /**
     * 图片加载器
     */
    gdemo.ImageLoader = function () {//TODO:如果图片载入失败，会导致游戏崩溃 待修复
        //图片集合
        var images = null;
        //载入完成回调函数
        var loadComplete = null;
        //载入回调函数
        var loadCallBack = null;
        //载入下一张图片
        var loadNext = function () {
            loadCallBack();//TODO:可以直接把图片总数和已载入数传到
            if (gdemo.vars.loaded < gdemo.vars.sum) {
                _vars.images[images[gdemo.vars.loaded].id] = new Image();
                _vars.images[images[gdemo.vars.loaded].id].onload = function () {
                    gdemo.vars.loaded++;
                    loadNext();
                    this.onload = null;
                };
                _vars.images[images[gdemo.vars.loaded].id].id = images[gdemo.vars.loaded].id;
                _vars.images[images[gdemo.vars.loaded].id].src = images[gdemo.vars.loaded].src;
            }
            else {
                loadComplete();
                images = null;
                gdemo.vars.loaded = 0;
            }
        };
        return{
            /**
             * load 图片载入函数
             * @param imgs 图片集合 格式{id:'id', src:'img/test.png'} 有工具自动生成代码
             * @param loadCallback 载入中回调函数，用于传入缓冲动画函数
             * @param completeCallback 载入完成回调函数，用于完成改变引擎状态
             */
            load:function (imgs, loadCallback, completeCallback) {
                if (typeof loadCallback === 'function') {
                    loadCallBack = loadCallback;
                }
                if (typeof completeCallback === 'function') {
                    loadComplete = completeCallback;
                }
                images = imgs;
                if (images instanceof Array) {
                    gdemo.vars.sum = images.length;
                }
                loadNext();
                return gdemo;
            }
        };
    }();

    /**
     * 画布封装对象
     */
    gdemo.Context = function () {
        var _context, _images, _bufferCanvas, _bufferContext, _id, _canvas;
        return{
            setCanvases:function (id) {
                gdemo.vars.height = 500;
                gdemo.vars.width = 800;
                _vars.canvases[id].width = gdemo.vars.width;
                _vars.canvases[id].height = gdemo.vars.height;
            },
            /**
             * 多canvas初始化函数 初始化自动调用，其他地方不使用
             * @param canvases canvas集合
             */
            init:function (canvases) {
                for (var i = 0; i < canvases.length; i++) {
                    _vars.canvases[canvases[i].id] = document.getElementById(canvases[i].id);
                    _vars.contexts[canvases[i].id] = _vars.canvases[canvases[i].id].getContext('2d');
                    _vars.contexts[canvases[i].id].canvas.width = canvases[i].width;
                    _vars.contexts[canvases[i].id].canvas.height = canvases[i].height;
                }
                _images = _vars.images;
                if (canvases.length == 1) {
                    gdemo.Context.active(canvases[0].id);
                }
            },
            /**
             * 通过id激活canvas
             * @param id canvas的id
             */
            active:function (id) {
                _context = _vars.contexts[id];
                _canvas = _vars.canvases[id];
                gdemo.vars.SCREEN_OFFSET_LEFT = _canvas.offsetLeft;
                gdemo.vars.SCREEN_OFFSET_TOP = _canvas.offsetTop;
                return this;
            },
            /**
             * 通过id激活canvas用于双缓冲 需要与end结合使用
             * @param id
             */
            start:function (id) {
                gdemo.Context.clearScreen();
                _id = id;
                _bufferCanvas = document.createElement('canvas');
                _bufferCanvas.width = _vars.canvases[id].width;
                _bufferCanvas.height = _vars.canvases[id].height;
                _bufferContext = _bufferCanvas.getContext('2d');
                _context = _bufferContext;
                return this;
            },
            /**
             * 结束双缓冲，把内容画到当前处于激活状态的canvas
             */
            end:function () {
                _context = _vars.contexts[_id];
                _context.drawImage(_bufferCanvas, 0, 0);
                _bufferContext = null;
                _bufferCanvas = null;
                return this;
            },
            /**
             * 绘制图片
             * @param id 图片id
             * @param x 图片绘制坐标 x
             * @param y 图片绘制坐标 y
             * @param width 图片宽度
             * @param height 图片高度
             * @param sx 图片切图坐标x
             * @param sy 图片切图坐标y
             * @param sWidth 图片切图坐标宽度
             * @param sHeight 图片切图坐标高度
             */
            drawImage:function (id, x, y, width, height, sx, sy, sWidth, sHeight) {
                switch (arguments.length) {
                    case 3:
                        _context.drawImage(_images[id], x, y);
                        break;
                    case 5:
                        _context.drawImage(_images[id], x, y, width, height);
                        break;
                    case 9:
                        _context.drawImage(_images[id], sx, sy, sWidth, sHeight, x, y, width, height);
                        break;
                    default:
                        gdemo.Error('drawImage函数传入参数有问题');
                        break;
                }
                return this;
            },
            /**
             * 绘制文本
             * @param text 文本内容
             * @param x 坐标x
             * @param y 坐标y
             */
            fillText:function (text, x, y, font) {
                var _font;
                if (font) {
                    _font = _context.font;
                    _context.font = font;
                }
                _context.fillText(text, x, y);
                _context.font = _font;
                return this;
            },
            /**
             * 设置字体
             * @param font
             */
            setFont:function (font) {
                _context.font = font;
                return this;
            },
            /**
             * 清屏
             */
            clearScreen:function () {
                _context.clearRect(0, 0, _canvas.width, _canvas.height);
                return this;
            },
            beginPath:function () {
                _context.beginPath();
                return this;
            },
            endPath:function () {
                _context.endPath();
                return this;
            },
            moveTo:function (x, y) {
                _context.moveTo(x, y);
                return this;
            },
            lineTo:function (x, y) {
                _context.lineTo(x, y);
                return this;
            },
            stroke:function () {
                _context.stroke();
                return this;
            },
            strokeRect:function (x, y, width, height, style) {
                if (style) {
                    _context.fillStyle = style;
                }
                _context.strokeRect(x, y, width, height);
                _context.fillStyle = 'rgb(0, 0, 0)';
                return this;
            },
            fillRect:function (x, y, width, height, style) {
                if (style) {
                    _context.fillStyle = style;
                }
                _context.fillRect(x, y, width, height);
                _context.fillStyle = 'rgb(0, 0, 0)';
                return this;
            },
            /**
             * 使用链式调用，返回gdemo
             */
            back:function () {
                return gdemo;
            }
        };
    }();

    /**
     * 事件封装
     */
    gdemo.Events = {
        /**
         * 键盘按下事件
         * @param fn 回调函数
         */
        keyDown:function (fn) {
            if (typeof fn === 'function') {
                _vars.div.onkeydown = fn;
            }
            return this;
        },
        /**
         * 键盘抬起事件
         * @param fn 回调函数
         */
        keyUp:function (fn) {
            if (typeof fn === 'function') {
                _vars.div.onkeyup = fn;
            }
        },
        /**
         * 鼠标触屏开始事件
         * @param fn 回调函数
         */
        down:function (fn) {
            if (typeof fn === 'function') {
                _vars.div.ontouchstart = fn;
                _vars.div.onmousedown = fn;
            }
        },
        /**
         * 鼠标触屏抬起事件
         * @param fn 回调函数
         */
        up:function (fn) {
            if (typeof fn === 'function') {
                _vars.div.ontouchend = fn;
                _vars.div.onmouseup = fn;
            }
        },
        /**
         * 鼠标触屏滑动事件
         * @param fn 回调函数
         */
        move:function (fn) {
            if (typeof fn === 'function') {
                _vars.div.ontouchmove = fn;
                _vars.div.onmousemove = fn;
            }
        },
        /**
         * 鼠标点击事件
         * @param fn 回调函数
         */
        click:function (fn) {
            if (typeof fn === 'function') {
                _vars.div.onclick = fn;
            }
        },
        back:function () {
            return gdemo;
        }
    };

    /**
     * Timer封装类
     */
    gdemo.Timer = Class.extend({
        active:false, //判断是否是第一次开始
        init:function (fn, tick) {
            this._tick = tick;
            this._firstTime = true;
            if (typeof fn === 'function') {
                this._callback = fn;
            }
        },
        loop:function () {
            if (this._firstTime) {
                this._firstTime = false;
            }
            else {
                console.log(this._firstTime);
                this._callback();
            }
            this._id = gdemo.funs.requestTimeout(arguments.callee, this._tick, this);
        },
        /**
         * 计时器开始运行
         * 只有第一次调用 才用active
         */
        start:function () {
            this.active = true;
            this.loop();
        },
        /**
         * 清楚计时器
         */
        end:function () {
            win.clearRequestTimeout(this._id);
            this._enabled = null;
            this._callback = null;
        }
    });
    /**
     * 初始化动画
     * @param options
     * {id:'playerDieLeft', imageId:"playerDieLeft", width:189, height:167, delta:200,
     *  speedX:0, speedY:0, onFinish:function () {}}
     */
    gdemo.initAnimations = function (args) { //TODO:把这个变成单独的方法
        for (var j = 0; j < arguments.length; j++) {
            var options = arguments[j];
            for (var i = 0; i < options.length; i++) {
                var _options = {
                    id:options[i].id,
                    imageId:options[i].imageId,
                    width:options[i].width,
                    height:options[i].height,
                    delta:options[i].delta || 1000 / _vars.fps, //TODO delta初始值还需要修改
                    direction:options[i].direction || "right",
                    beginX:options[i].beginX || 0,
                    beginY:options[i].beginY || 0,
                    number:options[i].number || 0,
                    loop:options[i].loop || true,
                    frames:[]
                };
                _options.frames = _funs.caculateFrames(_options);
                _vars.animations[_options.id] = _options;
            }
        }
    };

    gdemo.Sprite = Class.extend({
        id:0,
        type:"",
        init:function (options) {
            this._animation = _vars.animations[options.animation];
            this._x = options.x;
            this._y = options.y;
            this._speedX = options.speedX;
            this._speedY = options.speedY;
            this.id = options.id;
            this.type = options.type;
            this._speed = 5;
            this.onFinish = null;
            this._px = 0;
            this._py = 0;
            this.updateAnimation();
        },
        updateAnimation:function () {

            this._index = 0;
            this._width = this._animation.width;
            this._height = this._animation.height;
            this._frames = this._animation.frames;
//            this._timeStart = null;
//            this._timeFinish = null;
//            this._delta = this._animation.delta;
            this._imageId = this._animation.imageId;
//            this.onFinish = this._animation.onFinish;
            this._px = this._x * gdemo.vars.ratio_x;
            this._py = gdemo.vars.height;
        },
        update:function () {
            if (this._x >= 800 * gdemo.vars.ratio_x) {//TODO:目前只适用于从左向右的出怪
                this._x -= this._speed;
            }
            else {
                this._x += this._speedX;
                this._y += this._speedY;
            }
            if (this._index < this._frames.length - 1) {
                this._index += 1;
            }
            else {
                this._index = 0;
                if (this.onFinish) {
                    this.onFinish();
                }
            }
            this._px = this._x * gdemo.vars.ratio_x;
            this._py = this._y * gdemo.vars.ratio_y;
        },
        /**
         * 改变当前动画
         * @param animation
         */
        changeAnimation:function (animation, onFinish) {
            this._animation = _vars.animations[animation];
            if (typeof onFinish === 'function') {
                this.onFinish = onFinish;
            }
            else {
                this.onFinish = null;
            }
            this.updateAnimation();
        },
        /**
         * 改变当前元素的速度
         * @param speedX x方向的速度
         * @param speedY y方向的速度
         */
        changeSpeed:function (speedX, speedY) {
            this._speedX = speedX;
            this._speedY = speedY;
        },
        /**
         * 绘制精灵  因为此函数会进行循环，所以对作用域进行了封装，所以使用draw()()来调用
         */
        draw:function () {
            //TODO:与主帧频不一样的动画 如何制作
            gdemo.Context.drawImage(this._imageId, this._px, this._py, this._width,
                this._height, this._frames[this._index].x, this._frames[this._index].y, this._width, this._height);
            this.update();
            console.log(this._py);
        },
        /**
         * 获取x坐标
         */
        getX:function () {
            return this._x;
        },
        /**
         * 获取y坐标
         */
        getY:function () {
            return this._y;
        }

    });
    /**
     * ajax操作类
     */
    gdemo.ajax = function (options) {
        //如果用户没有提供某个选项则用默认值代替
        options = {
            //HTTP请求的类型
            type:options.type || "POST",
            //请求的URL
            url:options.url || "",
            //请求返回的数据类型
            dataType:options.dataType || "",
            //请求超时时间
            timeout:options.timeout || 5000,
            //请求失败，成功或完成（无论成功或者失败都会执行）时执行的函数
            onComplete:options.onComplete ||
                function () {
                },
            onError:options.onError ||
                function () {
                },
            onSuccess:options.onSuccess ||
                function () {
                },
            //服务器返回的数据类型，这一默认值用于判断服务器返回的数据并做相应动作
            data:options.data || ""
        };
        //生成xml
        var createAjaxObj = function () {
            if (typeof XMLHttpRequest === "undefined")
                XMLHttpRequest = function () {
                    try {
                        return new ActiveXObject("Msxml2.XMLHTTP.6.0");
                    }
                    catch (e) {
                    }
                    try {
                        return new ActiveXObject("Msxml2.XMLHTTP.3.0");
                    }
                    catch (e) {
                    }
                    try {
                        return new ActiveXObject("Msxml2.XMLHTTP");
                    }
                    catch (e) {
                    }
                    return false;
                }
            return new XMLHttpRequest();
        };
        var createUrl = function () {
            var datas = [];
            var dataUrl = "?";
            for (name in options.data) {
                datas.push(name + "=" + options.data[name]);
            }
            dataUrl += datas.join("&");
            options.url += dataUrl;
        }
        //创建请求对象
        var xml = createAjaxObj();
        createUrl();
        //初始化异步请求
        xml.open(options.type, options.url, true);
        //我们在请求后等待5秒，超时则放弃
        var timeoutLenght = options.timeout;

        //记录请求是否成功完成
        var requestDone = false;

        // 初始化一个5秒后执行的回调函数，用于取消请求 （如果尚未完成的）
        gdemo.requestTimeout(function () {
            requestDone = true;
        }, timeoutLenght);

        // 监听文档状态的更新
        xml.onreadystatechange = function () {
            //保持等待，直到数据完全加载，并保证请求未超时
            if (xml.readyState == 4 && !requestDone) {
                //检查是否请求成功
                if (httpSuccess(xml)) {
                    //以服务器返回的数据作为参数调用成功回调函数
                    options.onSuccess(httpData(xml, options.dataType));
                }
                else {
                    options.onError();
                }
                //调用完成回调函数
                options.onComplete();
                //为避免内存泄漏，清理文档
                xml = null;
            }
        };
        //建立与服务器连接
        xml.send();

        //判断HTTP响应是否成功
        function httpSuccess(r) {
            try {
                //如果得不到服务器状态，且我们正在请求本地文件，认为成功
                return !r.status && location.protocol == "file:" ||

                    //所有200到300间的状态表示为成功
                    (r.status >= 200 && r.status < 300) ||

                    //文档未修改也算成功
                    r.status == 304 ||

                    //Safari 在文档未修改时返回空状态
                    navigator.userAgent.indexOf("Safari") >= 0 && typeof r.status == "undefined";
            }
            catch (e) {
            }
            //若检查状态失败，就假定请求是失败的
            return false;
        }

        function getJson(str) {
            try {
                return eval('(' + str + ')');
            }
            catch (e) {
                return {};
            }
        }

        //从HTTP响应中解析正确的数据
        function httpData(r, type) {
            var _data;
            switch (type) {
                case 'HTML':
                case 'TEXT':
                case 'SCRIPT':
                case 'XML':
                default:
                    _data = r.responseText;
                    break;

                case 'JSON':
                    _data = getJson(r.responseText);
                    break;
            }
            //返回响应数据（或为XML文档，或为文本字符串）
            return _data;
        }
    };
    /**
     * 启动游戏循环
     * @param state 开始的游戏状态
     */
    gdemo.start = function (state) {
        _vars.gameState = _vars.states[state];
        _funs.loop();
    };
    /**
     * 改变游戏的状态
     * @param beforeChange 改变状态的前的回调
     * @param state 游戏状态
     */
    gdemo.changeState = function (state, beforeChange) {
        if (typeof beforeChange == 'function') {
            beforeChange();
        }
        _vars.gameState = _vars.states[state];
    };
    /**
     * 对localstorage的封装用于离线存储
     * @type {Object}
     */
    gdemo.Storage = {
        set:function (key, value) {
            return win.localStorage.setItem(key, value);
        },
        get:function (key) {
            return win.localStorage.getItem(key);
        },
        remove:function (key) {
            return win.localStorage.removeItem(key);
        },
        clear:function () {
            return win.localStorage.clear();
        }
    };
    /**
     * 对sessionStorage的封装用于离线存储
     * @type {Object}
     */
    gdemo.Session = {
        set:function (key, value) {
            return win.sessionStorage.setItem(key, value);
        },
        get:function (key) {
            return win.sessionStorage.getItem(key);
        },
        remove:function (key) {
            return win.sessionStorage.removeItem(key);
        },
        clear:function (key) {
            return win.sessionStorage.clear();
        }
    };
})(window);