let prospect_id = "na";
let extId = chrome.runtime.id;


chrome.action.onClicked.addListener(
	function(tab) { 
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			prospect_id = "na"
			var activeTab = tabs[0];
			var activeTabId = activeTab.id; // or do whatever you need
			var rx = /.*[/]lightning[/]page[/]pardot[/]prospect[?]pardot__path=%2FvisitorAudit%2Findex%2Fprospect_id%2F([0-9]*)%3F.*/g;
			var arr = rx.exec(activeTab.url) || ["not found", "not found"];
			
			if(arr[1] == "not found") {
				chrome.notifications.create({
					type: 'basic',
					iconUrl: 'images/icon-16.png',
					title: 'Search Pardot Audit Launch Failed',
					message: 'Need to launch from: .*/lightning/page/pardot/prospect?pardot__path=%2FvisitorAudit%2Findex%2Fprospect_id%2F.*',
					priority: 1
				});
				
			} else if (isNaN(arr[1])){
				chrome.notifications.create({
					type: 'basic',
					iconUrl: 'images/icon-16.png',
					title: 'Search Pardot Audit Launch Failed',
					message: 'Could not extract valid prospect Id. ' + arr[1],
					priority: 1
				});
			} else {
				prospect_id = arr[1]
				chrome.tabs.create({
					url: 'audit_search_popup.html'
				}, function(tab) { 
					var intervalId = setInterval(function() {
						
						chrome.tabs.get(tab.id, function(tab1){
						   if(tab1.status == "complete"){
							   chrome.runtime.sendMessage(extId, prospect_id.toString());
							   chrome.notifications.create({
										type: 'basic',
										iconUrl: 'images/icon-16.png',
										title: 'Search Pardot Audit Launched',
										message: prospect_id.toString() + " passed to extension script",
										priority: 1
							   });
							   clearInterval(intervalId);  
						   }
						})
					}, 1000);	
				});
				
			}
 
		});
	}
);


