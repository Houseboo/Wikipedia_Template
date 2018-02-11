
	How it works:
	
	Wikipedia (or Wikidata) has an unique ID for every page that exists. These ID's consists of Q followed by a set of numbers. Lets take Q100 as an example:
	That ID number refers to the city Boston ( https://www.wikidata.org/wiki/Q100 ). 
	
	But just as every page has its own ID, every property have that as well. Let's say we wanted to know how many people lived in Boston. The property number
	for that value is P1082. This property exists on every page that has a population. For a list of all the properties that exists, you can visit:
	https://www.wikidata.org/wiki/Wikidata:List_of_properties/all
	
	For us to receive this information, we need to get some data from Wikipedia's database. To do this, we can use the ID of the page in this getJSON call:
	
	let Id = Q100;
	
	$.getJSON("https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" + Id + "&callback=?&format=json", function(data) {
	});
	
	Inside this function, we can use console.log(data) to get a deeper look into how the properties are stored. Open the console (f12) and press 
	entities > The Q ID (ie Q100) > claims. Here you will see all the properties that exists inside the page. If you locate P1082, you can go ahead and
	navigate through P1082 > mainsnak > datavalue > value. Under value you will see the amount of people living here, and you can save this value using
	this line of code: var population = data.entities.Q100.claims.P1082["0"].mainsnak.datavalue.value.amount;
	
	A few things to explain here:
	
		-If you want to be able to use this line of code multiple times without having to change the Q-ID (Q100) for a different page, you can simply
		replace Q100 with [Object.keys(data.entities)[0]]. It will look like this: data.entities[Object.keys(data.entities)[0]].claims.P1082["0"].mainsnak.datavalue.value.amount;
		
		-P1082["0"] is the first index in an array that mostly only consists of one index. Sometimes there can be multiple values of the same value, and
		that index must be changed if you want to target something else. For example if a person on Wikipedia has multiple children, you would only get
		the name or Q-ID for one of the children.
	.
	
	Sometimes you can't find a value inside property, but rather another Q-ID. This means that the value you are after exists as an Wikipedia article, 
	and to get that value, we must send a new getJSON call to rather get the title of that page.
	
	After we send a new jetJSON call, we can now store the title of the page using this line of code:
	
	let Id = Object.keys(data.entities)[0];
	let title = data.entities[Id].labels.en.value;
	
	Notice that I'm using the English Wikipedia site for this ID when I'm storing the title (labels.en). This can be changed if you want information
	or a title in another language.

	The rest of the code has comments along with it to explain what's happening. 
 
	
	If you want to read and learn more about Wikidata for yourself, you can visit: https://www.wikidata.org/wiki/Wikidata:Data_access

	And Wikidata API: https://www.wikidata.org/w/api.php
	
	
	To understand more about how you can integrate your own Javascript and HTML files into TemplateBuilder, 
	visit: https://confluence.vizrt.com/pages/viewpage.action?spaceKey=BGRD&title=How+to+create+your+custom+HTML+template

	In my code:
	
	let pl = vizrt.payloadhosting;

	pl.setFieldText("wiki/info*", value);
	
	"wiki/info*", where '*' is a number between 1 and 4, is the ID of the output fields on TemplateBuilder
	
	value is the value I want to show in the output field
	