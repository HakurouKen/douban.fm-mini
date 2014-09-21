(function(window, document, Util, undefined) {

	var getBaiduLrc = function(info,success,fail){
		var	link,
			getSug = function(cb){
				Util.ajax({
					url: 'http://sug.music.baidu.com/info/suggestion?format=json&version=2&from=0&word=' + info.title + "-" + info.artist,
					success: function(sug){
						cb && cb(sug);
					},
					error: function(err){
						fail(err);
					}
				})
			},
			getInfo = function(sug,cb){
				var id = (sug.data.song[0] || {}).songid;

				if(id){
					return Util.ajax({
						url: 'http://play.baidu.com/data/music/songlink',
						method: 'post',
						data: {
							songIds:id
						},
						success: function(info){
							cb && cb(info);
						},
						error: function(err){
							fail(err);
						}
					});
				} else {
					fail();
				}
			},
			getLrc = function(info,cb){
				var lrcLink = info.data.songList[0].lrcLink;
				if(lrcLink){
					link = 'http://play.baidu.com'+lrcLink;
					Util.ajax({
						url: link,
						success : function(raw){
							cb && cb(raw);
						},
						error: function(err){
							fail(err);
						}
					});
				} else {
					fail();
				};
			},
			format = function(raw){
				 var rawArr = raw.split('\n'),
				 	i=0,
				 	len = rawArr.length,
				 	checker = /^\[\d+:\d+(.\d+)\]/,
				 	matcher = /\[\d+:\d+(.\d+)\]/g ,
				 	timeStamps = [],
				 	cur,
				 	curTime,
				 	lrc = [];

				 for( ; i < len ; i++ ){
				 	if( checker.test(rawArr[i]) ){
				 		timeStamps = rawArr[i].match(matcher);
				 		timeStamps.forEach(function(timeStamp){
							cur = {};
				 			cur.lrc = rawArr[i].replace(timeStamps.join(""),"");
				 			curTime = 0;
					 		timeStamp.replace(/[\[\]]/g,"").split(":").forEach(function(t,i){
					 			curTime = curTime*60 + parseFloat(t,10);
					 		});
					 		curTime = curTime*1000;
					 		cur.time = Math.round(curTime);
					 		lrc.push(cur);
				 		});
				 	}
				 }

				 lrc.sort(function(lrc1,lrc2){
				 	return lrc1.time - lrc2.time;
				 });
				
				 return lrc;
			};

		getSug(function(sug){
			getInfo(sug,function(info){
				getLrc(info,function(raw){
					success && success( format(raw), link );
				});
			});
		});
	};

	var Lyric = function(player) {
		var _lrc = [], // the formated lyric
			_timeStamps = [], // timestamps for search
			_prefix = 0, // the offset of the song
			_freezed = false, // whether the lyric is rolling
			_link = "", // the download link of the song
			_info, // the song info
			_time = 0, // now (millisecond)
			_percent = 0, // played percent ( 0 ~ 1 )
			_length, // song's length
			_initLrc = function(lrc,link){
				_lrc = lrc || [];
				_prefix = 0;
				_timeStamps = _lrc.map(function(l){
					return l.time;
				});
				_timeStamps.push(player.getLength());
				_timeStamps.unshift(0);
				_link = link || "";
				return this;
			},
			_initCallback = function(){},
			_updateCallback = function(){},
			_lrcNow = function(time,start,end){
				var len = _timeStamps.length,
					start = start || 0,
					end = end || len-1,
					mid = Math.floor((start + end)/2);
				for( ; end-start>0 ; ){
					if( time >= _timeStamps[mid] ){
						start = mid + 1;
						mid = Math.floor((start+end)/2);
					}else{
						end = mid;
						mid = Math.floor((start+end)/2);
					}
				}
				
				return {
					startTime: function(){
						return _timeStamps[start-1];
					},
					endTime: function(){
						return _timeStamps[start];
					},
					lrc: function(){
						return _lrc[start-2] || "";
					},
					index: function(){
						return start-2;
					}
				};
			};

		var l = {
			init: function(callback){
				callback && (_initCallback = callback);
				_initCallback(_lrc,_link);
				return this;
			},
			update: function(callback){
				callback && (_updateCallback = callback);
				_updateCallback(_time,_percent);
				return this;
			},
			getLrc: function(){
				return _lrc;
			},
			curLrc: function(){
				return _lrcNow(_time);
			},
			fix: function(prefix){
				_prefix += prefix*1000;
			},
			freeze: function(){
				_freezed = true;
			},
			unfreeze: function(){
				_freezed = false;
			}
		};
		player.bind('loadedmetadata',function(){
			_info = player.getSongInfo();
			_length = player.getLength();
			l.freeze();

			getBaiduLrc(_info,function(lrc,link){
				_initLrc(lrc,link);
				l.unfreeze();
				_initCallback(lrc,link);
			},function(){
				_initLrc();
				_initCallback();
			});
		})

		player.bind('timeupdate',function(){
			_time = parseInt(player.getCurTime()*1000 + _prefix);
			_percent = _time / (_length*1000);
			_updateCallback(_time,_percent);
		});

		return l;
	};

	window.Lyric = Lyric;

})(window, document, Util);