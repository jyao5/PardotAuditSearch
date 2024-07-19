let thePath = window.location.toString();

let div = document.createElement("div");
document.getElementById("content").prepend(div);

const para = document.createElement("p");

let prospectId = thePath.substring(thePath.lastIndexOf('/') + 1);
const node = document.createTextNode("Prospect Id: " + prospectId);
para.appendChild(node);
div.appendChild(para);


let lbl = document.createElement("label");
lbl.setAttribute("for", "search_audit");
lbl.innerHTML  = "search " 
div.appendChild(lbl);


let field = document.createElement("input");
field.setAttribute("id", "searchtext");
field.setAttribute("type", "text");
field.setAttribute("name", "search_audit");
field.onkeydown = (event) => {
	if (event.key === "Enter") {
		// Cancel the default action, if needed
		event.preventDefault();
		returnCookie()
	}
};
div.appendChild(field);
field.focus();

div.appendChild(document.createElement("br"));
div.appendChild(document.createTextNode("limit to "));

let field1 = document.createElement("input");
field1.setAttribute("id", "resultlimitnum");
field1.setAttribute("type", "text");
field1.setAttribute("name", "limit_result");
div.appendChild(field1);

div.appendChild(document.createTextNode(" results"));

div.appendChild(document.createElement("br"));

let bttn = document.createElement("button");
bttn.innerHTML  = "search" ;
bttn.onclick = returnCookie;

div.appendChild(bttn);

let bttn99 = document.createElement("button");
bttn99.innerHTML  = "Export to CSV" ;
bttn99.onclick = download_table_as_csv;

div.appendChild(bttn99);

let cancel = false
let bttn1 = document.createElement("button");
bttn1.innerHTML  = "cancel" ;
bttn1.onclick = function(){cancel = true;};



let feedback = document.createElement("div")
feedback.setAttribute("id", "feedback");
feedback.innerHTML = "Ready"
div.appendChild(feedback);


//sample header
let resultTableSample = [
  { page: "1", field: "LastVisitingIntegration", type: "Prospect Custom Field", value: "Old Value: 0, New Value: 1", source: "CRM", datetime: "20210101" }
	//
];
//initialize a table element to store search result

let resultTable = document.createElement("table")
resultTable.setAttribute("style", "border: 1px solid black;");
resultTable.setAttribute("id", "result_table");
let thead = resultTable.createTHead();
let row = thead.insertRow();
for(let key of Object.keys(resultTableSample[0])) {
	let th = document.createElement("th");
	th.setAttribute("style", "border: 1px solid black;");
	let text = document.createTextNode(key);
	th.appendChild(text);
	row.appendChild(th);
}
let tbody = resultTable.createTBody();
div.appendChild(resultTable);

console.log("audit search extension: script is enabled for this url");

let resultlimit = 50

function callbackClosure(pagnum, url1,totalPage1) {
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
					let lk = document.createElement("a");
					lk.appendChild(document.createTextNode(pagnum.toString()));
					lk.target="_blank";
					lk.href=url1
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
			//console.log(pagnum.toString() + "|" + processingPage.toString() + "|" + totalPage1.toString())
			
			if(processedPage >= totalPage1)
				feedback.innerHTML = "All scanned"
			else if(processedPage >= processingPage - 1 && matchedResult >= resultlimit)
				feedback.innerHTML = "Attempted to find top " + resultlimit.toString() + " matches, " + matchedResult.toString() + " were found.(Async calls were made before matches were processed)"
			else if(processedPage >= processingPage - 1 && cancel)
				feedback.innerHTML = "Cancelled"
			else if(mainThreadFinished)
				feedback.innerHTML = "Wait for all async processing to finish\n" + pagnum.toString() + "|" + processingPage.toString() + "|" + totalPage1.toString();
				
	   //console.log(document1.getElementById("visitorAudit_table").innerHTML);
		}
	}
}
let processedPage = 0
let processingPage = 0
let mainThreadFinished = false

let matchedResult = 0

async function returnCookie() {
	cancel = false;
	tbody.innerHTML = '';
	searchtxt = document.getElementById("searchtext").value;
	if(searchtxt.trim() == ""){
		feedback.innerHTML = "Can not search blank"
		return;
	}
	
	//get result limit
	resultlimit = Number(document.getElementById("resultlimitnum").value.trim() || '50');
	// console.log(resultlimit);
	//get total page
	let form_tablefooter = document.getElementById("visitorAuditform") //get footer

	let a = form_tablefooter.querySelector("ul")
	let totalPage = 0
	processedPage = 0
	processingPage = 1
	let currentPage = 0
	matchedResult = 0
	mainThreadFinished = false
	
	a.childNodes.forEach(
	  function(item){
			if(item.nodeName == "LI" && item.innerHTML.includes("Page")){
				totalPage = Number((item.querySelector("a").innerHTML || '1').replace(',', ''));
				//console.log(totalPage);
			}
		}
	)

	//get current page
	let input_page = document.getElementById("page"); //get page Element

	currentPage = Number((input_page || {value: '1'}).value.replace(',', ''));

	

	//seach each page
	for (processingPage = currentPage, processedPage = currentPage = 1; processingPage <= totalPage; processingPage++) {
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
			"https://pi.pardot.com/visitorAudit/table/ajax/1/page/"
			+ processingPage.toString()
			+ "/sort/visitor_audit.created_at/order/desc/prospect_id/"
			+ prospectId
			+ "/ajaxElement/visitorAudit";
		// debugger;
		//fetch and process a page 
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = callbackClosure(processingPage,url, totalPage);
		
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