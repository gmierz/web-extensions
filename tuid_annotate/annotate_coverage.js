/*
	This web extension can be used to determine the SETA
	success rate of a given range of pushes (those visible in
	a treeherder view).
*/

const activedataurl = `https://activedata.allizom.org/query`
const activedataurl_tuid = `https://activedata.allizom.org/tuid`

/* Get coverage for all visible files */

var navbarElement = document.querySelector('.phabricator-main-menu');
var revnodes = document.querySelectorAll('.differential-changeset');
var spanElement = null;
var done = 0

var checkExist = setInterval(function() {
	revnodes = document.querySelectorAll('.differential-changeset');
	navbarElement = document.querySelector('.phabricator-main-menu');
	if (revnodes.length >= 1 && navbarElement) {
		console.log("Exists!");
		console.log(revnodes)
		clearInterval(checkExist);

		var usermenu = navbarElement.querySelectorAll(".phabricator-core-user-menu")
		usermenu[usermenu.length-1].insertAdjacentHTML("afterEnd",
			`
		    <a id='coverageplaceholder', class=' phabricator-core-user-menu', style='color:white'>
		        Getting coverage for files...
		    </a>
			`
		)

		completeCalculation()
	} else {
		console.log("Not found...")
	}
}, 100)

var checkFinished = setInterval(function() {
	if (done == revnodes.length) {
		var coveragemarker = document.getElementById("coverageplaceholder")
		coveragemarker.text = "Coverage inserted"
		clearInterval(checkFinished)
	}
}, 1000)

async function completeCalculation() {
	var changesetnodes = document.querySelectorAll('.differential-changeset')

	// Get all the files modified
	files = []
	changesetnodes.forEach(cset=>{
		file = cset.querySelector(".differential-file-icon-header").textContent
		files.push(file)

		// Query active data for tuids
		var tuid_covered_query = {
		    "from": "coverage",
		    "select": [
		        {"aggregate": "union", "value": "source.file.name", "name": "filename"},
		        {"aggregate": "union", "value": "source.file.tuid_covered", "name": "covered"},
		        {"aggregate": "union", "value": "repo.changeset.id12", "name": "id12"}
		    ],
		    "where": {
		        "and": [
		            {"eq": {"source.file.name": file}},
		            {"gte": {"repo.push.date": {"date": "today-week"}}}
		        ]
		    }
		}
		console.log(JSON.stringify(tuid_covered_query))

		var otherparams = {
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify(tuid_covered_query),
			method: "POST"
		}

		// Get the response and process it
		console.log("Waiting for response...")
		fetch(activedataurl, otherparams)
		.then(data=>{return data.json()})
		.then(response_covered=>{
			// Query active data for a line -> tuid mapping
			data = response_covered['data']
			if (typeof data["id12"] === 'undefined'){
				file = 'Unknown'
				if (typeof data["filename"] !== 'undefined') {
					file = data['filename'][0]
				}
				console.log("Could not find coverage for file: " + file)
				done = done + 1
				return
			}

			file = data['filename'][0]
			revision = data["id12"][0]
			console.log("File: " + file)
			console.log("Cset to use: " + revision)

			var tuid_query = {
				"from": "files",
				"where":{
					"and":[
						{"eq": {"revision": revision}},
						{"eq": {"path": file}},
						{"eq":{"branch":"mozilla-central"}}
					]
				} 
			}

			var otherparams = {
				headers: {
					"content-type": "application/json"
				},
				body: JSON.stringify(tuid_query),
				method: "POST"
			}

			console.log("Querying:", JSON.stringify(tuid_query))
			console.log("Waiting for response...")
			fetch(activedataurl_tuid, otherparams)
			.then(data=>{return data.json()})
			.then(response_lines2tuids=>{
				display_coverage(cset, response_lines2tuids['data'], response_covered['data'])
			}).catch(error => console.error('Error:', error));

		}).catch(error => console.error('Error:', error));
	})
}

function display_coverage(cset, lines2tuids, covered_tuids) {
	console.log("File: " + lines2tuids[0])
	console.log(lines2tuids)
	console.log(covered_tuids)

	done = done + 1
	if (lines2tuids[0][1] == null){
		return
	}

	var newlines = Array.from({length: lines2tuids[0][1].length}, (v, i) => 0)
	for (var i = 0, len=lines2tuids[0][1].length; i < len; i++) {
		if (covered_tuids['covered'].includes(lines2tuids[0][1][i])) {
			newlines[i] = 1
		}
	}

	var lines = cset.querySelector('tbody').querySelectorAll('tr')
	lines.forEach(line => {
		if (line.dataset['sigil'] === undefined) {
			var linenums = line.querySelectorAll('td.n')

			lineno = parseInt(linenums[0].dataset['n']) - 1
			linenums.forEach(num => {
				if (newlines[lineno] == 1) {
					num.style.backgroundColor = "#7cd51b"
				} else {
					num.style.backgroundColor = "#d5671b"
				}
			})

		}

	})

	return
}
