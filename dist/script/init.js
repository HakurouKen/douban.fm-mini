!function(window,undefined){
	window.init = function(){
		window.player = Player();
		window.channel = Channel(player);

		chrome.cookies.getAll({url:"http://douban.fm"}, function (cks){
			cks.forEach(function(ck){
				Util.cookie(ck.name,ck.value);
			});
			
			// get the first song list
			Util.ajax({
				'url': player.getRoot() + "/j/change_channel?fcid=undefined&tcid=0&area=songchannel",
				'success': function(){
					player.getNextSongList("n",function(info){
						player.initSong(info.song[0]);
					});
				}
			});

		});	

		// run once
		init = null;
	}

}(window);