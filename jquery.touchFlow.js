/**
 * @name	jQuery.touchFlow
 * @author	dohoons ( http://dohoons.com/ )
 *
 * @version	1.4.0
 * @since	201602
 *
 * @param Object	settings	환경변수 오브젝트
 *		axis				-	드래그 방향 (String, default "x")
 *		page				-	초기 페이지 (Number or String, default 0)
 *		speed				-	애니메이션 속도 (Number, default 200)
 *		snap				-	스냅 기능 (Boolean, default false)
 *		scrollbar			-	스크롤바 표시 (Boolean, default false)
 *		scrollbarAutoHide	-	스크롤바 자동 숨김 (Boolean, default true)
 *		initComplete		-	초기화 콜백 (Function, default null)
 *		stopped				-	정지 콜백 (Function, default null)
 *		resizeend			-	윈도우 리사이즈 콜백 (Function, default null)
 *
 * @example
 
	$("#target").touchFlow({
		page : 2
	});
	
	$("#target").data("touchFlow").go_page(4);
*/

/* global jQuery */

;(function ($) {

	"use strict";

	var supportsCssTransitions = (function (style) {
		var prefixes = ['Webkit','Moz','Ms'];
		for(var i=0, l=prefixes.length; i < l; i++ ) {
			if( typeof style[prefixes[i] + 'Transition'] !== 'undefined') {
				return true;
			}
		}
		return false;
	})(document.createElement('div').style);
	
	var TouchFlow = function (el, settings){
		
		var defaults = {
			axis : "x",
			page : 0,
			speed : 200,
			side: 0.15,
			snap : false,
			scrollbar : false,
			scrollbarAutoHide : true,
			initComplete : null,
			stopped : null,
			resizeend : null
		};
		
		this.opts = $.extend({}, defaults, settings);
		this.target = el;
		this.wrap = $(el);
		this.list = this.wrap.children();
		this.wrapw = null;
		this.wraph = null;
		this.listw = null;
		this.listh = null;
		this.tmp = null;
		this.ticker = null;
		this.duration = this.opts.speed;
		this.side = this.opts.side;
		this.delay = 27;
		this.posx = 0;
		this.posy = 0;
		this.startx = 0;
		this.starty = 0;
		this.speedx = 0;
		this.speedy = 0;
		this.prevx = 0;
		this.prevy = 0;
		this.tempx = 0;
		this.tempy = 0;
		this.right = 0;
		this.bottom = 0;
		this.state = false;
		this.link = true;
		this.lastmove = null;
		this.scroll = {};
		
		this.init();
	};

	TouchFlow.prototype = {
		
		init: function () {
			this.list = this.wrap.children();
			this.state = false;
			
			if(typeof(this.opts.page) === "string") {
				this.opts.page = $(this.target).find(this.opts.page).eq(0).index();
			}
			
			this.set_limit();
			this.go_page(this.opts.page);
			
			this.list
				.off("touchstart", this, this.touchstart)
				.off("touchmove", this, this.touchmove)
				.off("touchend touchcancel", this.touchend)
				.off("dragstart", this, this.touchstart)
				.off("drag", this, this.touchmove)
				.off("dragend", this, this.touchend)
				.off("transitionend", this, this.transitionend)
				.on("touchstart", this, this.touchstart)
				.on("touchmove", this, this.touchmove)
				.on("touchend touchcancel", this, this.touchend)
				.on("dragstart", this, this.touchstart)
				.on("drag", this, this.touchmove)
				.on("dragend", this, this.touchend)
				.on("transitionend", this, this.transitionend);
				
			$(window).off("resize", this, this.resize).on("resize", this, this.resize);
			
			this.list.find("a").on("click", this, function (e) {
				if(!e.data.link) {
					return false;
				}
			});

			if(this.opts.scrollbar) {
				this.scrollbar_init();
			}
			
			if(typeof(this.opts.initComplete) === "function") {
				this.opts.initComplete.call(this, this.get_event_data());
			}

			return this;
		},

		scrollbar_init : function () {
			if(this.scroll.wrap === undefined) {
				this.scroll.wrap = $('<div class="touchflow-scrollbar"><div></div></div>');
				this.scroll.bar = this.scroll.wrap.find(" > div");

				this.wrap.append(this.scroll.wrap);
				this.scrollbar_pos();
			}
		},

		scrollbar_pos : function (f) {
			if(this.opts.scrollbar) {
				var wrap = this.scroll.wrap,
					bar = this.scroll.bar,
					full,
					pos,
					transition = (f) ? "300ms" : "0ms";

				if(this.opts.axis === "x") {
					full = this.wrapw / this.listw * 100;
					pos = -this.posX() / this.listw * 100;

					wrap.css({
						width : "100%",
						height : "5px",
						opacity : 1
					});

					bar.css({
						width : full + "%",
						height : "5px",
						left : pos + "%",
						transition : transition
					});
				} else if(this.opts.axis === "y") {
					full = this.wraph / this.listh * 100;
					pos = -this.posY() / this.listh * 100;

					wrap.css({
						width : "5px",
						height : "100%",
						opacity : 1
					});

					bar.css({
						width : "5px",
						height : full + "%",
						top : pos + "%",
						transition : transition
					});
				}

				if(this.opts.scrollbarAutoHide) {
					setTimeout(function () {
						if(f) {
							wrap.css({
								opacity : 0
							});
						}
					}, 300);
				}
			}
		},
		
		touchstart : function (e) {
			var obj = e.data;
			obj.startx = e.pageX || e.originalEvent.touches[0].pageX;
			obj.starty = e.pageY || e.originalEvent.touches[0].pageY;
			obj.posx = obj.startx - $(this).position().left;
			obj.posy = obj.starty - $(this).position().top;
			
			if(typeof(obj.opts.stopped) === "function" && obj.speedx !== 0) {
				obj.opts.stopped.call(obj, obj.get_event_data());
			}
						
			obj.speedx = 0;
			obj.speedy = 0;
			obj.prevx = 0;
			obj.prevy = 0;
			obj.tempx = 0;
			obj.tempy = 0;
			
			clearInterval(obj.ticker);
			obj.ticker = setInterval(function () {
				obj.move(obj);
			}, obj.delay);
			
			obj.state = true;
			obj.lastmove = e;
			e.stopPropagation();
		},
		
		touchmove : function (e) {
			var obj = e.data,
				pageX = e.pageX || e.originalEvent.touches[0].pageX,
				pageY = e.pageY || e.originalEvent.touches[0].pageY,
				left = pageX - obj.startx,
				top = pageY - obj.starty,
				w = left < 0 ? left * -1 : left,
				h = top < 0 ? top * -1 : top,
				thisx = pageX - obj.posx,
				thisy = pageY - obj.posy,
				limitx = obj.get_limit({x:thisx}),
				limity = obj.get_limit({y:thisy}),
				gapx = thisx - limitx,
				gapy = thisy - limity;

			if(obj.opts.axis == "x" && w > h) {
				obj.link = false;
				e.preventDefault();
				
				if(Math.abs(gapx) > 0) {
					thisx -= gapx / 2;
				}
				
				obj.set_pos({x:thisx});
			} else if(obj.opts.axis == "y" && w < h) {
				obj.link = false;
				e.preventDefault();
				
				if(Math.abs(gapy) > 0) {
					thisy -= gapy / 2;
				}
				
				obj.set_pos({y:thisy});
			}
			
			obj.lastmove = e;
			e.stopPropagation();
		},
		
		touchend : function (e) {
			var obj = e.data,
				pageX = obj.lastmove.pageX || obj.lastmove.originalEvent.touches[0].pageX,
				pageY = obj.lastmove.pageY || obj.lastmove.originalEvent.touches[0].pageY,
				left = pageX - obj.startx,
				top = pageY - obj.starty,
				thisx = $(this).position().left,
				thisy = $(this).position().top,
				to = 0;
			
			obj.state = false;
			obj.speedx = obj.tempx;
			obj.speedy = obj.tempy;
			
			if(obj.opts.axis == "x" && !obj.limit_chk({x:thisx})) {
				if(left < 0) {
					to = obj.right;
				} else {
					to = 0;
				}
				clearInterval(obj.ticker);
				obj.set_pos({x:to}, obj.duration);
			} else if(obj.opts.axis == "y" && !obj.limit_chk({y:thisy})) {
				if(top < 0) {
					to = obj.bottom;
				} else {
					to = 0;
				}
				clearInterval(obj.ticker);
				obj.set_pos({y:to}, obj.duration);
			}
			
			setTimeout(function () {
				obj.link = true;
			},50);
			e.stopPropagation();
		},
		
		transitionend : function (e) {
			var obj = e.data;
			if(typeof(obj.opts.stopped) === "function") {
				obj.opts.stopped.call(obj, obj.get_event_data());
			}
			obj.scrollbar_pos(true);
		},
		
		resize : function (e) {
			var obj = e.data;
			
			clearTimeout(obj.tmp);
			obj.tmp = setTimeout(function () {
				obj.set_limit();
				obj.pos_control();
				
				if(typeof(obj.opts.resizeend) === "function") {
					obj.opts.resizeend.call(obj, obj.get_event_data());
				}

				obj.scrollbar_pos(true);
			}, 200);
		},

		get_nearby_page : function (n) {
			var pos = (typeof n === "number") ? Math.abs(n) : null,
				arr = [],
				list_pos = this.list.position(),
				li = this.list.children(),
				len = li.length,
				tg = "";

			if(this.opts.axis === "x") {
				tg = "left";
				if(pos === null) {
					pos = Math.abs(list_pos.left);
				}
			} else {
				tg = "top";
				if(pos === null) {
					pos = Math.abs(list_pos.top);
				}
			}

			for(var i=0; i<len; ++i) {
				arr[i] = Math.abs(li.eq(i).position()[tg] - pos);
			}

			return arr.indexOf(Math.min.apply(null, arr));
		},
		
		move : function (obj) {
			var thisx = obj.list.position().left,
				thisy = obj.list.position().top;
			
			if (obj.state === false) {
				var abs_spdx = Math.abs(obj.speedx),
					abs_spdy = Math.abs(obj.speedy);

				if(obj.opts.snap && obj.opts.axis === "x" && abs_spdx < 10) {
					clearInterval(obj.ticker);
					obj.go_page(obj.get_nearby_page(thisx));

				} else if(obj.opts.snap && obj.opts.axis === "y" && abs_spdy < 10) {
					clearInterval(obj.ticker);
					obj.go_page(obj.get_nearby_page(thisy));

				} else if(abs_spdx < 1 && abs_spdy < 1) {
					clearInterval(obj.ticker);
					
					if(typeof(obj.opts.stopped) === "function" && obj.speedx !== 0) {
						obj.opts.stopped.call(obj, obj.get_event_data());
					}

					this.scrollbar_pos(true);
				} else {
					obj.speedx = 0.95 * obj.speedx;
					obj.speedy = 0.95 * obj.speedy;
					thisx += obj.speedx;
					thisy += obj.speedy;
					
					var x_chk = obj.limit_chk({x:thisx});
					var x_limit = obj.get_limit({x:thisx});
					var y_chk = obj.limit_chk({y:thisy});
					var y_limit = obj.get_limit({y:thisy});
					
					if(!x_chk || !y_chk) {
						obj.set_pos({x:thisx,y:thisy});
						
						if(Math.abs(thisx - x_limit) > 70) {
							clearInterval(obj.ticker);
							obj.set_pos({x:x_limit}, obj.duration);
						}
						
						if(Math.abs(thisy - y_limit) > 70) {
							clearInterval(obj.ticker);
							obj.set_pos({y:y_limit}, obj.duration);
						}
					} else {
						obj.set_pos({x:x_limit,y:y_limit});
					}
				}
			} else{
				obj.tempx = thisx - obj.prevx;
				obj.tempy = thisy - obj.prevy;
				obj.prevx = thisx;
				obj.prevy = thisy;
			}
			
			this.scrollbar_pos();
		},
		
		limit_chk : function (obj) {
			if(obj.x !== undefined) {
				return (obj.x > 0) === false && (obj.x < this.right) === false;
			} else if(obj.y !== undefined) {
				return (obj.y > 0) === false && (obj.y < this.bottom) === false;
			}
		},
		
		set_limit : function () {
			var listw = 0,
				listh = 0;
			this.wrapw = this.wrap.width();
			this.wraph = this.wrap.height();
			
			$(this.list.children()).each(function () {
				listw += $(this).outerWidth();
				listh += $(this).outerHeight();
			});
			this.listw = listw;
			this.listh = listh;
			
			if(this.wrapw < this.listw) {
				this.right = -(this.listw - this.wrapw);
			} else if(this.wrapw > this.listw) {
				this.right = 0;
			} else {
				this.right = -this.listw;
			}
			
			if(this.wraph < this.listh) {
				this.bottom = -(this.listh - this.wraph);
			} else if(this.wraph > this.listh) {
				this.bottom = 0;
			} else {
				this.bottom = -this.listh;
			}
		},
		
		get_limit : function (obj) {
			if(obj.x !== undefined) {
				if(obj.x > 0) {
					obj.x = 0;
				}
				if(obj.x < this.right) {
					obj.x = this.right;
				}
				return obj.x;
			} else if(obj.y !== undefined) {
				if(obj.y > 0) {
					obj.y = 0;
				}
				if(obj.y < this.bottom) {
					obj.y = this.bottom;
				}
				return obj.y;
			}
		},
		
		go_page : function (page) {
			this.opts.page = page;
			var tg = this.list.children().eq(page);
			
			if(this.opts.axis == "x") {
				var x = -(tg.position().left);
				this.posX(x);
			} else if(this.opts.axis == "y") {
				var y = -(tg.position().top);
				this.posY(y);
			}
			return this;
		},
		
		view_page : function (page) {
			this.opts.page = page;
			var tg = this.list.children().eq(page);
			
			if(this.opts.axis == "x") {
				var x = tg.position().left,
					w = tg.width(),
					xside = this.wrapw * this.side,
					posX = this.posX();

				if(x + posX < 0) {
					x = -(x - xside);
					this.posX(x);
				}
				
				if(x + w + posX > this.wrapw) {
					x = -(x + w - this.wrapw + xside);
					this.posX(x);
				}

			} else if(this.opts.axis == "y") {
				var y = tg.position().top,
					h = tg.height(),
					yside = this.wraph * this.side,
					posY = this.posY();
				
				if(y + posY < 0) {
					y = -(y - yside);
					this.posY(y);
				}

				if(y + h + posY > this.wraph) {
					y = -(y + h - this.wraph + yside);
					this.posY(y);
				}
			}

			return this;
		},
		
		pos_control : function () {
			var thisx = this.posX(),
				thisy = this.posY(),
				x_chk = this.limit_chk({x:thisx}),
				x_limit = this.get_limit({x:thisx}),
				y_chk = this.limit_chk({y:thisy}),
				y_limit = this.get_limit({y:thisy});
			
			if(!x_chk || !y_chk) {
				this.set_pos({x:thisx,y:thisy});
				
				if(Math.abs(thisx - x_limit) > 70) {
					this.set_pos({x:x_limit}, this.duration);
				}
				
				if(Math.abs(thisy - y_limit) > 70) {
					this.set_pos({y:y_limit}, this.duration);
				}
			}
		},
		
		set_pos : function (obj, duration) {
			obj = $.extend({}, {x:0,y:0}, obj);

			var style = (supportsCssTransitions) ? {
				"transition" : (!duration) ? "0ms" : duration + "ms linear",
				"transform" : "translate3d(" + obj.x +"px, " + obj.y +"px, 0px)"
			} : {
				"left" : obj.x + "px",
				"top" : obj.y + "px"
			};

			this.list.css(style);
		},
		
		posX : function (val) {
			if(val !== undefined) {
				var to = this.get_limit({x:val});
				if(val == "first") {
					to = 0;
				} else if(val == "last") {
					to = this.right;
				}
				clearInterval(this.ticker);
				this.set_pos({x:to}, this.duration);
				
				return this;
			}
			return this.list.position().left;
		},
		
		posY : function (val) {
			if(val !== undefined) {
				var to = this.get_limit({y:val});
				if(val == "first") {
					to = 0;
				} else if(val == "last") {
					to = this.bottom;
				}
				clearInterval(this.ticker);
				this.set_pos({y:to}, this.duration);
				
				return this;
			}
			return this.list.position().top;
		},
		
		get_event_data : function () {
			return {
				obj : this,
				target : this.target,
				posX : this.posX(),
				posY : this.posY()
			};
		}
	};
  
	$.fn.touchFlow = function (settings) {
		return this.each(function () {
			if (!$.data(this, 'touchFlow')) {
				$.data(this, 'touchFlow', new TouchFlow( this, settings ));
			}
		});
	};
})(jQuery);