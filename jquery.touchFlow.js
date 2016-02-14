/**
 * @name	jQuery.touchFlow
 * @author	dohoons ( http://dohoons.com/ )
 *
 * @version	1.0.0
 * @since	201602
 *
 * @param Object	settings	환경변수 오브젝트
 *		axis				-	드래그 방향 (String, default "x")
 *		page				-	초기 페이지 (Number or String, default 0)
 *		speed				-	애니메이션 속도 (Number, default 200)
 *		initComplete 		-	초기화 콜백 (Function, default null)
 *		stopped				-	정지 콜백 (Function, default null)
 *		resizeend			-	윈도우 리사이즈 콜백 (Function, default null)
 *
 * @example
 
	$("#target").touchFlow({
		page : 2
	});
	
	$("#target").data("touchFlow").go_page(4);
*/

;(function ($) {
	
	var TouchFlow = function (el, settings){
		
		var defaults = {
			axis : "x",
			page : 0,
			speed : 200,
			initComplete : null,
			stopped : null,
			resizeend : null
		};
		
		this.opts = $.extend({}, defaults, settings);
		this.target = el;
		this.wrap = $(el);
		this.list = this.wrap.children();
		this.wrapw;
		this.wraph;
		this.listw;
		this.listh;
		this.tmp;
		this.ticker;
		this.duration = this.opts.speed;
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
		this.lastmove;
		
		this.init();
	};

	TouchFlow.prototype = {
		
		init: function () {
			this.list = this.wrap.children();
			this.state = false;
			
			this.set_limit();
			this.go_page(this.opts.page);
			
			this.list
				.off("touchstart", this, this.touchstart)
				.off("touchmove", this, this.touchmove)
				.off("touchend touchcancel", this.touchend)
				.off("transitionend", this, this.transitionend)
				.on("touchstart", this, this.touchstart)
				.on("touchmove", this, this.touchmove)
				.on("touchend touchcancel", this, this.touchend)
				.on("transitionend", this, this.transitionend)
				
			$(window).off("resize", this, this.resize).on("resize", this, this.resize);
			
			this.list.find("a").on("click", this, function (e) {
				if(!e.data.link) {
					return false;
				}
			});
			
			if(typeof(this.opts.initComplete) == "function") {
				this.opts.initComplete.call(this, this.get_event_data());
			}
		},
		
		touchstart : function (e) {
			var obj = e.data;
			obj.startx = e.originalEvent.touches[0].pageX;
			obj.starty = e.originalEvent.touches[0].pageY;
			obj.posx = obj.startx - $(this).position().left;
			obj.posy = obj.starty - $(this).position().top;
			
			if(typeof(obj.opts.stopped) == "function" && obj.speedx != 0) {
				obj.opts.stopped.call(obj, obj.get_event_data());
			}
						
			obj.speedx = 0;
			obj.speedx = 0;
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
			var obj = e.data;
			var left = e.originalEvent.touches[0].pageX - obj.startx;
			var top = e.originalEvent.touches[0].pageY - obj.starty;
			var w = left < 0 ? left * -1 : left;
			var h = top < 0 ? top * -1 : top;
			var thisx = e.originalEvent.touches[0].pageX - obj.posx;
			var thisy = e.originalEvent.touches[0].pageY - obj.posy;
			var limit = obj.get_limit(thisx);
			var gapx = thisx - limit;
			var gapy = thisy - limit;
			
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
			var obj = e.data;
			var left = obj.lastmove.originalEvent.touches[0].pageX - obj.startx;
			var top = obj.lastmove.originalEvent.touches[0].pageY - obj.starty;
			var thisx = $(this).position().left;
			var thisy = $(this).position().top;
			var to = 0;
			
			obj.state = false;
			obj.speedx = obj.tempx;
			obj.speedy = obj.tempy;
			
			if(obj.opts.axis == "x" && !obj.limit_chk({x:thisx})) {
				if(left < 0) {
					to = obj.right;
				} else {
					to = 0;
				}
				obj.set_pos({x:to}, obj.duration);
			} else if(obj.opts.axis == "y" && !obj.limit_chk({y:thisy})) {
				if(top < 0) {
					to = obj.bottom;
				} else {
					to = 0;
				}
				obj.set_pos({y:to}, obj.duration);
			}
			
			setTimeout(function () {
				obj.link = true;
			},50);
			e.stopPropagation();
		},
		
		transitionend : function (e) {
			var obj = e.data;
			if(typeof(obj.opts.stopped) == "function") {
				obj.opts.stopped.call(obj, obj.get_event_data());
			}
		},
		
		resize : function (e) {
			var obj = e.data;
			
			clearTimeout(obj.tmp);
			obj.tmp = setTimeout(function () {
				obj.set_limit();
				obj.pos_control();
				
				if(typeof(obj.opts.resizeend) == "function") {
					obj.opts.resizeend.call(obj, obj.get_event_data());
				}
			}, 200);
		},
		
		move : function (obj) {
			var thisx = obj.list.position().left;
			var thisy = obj.list.position().top;
			
			if (obj.state == false) {
				if(Math.abs(obj.speedx) < 1 && Math.abs(obj.speedy) < 1) {
					clearInterval(obj.ticker);
					
					if(typeof(obj.opts.stopped) == "function" && obj.speedx != 0) {
						obj.opts.stopped.call(obj, obj.get_event_data());
					}
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
						
						return false;
					}
					
					obj.set_pos({x:x_limit,y:y_limit});
				}
			} else{
				obj.tempx = thisx - obj.prevx;
				obj.tempy = thisy - obj.prevy;
				obj.prevx = thisx;
				obj.prevy = thisy;
			}
		},
		
		limit_chk : function (obj) {
			if(obj.x != undefined) {
				return !(obj.x > 0) && !(obj.x < this.right);
			} else if(obj.y != undefined) {
				return !(obj.y > 0) && !(obj.y < this.bottom);
			}
		},
		
		set_limit : function () {
			var listw = 0;
			var listh = 0;
			this.wrapw = this.wrap.width();
			this.wraph = this.wrap.height();
			
			$(this.list.children()).each(function (i, el) {
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
			if(obj.x != null) {
				if(obj.x > 0) {
					obj.x = 0;
				}
				if(obj.x < this.right) {
					obj.x = this.right;
				}
				return obj.x;
			} else if(obj.y != null) {
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
		},
		
		pos_control : function () {
			var thisx = this.posX();
			var thisy = this.posY();
			var x_chk = this.limit_chk({x:thisx});
			var x_limit = this.get_limit({x:thisx});
			var y_chk = this.limit_chk({y:thisy});
			var y_limit = this.get_limit({y:thisy});
			
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
			var obj = $.extend({}, {x:0,y:0}, obj);
			this.list.css({
				"transition" : (!duration) ? "0ms" : duration + "ms linear",
				"transform" : "translate3d(" + obj.x +"px, " + obj.y +"px, 0px)"
			});
		},
		
		posX : function (val) {
			if(val) {
				var to = this.get_limit({x:-val});
				if(val == "first") {
					to = 0;
				} else if(val == "last") {
					to = this.right;
				}
				clearInterval(this.ticker);
				this.set_pos({x:to}, this.duration);
			}
			return this.list.position().left;
		},
		
		posY : function (val) {
			if(val) {
				var to = this.get_limit({y:-val});
				if(val == "first") {
					to = 0;
				} else if(val == "last") {
					to = this.bottom;
				}
				clearInterval(this.ticker);
				this.set_pos({y:to}, this.duration);
			}
			return this.list.position().top;
		},
		
		get_event_data : function () {
			return {
				obj : this,
				target : this.target,
				posX : -this.posX(),
				posY : -this.posY()
			}
		}
	};
  
	$.fn.touchFlow = function (settings) {
		return this.each(function () {
			if (!$.data(this, 'touchFlow')) {
				var opts = $.extend({}, settings);
				if(typeof(opts.page) == "string") {
					opts.page = $(this).find(opts.page).eq(0).index();
				}
				$.data(this, 'touchFlow', new TouchFlow( this, opts ));
			}
		});
	};
})(jQuery);