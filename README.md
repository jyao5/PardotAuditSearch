# PardotAuditSearch
The [chrome extension](https://chromewebstore.google.com/detail/pardot-audit-search/mccokbknobobgfbhpppamidbjjkgdioo) facilitates searching Pardot audit page.

How to use the tool:
1) Go to a prospect pardot audit page
2) Depending on how audit page is accessed:
   
   i. lightning experience(i.e. embedded in Salesforce platform) : Click the exension icon -> a page will pop up
   
   ii. pardot site (pi.pardot.com etc.): The search box will appear at top of the audit page

How does it work: The JS script crawls a configurable range of audit pages, parses and processes the DOM elements and displays matched results in a HTML table


Release note:
7/3: bugfix - incorrect ending status when not searching from first page
6/27 : enhancement - export search result to CSV
