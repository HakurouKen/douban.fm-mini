var msg = {};

// desktop notification event listener , use a external variable msg to exchange data with "onRequest" listener
chrome.notifications.onClicked.addListener(function(id) {
	(msg.info || {}).album && chrome.tabs.create({ url:'http://music.douban.com' + msg.info.album },function(tab){});
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	window.msg = request;

	// init
	if (request.action === "init"){
		if(!!init){
			init();
			sendResponse({ init : true });
		} else{
			var info = player.getSongInfo();
			sendResponse( info.sid ? info :  { init : true } )
		}
		return;
	}

	// download song
	if (request.action === "download") {
		chrome.downloads.download({
			url: request.url,
			filename: request.name,
			conflictAction: "uniquify"
		}, function(id) {});
		return;
	}
});

chrome.cookies.onChanged.addListener(function(changeInfo){
	var ck = changeInfo.cookie;
	if( changeInfo.removed ){
		Util.removeCookie( ck.name );
	} else {
		Util.cookie( ck.name , ck.value );
	}
})
