var Util = (function(window,document,undefined){
	var type = function(o){
			return Object.prototype.toString.call(o).slice(8,-1).toLowerCase(1);
		},

		isFunction = function(o){
			return type(o) === 'function';
		},

		isString = function(o){
			return type(o) === 'string';
		},

		isArray = function(o){
			return type(o) === 'array';
		};

	var toArray = function(arr){
		return Array.prototype.slice.call(arr,0);
	}

	var serialize = function(data){
		var arr = [];
		for (var key in data){
			if(data.hasOwnProperty(key)){
				arr.push( encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
			}
		}

		return arr.join("&");
	};	

	var ajax = function(option){
		var method = ( option.method || "get" ).toString().toUpperCase(),
			url = option.url || "" ,
			data = serialize( option.data || {} ),
			beforeSend = option.beforeSend || option.beforesend || function(){},
			error = option.error || function(){},
			success = option.success || function(data){};

		url +=  method === "GET" && data !== "" ?
			"?" + data : "";

		var xhr = new XMLHttpRequest();
		xhr.open(method,url,true);
		xhr.onreadystatechange=function(){
			if(xhr.readyState == 4){
				if( xhr.status==200 ){
					var resp;
					try{
						resp = JSON.parse(xhr.responseText);
					} catch(e) {
						resp = xhr.responseText;
					}
					
					success(resp,xhr.status);	
				} else {
					error(xhr.status);
				}
			}
		}

		xhr.send( method==="GET" ? undefined : data );
		return xhr;
	};

	var cache = {};
	var render = function(tpl, data, useCache) {
		// micro-templating
		if(	type(data) === 'boolean' ){
			useCache = data;
			data = undefined;
		}
		
		var fn = !/[^\w\-_]/.test(tpl) ?
				cache[tpl] = (useCache && cache[tpl]) || 
					render(document.getElementById(tpl).innerHTML) :

			new Function('obj',
				"var paras = [];" + 
				"with(obj){ paras.push('" +
				tpl
					.replace(/\s/g," ") 
					.split("<%").join("\t")
					.replace(/((^|%>)[^\t]*)'/g, "$1\r")
					.replace(/\t=(.*?)%>/g, "',$1,'")
					.split("\t").join("');")
					.split("%>").join("paras.push('")
					.split("\r").join("\\'")
				+ "');}return paras.join('');"
			);

			return data ? fn( data ) : fn ;
	};

	return {
		type: type,
		isFunction: isFunction,
		isString: isString,
		isArray: isArray,
		toArray: toArray,
		ajax: ajax,
		render: render
	}
})(window,document);