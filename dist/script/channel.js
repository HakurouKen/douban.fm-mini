(function(window, Util, undefined) {
	var Channel = function(player) {
		var _curChannel = 0,
			channels = [],
			_onchange = [];

		return {
			getCurChannel: function() {
				return _curChannel;
			},
			change:function(callback){
				_onchange.push(callback);
			},
			changeChannel: function(to, area) {
				var init = function(){
					player.getNextSongList('n',function(info){
						//console.log(info);
						player.initSong(info.song[0]);
					})
				};

				// area : system_chls, history_chls, promotion_chls, fav_chls, recent_chls, search
				Util.ajax({
					url: player.getRoot() + "/j/change_channel?fcid=" + _curChannel + "&tcid=" + to + "&area=" + area,
					success: function(result) {
						_curChannel = parseInt(to);
						//console.log(result);
						(result.r === "0") && init();
					}
				});
			},
			init: function(callback){
				Util.ajax({
					url: player.getRoot() + '/j/fav_channels',
					success: function(chls){
						callback && callback(chls.channels);
					}
				})
			}
		};
	}

	window.Channel = Channel;
})(window, Util);