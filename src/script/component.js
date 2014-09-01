(function(window,document,undefined){
	var _components = [];
	var Component = function(selector,eventType,handler){
		if( !Util.isString(selector) ){
			this.selector = "";
			this.dom = selector;
		} else {
			this.selector = selector;
		}

		if( Util.isString(eventType) ){
			this.eventType = eventType;
			this.handler = handler || function(){};
		} else {
			if( Util.isFunction(eventType) ){
				this.eventType = 'click';
				this.handler = eventType;
			} else if (!eventType) {
				this.eventType = 'click';
				this.handler = function(){};
			}
		}
		(_components || []).push(this);
		return this;
	};

	var Comp = Component;
	Comp.fn = Component.prototype;

	Comp.fn.init = function(root){
		var self = this;
		root = ( Util.isString(root) ? document.querySelector(root) : root ) || document;
		if(!self.selector){
			return self;
		}
		var dom = self.dom = self.dom || Util.toArray( root.querySelectorAll(self.selector) ); 
		dom.forEach(function(elem){
			elem.addEventListener(self.eventType,function(event){
				self.handler(event,self);
			});
		});
		return self;
	};

	Comp.extend = Comp.fn.extend = function(o){
		for(var key in o){
			if(o.hasOwnProperty(key)){
				this[key] = o[key];
			}
		} 
	}

	// event
	Comp.fn.extend({
		delegate : function(selector,eventType,handler){
			var self = this,
				elems,
				target;
			self.delegated = self.delegated || []
			
			if( Util.isFunction(eventType) ){
				handler = eventType;
				eventType = 'click';
			}

			self.delegated.push({
				selector: selector,
				eventType: eventType,
				handler: handler
			});

			this.dom.forEach(function(parent){
				parent.addEventListener(self.eventType,function(event){
					elems = Util.toArray ( parent.querySelectorAll(selector) );
					for( target=event.target; target !== parent ; target = target.parentNode ){
						if( elems.indexOf(target)>=0 ){
							handler( event, (new Component([target])).init() );
							break;
						}
					}
				});
			});

			return self;
		},

		delegateTrigger: function(selector){
			var children = this.delegated,
				len = (children || []).length,
				i = 0,
				deal = [];
			if( !len ){
				return this;
			}
			if(!selector){
				children.forEach(function(child){
					(new Component(child.selector,child.eventType,child.handler)).init().trigger();
				});
			} else {
				for( ; i < len ; i++){
					if( children[i].selector == selector ){
						deal.push(children[i]);
					}
				}
				deal.forEach(function(child){
					(new Component(child.selector,child.eventType,child.handler)).init().trigger();
				})
			}

			return this;
		},

		trigger: function(eventType){
			var trigger,
				self = this,
				eventType = eventType || self.eventType;
			
			if(document.fireEvent){
				trigger = function(){
					self.dom.forEach(function(d){
						d.fireEvent('on' + eventType);
					});
					return self;
				}
			} else {
				trigger = function(){
					self.dom.forEach(function(d){
						var ev = document.createEvent('Events');
						ev.initEvent(eventType,true,false);
						d.dispatchEvent(ev);
					});
					return self;
				}
			}

			return trigger();
		}
	});

	// deal with class
	var white = /[\f\n\r\t]/g,
		word = /\S+/g;
	Comp.fn.extend({
		hasClass: function(name){
			var className = " "+ name + " ";
			// true if one or (more doms) has this className.
			return !this.dom.every(function(elem){
				return ! ( (" " + elem.className.replace(white," ") +  " ").indexOf(name) >= 0 );
			});
		},

		addClass: function(name){
			var classes = name.match(word),
				cls,
				i,
				result;
			this.dom.forEach(function(elem){
				var cur = " " + elem.className.replace(white," ") + " ";
				if(cur){
					i=0;
					while((cls=classes[i++])){
						if(cur.indexOf(" "+cls+ " ")<0){
							cur += cls+" ";
						}
					}
					result = cur.trim();
					if( elem.className !== result ){
						// avoid extra repaint
						elem.className = result;
					}
				}
			});
			return this;
		},

		removeClass: function(name){
			var classes = name.match(word),
				result;

			this.dom.forEach(function(elem){
				var cur = elem.className.match(word) || [];
				result = cur.map(function(w){
					return (classes.indexOf(w)>=0) ? "" : w;
				}).join(" ").replace(/\s+/g," ").trim();
				if(elem.className !== result){
					// avoid extra repaint
					elem.className = result;
				}
			});
			return this;
		},

		toogleClass: function(name){
			var classes = name.match(word),
				cls,
				i,
				result;
			this.dom.forEach(function(elem){
				var cur = " " + elem.className.replace(white," ") + " ";
				i=0;
				while((cls=classes[i++])){
					if( cur.indexOf(" "+cls+" ")<0){
						cur+= cls+" ";
					} else{
						cur = cur.replace(" "+cls ,"");
					}
				}
				result = cur.trim()
				if(elem.className !== result){
					// avoid extra repaint
					elem.className = result;
				}
			});
			return this;
		}
	});

	// deal with children
	Comp.fn.extend({
		children : function(selector){
			var children = [];
			this.dom.forEach(function(parent){
				Array.prototype.push.apply( children, parent.querySelectorAll(selector) );
			});
			return (new Component(children)).init();
		}
	});

	var toCamel = function(text){
		return text.replace(/-([\da-z])/gi,function(all,l){ 
			return l.toUpperCase();
		});
	}

	// display
	Comp.fn.extend({
		css: function(name,value){
			var o,
				type = Util.type(name);
			if( type === "object" ){
				o = name;
				for (var key in o){
					o.hasOwnProperty(key)
						&& this.css(key,o[key]);
				}
			} else if( type === 'string'){
				if(value !== undefined ){
					// set
					this.dom.forEach(function(elem){
						elem.style[toCamel(name)] = value;
					});
					return this;
				} else {
					// get
					if( this.dom[0] )
						return this.dom[0].ownerDocument.defaultView.getComputedStyle( that[0], null )[name];
					return;
				}
			}
		},

		offset: function(){
			var box = this.pageOffset(),
				elem = this.dom[0],
				doc = elem && elem.ownerDocument,
				docElem;

			if(!doc){
				return;
			}
			docElem = doc.documentElement;

			return{
				top: box.top + ( window.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
				left: box.left + ( window.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
			}
		},

		pageOffset: function(){
			var box = { top: 0, left: 0},
				elem = this.dom[0];

			if( elem.getBoundingClientRect ){
				box = elem.getBoundingClientRect();
			}

			return {
				top: box.top,
				left: box.left
			};
		},

		height: function(h){
			var elem = this.dom[0] || {};
			if(h == undefined){
				return elem.offsetHeight;
			}else{
				this.css("height", parseInt(h) + "px");
			}
			return this;
		},

		width: function(w){
			var elem = this.dom[0] || {};
			if(w == undefined){
				return elem.offsetWidth;
			}else{
				this.css("width", parseInt(w) + "px");
			}
			return this;
		},

		text: function(t){
			var elem = this.dom[0] || {}
			if(t == undefined){
				return elem.textContent;
			}else{
				elem.textContent = t;
			}
			return this;
		}
	});

	window.Component = Component;

})(window,document);