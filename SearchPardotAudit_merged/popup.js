const embeddedPardotUrl = "https://embedded.pardot.force.com";

document.getElementById("goto").addEventListener("click", loadPage);
document.getElementById("bttn_search").addEventListener("click", search);

document.getElementById("searchtext").addEventListener("keydown", 
	function(event){
		if (event.key === "Enter") {
			// Cancel the default action, if needed
			event.preventDefault();
			search()
		}
	}
);

document.getElementById("downloadSearch").addEventListener("click", download_table_as_csv);


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	document.getElementById("prospect_id").value = message;
	loadPage();
	// alert("the searcher is up")
});

let resultlimit = 50


function SetCurrentPageAndLoad (page) {
	document.getElementById("current_page").value = page;
	loadPage();
}

function loadPage() {
	document.getElementById("pageloader").innerHTML = '';
	let l_currentPage = 1;
	//get current page from input box
	let cp = document.getElementById("current_page").value; //get page Element
	if(isNaN(cp)) { alert("invalid page number"); return;}
	currentPage = Number(cp.replace(',', ''));
	
	//get prospect id from input box (constant)
	let prospectId = document.getElementById("prospect_id").value;
	
	//fetch page
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function (){
		if (this.readyState == 4 && this.status == 200) {
			//load page
			var pl = document.getElementById("pageloader");
			let parser = new DOMParser();
			let document1  = parser.parseFromString(this.responseText, "text/html")
			let tbl = document1.getElementById("visitorAudit_table").cloneNode(true);
			pl.appendChild(tbl);
			debugger;
			//console.log(this.responseText)
			//refresh total page
			let tp = "error extract total page"
			document1.getElementById("visitorAuditform").querySelector("ul").childNodes
			.forEach(
			  function(item){
					if(item.nodeName == "LI" && item.innerHTML.includes("Page")){
						tp = item.querySelector("a").innerHTML.replace(',', '');
						//console.log(totalPage);
					}
				}
			);
			document.getElementById("total_page").value = tp;
			
			//refresh current page
			let cp = "error extract current page";
			cp = document1.getElementById("page").value.replace(',', '');		
			document.getElementById("current_page").value = cp;
			debugger;
			//refresh pagesize
			let ps = "error extract page size";
			ps = document1.getElementById("vaupageSize").querySelector("option[selected='selected']").innerHTML.replace(',', '');		
			document.getElementById("page_size").value = ps;
			
			//window.location.href = "#pg_brwsr";
			
		}
	};
	//debugger;
	xhttp.open("GET", embeddedPardotUrl + "/visitorAudit/index/prospect_id/" + prospectId + "/page/" + currentPage.toString(), true);
	xhttp.send();
	
	
}

let processedPage = 0
let processingPage = 1
let matchedResult = 0
let mainThreadFinished = false
let totalPage = 0

let cancel = false
let bttn1 = document.createElement("button");
bttn1.innerHTML  = "cancel" ;
bttn1.onclick = function(){cancel = true;};
let feedback = document.getElementById('feedback');
let searchtxt = "verylongdummystring";
let tbody = document.getElementById('result_table_body')

async function search() {
	cancel = false;
	tbody.innerHTML = '';
	searchtxt = document.getElementById("searchtext").value;
	if(searchtxt.trim() == ""){
		alert("Can not search blank");
		return;
	}
	debugger;
	//get result limit
	resultlimit = Number(document.getElementById("resultlimitnum").value.trim() || '50');
	
	totalPage = Number(document.getElementById("total_page").value)
	processedPage = 0
	processingPage = 1
	let currentPage = Number(document.getElementById("current_page").value)
	matchedResult = 0
	mainThreadFinished = false
	
	
	let prospectId = document.getElementById("prospect_id").value;
	
	//seach each page
	for (processingPage = currentPage, processedPage = currentPage - 1; processingPage <= totalPage; processingPage++) {
		if(cancel) {
			feedback.innerHTML = "Cancelled";
			break;
		};
		
		
		
		//print progress
		feedback.innerHTML = "start processing page " + processingPage.toString() + "/" + totalPage.toString() + " for " + searchtxt;
		feedback.appendChild(bttn1);
		//console.log(processingPage.toString());
		await new Promise(r => setTimeout(r, 100));
		
		
		let url = 
			embeddedPardotUrl 
			+ "/visitorAudit/index/prospect_id/" + prospectId 
			+ "/page/" + processingPage.toString();
		// debugger;
		//fetch and process a page 
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = callbackClosure(processingPage);
		
		xhttp.open("GET", url, true);
		xhttp.send();
		
		if(matchedResult >= resultlimit){
			feedback.innerHTML = "Attempted to find top " + resultlimit.toString() + " matches"
			break;
		};
		
		
	}
	feedback.innerHTML = "Wait for all async processing to finish";
	mainThreadFinished = true
} 

function callbackClosure(pagnum) {
  return function() {	
		if (this.readyState == 4 && this.status == 200) {
			let parser = new DOMParser();
			let document1  = parser.parseFromString(this.responseText, "text/html")
			let matches = document1.getElementById("visitorAudit_table").querySelectorAll("tr[id^='visitorAudit_row_a']");
			matches.forEach(function(item){
				//determin if text matches any column value
				var tds = item.querySelectorAll("td");
				let matchText = false
				for(let iter1 = 0; iter1 < 5; iter1 ++){
					if(tds[iter1].innerHTML.toLowerCase().includes(searchtxt.toLowerCase()))
						matchText = true;
				}	
				
				//if matches add to result table
				if(matchText){
					//create a row
					let tr = tbody.insertRow();
					tr.setAttribute("style", "border: 1px solid black;");
					//add page cel
					let pagecell = tr.insertCell();
					pagecell.setAttribute("style", "border: 1px solid black;");
					let lk = document.createElement("button");
					lk.innerText = pagnum.toString();
					lk.onclick = 
						(function(tt) {
							return function(){
								SetCurrentPageAndLoad(tt);
							}
						})(pagnum.toString())
					pagecell.appendChild(lk);
					
					
					//add rest cells
					for(let iter = 0; iter < 5; iter++){
						let tds_iter = tds[iter].cloneNode(true);
						tds_iter.setAttribute("style", "border: 1px solid black;");
						tr.appendChild(tds_iter)
					}
					matchedResult++
				}
				
				
				
			});
			++processedPage;
			
			if(processedPage >= totalPage)
				feedback.innerHTML = "All scanned"
			else if(processedPage >= processingPage - 1 && matchedResult >= resultlimit)
				feedback.innerHTML = "Attempted to find top " + resultlimit.toString() + " matches, " + matchedResult.toString() + " were found.(Async calls were made before matches were processed)"
			else if(processedPage >= processingPage - 1 && cancel)
				feedback.innerHTML = "Cancelled"
			else if(mainThreadFinished)
				feedback.innerHTML = "Wait for all async processing to finish\n" + pagnum.toString() + "|" + processingPage.toString() + "|" + totalPage.toString();
				
	   //console.log(processedPage);
		}
	}
}




//download button invoke
function download_table_as_csv() {
    // Select rows from table_id
    var rows = document.querySelectorAll('table#result_table tr');
	debugger;
    // Construct csv
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            // Clean innertext to remove multiple spaces and jumpline (break csv)
            var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
            // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
            data = data.replace(/"/g, '""');
            // Push escaped string
            row.push('"' + data + '"');
        }
        csv.push(row.join(','));
    }
    var csv_string = csv.join('\n');
    // Download it
    var filename = 'export_PAS_SearchResult_' + new Date().toISOString() + '.csv';
    var link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}