(function(window, Util, undefined) {
	var Channel = function(player) {
		var _curChannel = 0,
			_cur ={
				id: 0,
				name: '我的私人兆赫',
				isMine:true
			},
			_channels = {
				sys:[{
					name:'我的私人兆赫',
					id: 0
				},{
					name: '我的红心兆赫',
					id: -3
				}],
				fav:[],
				hot:[],
				trend:[],
				search:{
					key: '',
					result: []
				}
			},
			_all = [];

		return {
			getCurChannel: function() {
				return _curChannel;
			},
			getChannels: function(){
				return _channels;
			},
			getCurInfo: function(){
				return _cur;
			},
			isMine: function(id){
				var ids = [].concat(_channels.sys,_channels.fav,_channels.hot,_channels.trend).map(function(chl){
					return parseInt(chl.id);
				});
				id = parseInt(id);
				return ids.indexOf(id)>=0;
			},
			changeChannel: function(to, area) {
				var init = function(){
					player.getNextSongList('n',function(info){
						//console.log(info);
						player.initSong(info.song[0]);
					})
				},
				all = [],
				ids = [],
				i;

				// area : system_chls, history_chls, promotion_chls, fav_chls, recent_chls, search
				if( _curChannel !== parseInt(to) ){
					Util.ajax({
						url: player.getRoot() + "/j/change_channel?fcid=" + _curChannel + "&tcid=" + to + "&area=" + area,
						success: function(result) {
							_curChannel = parseInt(to);
							//console.log(result);
							all = all.concat(_channels.sys,_channels.fav,_channels.hot,_channels.trend);
							ids = all.map(function(chl){ return parseInt(chl.id) });
							
							if( (i = ids.indexOf(_curChannel))>=0 ){
								_cur = all[i];
								(result.r === "0") && init();
							} else {
								Util.ajax({
									url: player.getRoot() + "/j/explore/get_channel_info?cid=" + to,
									success: function(resp){
										_cur = resp.data.res;
										init();
									}
								})
							}
						}
					});
				}
			},
			init: function(callback){
				var request = {
						total: 3, // favorite channels , hot channels , up trending channels
						complete: 0
					},
					getRemote = function(url,todo){
						Util.ajax({
							url: player.getRoot() + url,
							success: function(chls){
								todo(chls);
								request.complete++;
							},
							error: function(msg){
								request.complete++;
							}
						})
					};

				// fav channel init
				getRemote('/j/fav_channels',function(chls){
					_channels.fav = chls.channels;
				});

				// hot channel init
				if(!_channels.hot.length){
					getRemote('/j/explore/hot_channels',function(chls){
						if( chls.status ){
							_channels.hot = chls.data.channels;
						}
					});
				} else {
					request.total-- ;
				}
				// up trending channel init
				if(!_channels.trend.length){
					getRemote('/j/explore/up_trending_channels',function(chls){
						if( chls.status ){
							_channels.trend = chls.data.channels;
						}
					});
				} else {
					request.total-- ;
				}

				Util.observe(request,function(){
					if(request.total === request.complete){
						callback(_channels);
					}
				});
			},
			isFav: function(id){
				id = parseInt(id);
				return !_channels.fav.every(function(chl){
					return parseInt(chl.id) !== id;
				});
			},
			fav: function(id,callback){
				var isFav = this.isFav(id);
				if(isFav){
					callback && callback();
				} else {
					Util.ajax({
						url: player.getRoot() + '/j/explore/fav_channel?cid=' + id,
						success: function(data){
							if( data.status ){
								callback　&& callback(id);
							}
						}
					});
					Util.ajax({
						url: player.getRoot() + '/j/explore/get_channel_info?cid=' + id,
						success: function(json){
							if( json.status ){
								_channels.fav.push(json.data.res);;
							}
						}
					});
				}
			},
			unfav: function(id,callback){
				id = parseInt(id);
				Util.ajax({
					url: player.getRoot() + '/j/explore/unfav_channel?cid=' + id,
					success: function(){
						_channels.fav.every(function(chl,i){
							if(parseInt(chl.id) === id){
								_channels.fav.splice(i,1);
							}
							return parseInt(chl.id) !== id;
						});
						callback && callback(id);
					}
				});
			},
			search: function(params,callback){
				Util.ajax({
					url: player.getRoot() + '/j/explore/search',
					data: {
						query: params.keyword||"",
						start: params.start || 0,
						limit: params.limit || 100
					},
					success: function(res){
						if (res.status){
							_channels.search.key = params.keyword;
							_channels.search.result = res.data.channels;
							callback && callback(res.data.channels);
						}
					}
				});
			}
		};
	}

	window.Channel = Channel;
})(window, Util);