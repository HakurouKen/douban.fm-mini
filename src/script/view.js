(function(window, document, undefined) {
	var bg = chrome.extension.getBackgroundPage();
	window.player = {};
	window.channel = {};

	var PlayerUI = function(player){
		// cache the dom for speed.
		var loader = (new Component('.player')).init(),
			time = (new Component('.controller .time')).init(),
			playProgress = (new Component(".play-progress")).init(),
			loadProgress = (new Component(".load-progress")).init();

		// heart/unheart a song
		var heart = new Component('a.btn.heart',function(event,dom){
			if( dom.toogleClass('hearted').hasClass('hearted') ){
				player.heart(true);
			} else {
				player.heart(false);
			}
		});

		// trash a song
		var trash = new Component('a.btn.trash',function(){
			player.trash();
		});

		// next song
		var next = new Component('a.btn.next',function(){
			player.next();
		});

		// prev song
		var prev = new Component('a.btn.prev',function(){
			player.prev();
		});

		// pause
		var pause = new Component('.btn.pause',function(event){
			event.stopPropagation();
			(new Component(".player-container")).init().addClass("paused");
			player.pause();
		});

		// resume song
		var resume = new Component('#fm-player-container');

		// adjust the volume
		var volume = new Component('.volume-wrapper',function(event,dom){
			event.stopPropagation();
			var vol = dom.children('.volume'),
				curVal = vol.children('.current-volume'),
				w = event.clientX - vol.pageOffset().left,
				per = w / vol.width();
			player.vol(per * 100);
		});

		// the playing progress
		var progress = new Component('div.player-wrapper',function(event){
			var w = event.clientX - loader.offset().left,
				newProgress = w / loader.width();
			player.jumpTo(newProgress * 100 + "%");
		});

		// open the album in douban
		var cover = new Component('.cover', function(event,elem) {
			window.open( elem.dom[0].getAttribute("data-album") );
		});

		// loop switch
		var loop = new Component('.loop', function(event,dom) {
			if (player.loop()) {
				player.loop(false);
				dom.removeClass('on').addClass('off').text("单曲循环：关");
			} else {
				player.loop(true);
				dom.removeClass('off').addClass('on').text("单曲循环：开");
			}
		});

		// download
		var download = new Component('.download', function(event,comp){
			event.preventDefault();
			var elem = comp.dom[0];
			if( !elem ){
				return;
			}

			chrome.extension.sendRequest({
				"action": "download",
				"url": elem.getAttribute('data-href'),
				"name": elem.title.replace("下载 : ", "") + "." +
					(elem.getAttribute('data-href').match(/\.\w+$/) || [""])[0].substr(1)
			}, function() {});
		});

		// resize the picture
		var picture = new Component('.cover img','load',function(event,dom){
			var img = new Image(),
				img_size = 245 ,
				info = player.getSongInfo();
			img.src = info.picture.replace(/\/mpic\//,"\/lpic\/");
			if( img.width / img.height > 1.1 ){
				dom.css("width",img_size+"px")
					.css("height","auto");
			} else if ( img.height / img.width > 1.1 ){
				dom.css("height",img_size+"px")
					.css("width","auto");
			} else {
				dom.css("height",img_size+"px")
					.css("width",img_size+"px");
			}
		});

		// auto trigger
		// progress
		player.bind('timeupdate',function(){
			var remain = player.getLength() - player.getCurTime(),
				timeStamp = "-" + Math.floor(remain / 60) + ":" + ("0" + parseInt(remain % 60)).substr(-2) ;
			time.text(timeStamp);
			playProgress.width(loader.width()*player.getPlayingProgress());
		});

		// load progress
		player.bind('progress',function(){
			loadProgress.width(loader.width()*player.getLoadingProgress());
		});

		// change volume
		player.bind('volumechange',function(){
			var vol = (new Component('.current-volume')).init();
			vol.css("width", player.vol() + "%");
		});

		return {
			btn: {
				heart: heart.init('#fm-player-container'),
				trash: trash.init('#fm-player-container'),
				next: next.init('#fm-player-container'),
				prev: prev.init('#fm-player-container'),
				pause: pause.init('#fm-player-container'),
				resume: resume.init().delegate('.player-container.paused',function(event,dom){
					dom.removeClass('paused');
					player.resume();
				}),
				volume: volume.init('#fm-player-container'),
				progress: progress.init('#fm-player-container'),
				cover: cover.init('#fm-player-container'),
				loop: loop.init('#fm-player-container'),
				download: download.init('#fm-player-container'),
				picture: picture.init('#fm-player-container')
			},
			set: function(selector,attr,val){
				var comp = Util.isString(selector) ? (new Component(selector).init('#fm-player-container')) : selector;
				if(attr === "text"){
					comp.text(val)
				}else{
					comp.dom.forEach(function(elem){
						elem.setAttribute(attr,val);
					})
				}
				return this;
			},
			refresh: function(){
				var self = this,
					info = player.getSongInfo(),
					container = (new Component('.player-container')).init(),
					album = /\/subject\//.test(info.album) ? "http://music.douban.com" + info.album : info.album;
					state = player.getState(),
					pic = info.picture.replace(/\/mpic\//,"\/lpic\/"),
					title = info.title + " - " + info.artist;
					title = title.length > 25 ? title.slice(0,23)+'...' : title;

					self.set("div.cover>img","src",pic); // img link
					self.set("div.cover>img","alt",info.title); // img alternative
					self.set(".cover","data-album","http://music.douban.com"+info.album); // album link
					self.set(".infos .artist","text",info.artist); // artist
					self.set(".infos .album-title","text","<"+info.albumtitle+">"); // album title
					self.set(".infos .year","text",info.public_time); // year
					self.set(".infos .title-roller a","text",info.title); // title
					self.set(".infos .title-roller a","href","http://music.douban.com"+info.album); // douban album link
					self.set(".download","text", title ); // the download link
					self.set(".download","title","下载 : " + info.title + " - " + info.artist ); // download title
					self.set(".download","data-href", info.url ); // download link
					info.like && (new Component('.btn.heart')).init().addClass('hearted');
					state === 'pause' ? container.addClass('paused') : container.removeClass('paused');
				return self;
			},
			init: function(){
				var self = this;
				player.bind('loadstart',function(){
					self.refresh();
				});
				self.refresh();
				return self;
			}
		}
	};

	var ChannelUI = function(channel){
		var container = (new Component('#fm-channel-container')).init(),
			myChannel = (new Component('#fm-channel')).init('#fm-channel-container'),
			searchResult = (new Component('#search-result')).init('#fm-channel-container'),
			privateChannel = myChannel.children('[data-area="system_chls"]'),
			channelScroller;

		var showSearchResult = function(){
				searchResult.css('display','block');
				myChannel.css('display','none');
				channelScroller.update();
			},
			showMyChannel = function(){
				myChannel.css('display','block');
				searchResult.css('display','none');
				channelScroller.update();
			};

		// search
		var search = new Component('#fm-search form','submit',function(event,comp){
			event.preventDefault();
			var form = Util.toArray( comp.dom[0] ),
				data = {}
				form.forEach(function(input){
					if(input.type !== 'submit'){
						data[input.name] = input.value;
					}
				});
			channel.search(data,function(chls){
				//console.log(chls);
				var html = Util.render('search-result-tpl',{
					keyword: data.keyword,
					result: chls
				});
				searchResult.html(html);
				showSearchResult();
			})
		});

		var change = function(id){
			return myChannel.children( '[data-id="' + id + '"]>.channel' ).trigger();
		};

		var addChannel = function(info,area,chg){
			var html,
				sysChls = myChannel.children('[data-area="'+area+'"]'),
				chl = sysChls.children( '[data-id="' + info.id + '"]' );
			if(chl.dom.length){
				chg && change(info.id);
				return chl;
			} else {
				html = Util.render('single-channel-tpl',{info:info});
				sysChls.append(html);
				chg && change(info.id);
				channelScroller.update();
				return sysChls.children('[data-id="' + info.id + '"]');
			}
		};

		var removeChannel = function(id,area){
			var selector = '[data-id="' + id + '"]';
			if(!!area){
				selector = '[data-area="'+area+'"] ' + selector;
			}
			return (new Component(selector)).init().remove();
		};

		var dealAllPlaying = function(){
			return (new Component('[data-id="' + channel.getCurChannel() + '"]')).init().addClass('playing');
		}

		// return from search result to channel list
		searchResult.delegate('.return',function(){
			showMyChannel();
		}).init();

		// click to change channel
		myChannel.delegate('li.channel-item>.channel',function(event,dom){
			var item = dom.parent(),
				d = item.dom[0] || {},
				id = d.getAttribute('data-id'),
				area = d.parentElement.getAttribute('data-area');
			myChannel.children('li.channel-item.playing').removeClass('playing');
			item.addClass('playing');
			channel.changeChannel(id,area);
		});
		
		// click to add search result to my channel
		searchResult.delegate('.channel-item',function(event,chl){
			var dom = chl.dom[0],
				info = {};
			
			info.name = dom.dataset.name;
			info.id = dom.dataset.cid;
			info.num = parseInt( dom.dataset.songnum );
			info.intro = dom.dataset.intro;
			// console.log(info);
			addChannel(info,'system_chls',true);
		});

		// lazy added the status of the channel
		myChannel.delegate('li.channel-item','mouseover',function(event,comp){
			var dom = comp.dom[0],
				id = parseInt(dom.dataset.id);
			if( id<=0 ){
				return comp;
			}

			if( channel.isFav(id) ){
				comp.removeClass('unfav').addClass('fav');
			} else {
				comp.removeClass('fav').addClass('unfav');
			}
			return comp;
		});

		// fav or unfav a channel
		myChannel.delegate('li.channel-item .opt',function(event,comp){
			var parent = comp.parent(),
				item = comp.dom[0].parentElement,
				id = item.dataset.id,
				info = {
					id: id,
					name: item.dataset.name,
					intro: item.dataset.intro
				};
			if( parent.hasClass('unfav') ){
				channel.fav(id,function(){
					addChannel(info,'fav_chls');
					dealAllPlaying();
				});
			} else if ( parent.hasClass('fav') ){
				channel.unfav(id,function(){
					removeChannel(id,'fav_chls');
					addChannel(info,'system_chls');
					dealAllPlaying();
				});
			}
			parent.toogleClass('fav').toogleClass('unfav');
		});
		
		return {
			event:{
				search: search.init('#fm-channel-container'),
				change: function(id){
					change(id);
					return this;
				},
			},
			init: function(){
				channel.init(function(chls){
					// console.log(channels);
					var sys = chls.sys.slice(0);
					var cur = channel.getCurInfo(),
						infos = [{
							area: 'system_chls',
							channels: sys,
						},{
							title: '我的收藏',
							area: 'fav_chls',
							channels: chls.fav
						},{
							title: '热门歌曲',
							area: 'recent_chls',
							channels: chls.hot
						},{
							title: '上升最快',
							area: 'recent_chls',
							channels: chls.trend
						}];

					channel.isMine(cur.id) || sys.push(cur);

					var html = Util.render('channel-tpl',{
						playing: channel.getCurChannel(),
						infos: infos
					},true);
					var $channel = (new Component('#fm-channel')).init();
					
					$channel.html(html);
					channelScroller = tinyscrollbar( document.getElementById('fm-channel-container') );
					container.removeClass('preload');
				});
				return this;
			},
			status: function(){
				return container.hasClass('off') ? 'off' : 'on';
			},
			on: function(){
				container.removeClass('off');	
				return this;
			},
			off: function(){
				container.addClass('off');
				return this;
			},
			search: {
				on: function(){
					myChannel.css('display','none');
					searchResult.css('display','block');
					channelScroller.update();
				},
				off: function(){
					myChannel.css('display','block');
					searchResult.css('display','none');
					channelScroller.update();
					return this;
				}
			}
		}
	};

	var ToogleUI = function(ChannelUI){
		var toogle = new Component('.toogle',function(event,dom){
			if( ChannelUI.status() === 'on' ){
				ChannelUI.off();
				dom.removeClass('on');
			} else {
				ChannelUI.on();
				dom.addClass('on');
			}
		}).init();
		return {};
	}

	function init(){
		chrome.extension.sendRequest({
				action:'init'
			},function(info){
				if(info.init){
					setTimeout(function(){
						init();
					},1000);
				}else{
					//console.log(info);
					player = bg.player;
					channel = bg.channel;
					bindHotKey( PlayerUI(player).init() ,player);
					window.ChannelUITest = ChannelUI(channel).init();
					ToogleUI( ChannelUITest );
				}
		});
	}

	init();

	function bindHotKey(FM,player) {
		var container = (new Component('body>.wrapper')).init(),
			hint = (new Component('#hint')).init();

		document.addEventListener('keydown', function(event) {
			if( event.target.nodeName.toLowerCase() === 'input' ){
				return;
			}

			switch (event.keyCode) {
				case 70: // f(avorite)
					FM.btn.heart.trigger();
					break;

				case 68: // d(elete)
					FM.btn.trash.trigger();
					break;

				case 83: // s(kip)
					FM.btn.next.trigger();
					break;

				case 66: // b(ack)
					FM.btn.prev.trigger();
					break;

				case 32: // space
					player.getState() === 'pause' ? 
						FM.btn.resume.delegateTrigger() : FM.btn.pause.trigger();
					break;

				case 76: // l(oop)
					FM.btn.loop.trigger();
					break;

				case 87: // do(w)nload
					FM.btn.download.trigger();
					break;
					
				case 37: // Left Arrow
					player.jumpTo( player.getCurTime() - 5);
					break;

				case 39: // Right Arrow
					player.jumpTo( player.getCurTime() + 5);
					break;

				case 38: // Up Arrow
					player.volUp(5);
					break;

				case 40: // Down Arrow
					player.volDown(5);
					break;

				case 72: // h(elp)
					container.toogleClass('blur');
					hint.toogleClass('hide');
					break;

				default:
					break;
			}
		});
	}

})(window, document);