function handleMktLeadApiError(request) {
	console.log(request);
	var error = "";
	if(request.status === 429){
		error = request.responseJSON.msg;
	} else {
		error = "System Error";
	}
	$("#mktLeadInsertionErrDiv > #error").text(error);
	$("#mktLeadInsertionErrDiv").show();
}

function acquireToken (tmpUsername, tmpPassword){
	var result = "";
	var authObject = {
		username : tmpUsername,
		password : tmpPassword
	}
	var authJson = JSON.stringify(authObject);
	$.ajax({
		type: 'POST',
		url: domain + "/authenticate",
		data: authJson,
		contentType: 'application/json; charset=utf-8',
		success: function(response){
			var responseJsonObj = JSON.parse(JSON.stringify(response));
			result = responseJsonObj.token;
		},
		error: handleMktLeadApiError,
		async: false
	});
	return result;
}

function createRecord (e, token){
	const extraInfoRegex = /^extraInfo\[([0-9]+)\]\.([a-zA-Z0-9]+)$/;
	var object = {"extraInfo" : []};
	var tmpExtraInfoObjectMap = new Object();
	
	formData = new FormData(e.target);
	formObject = Object.fromEntries(formData);
	
	//system params
	object["coCode"] = coCode;
	object["campaignId"] = campaignId;
	object["redirectUrl"] = redirectUrl;
	
	for (var key in formObject) {
		if (formObject.hasOwnProperty(key)) {
			
			if(extraInfoRegex.test(key)){
				//extra info fields
				var match = key.match(extraInfoRegex);
				var idx = match[1];
				var prop = match[2];
			
				if(tmpExtraInfoObjectMap[idx]){
					tmpExtraInfoObjectMap[idx][prop] = formObject[key];
				} else {
					var tmpExtraInfoObject = new Object();
					tmpExtraInfoObject[prop] = formObject[key];
					tmpExtraInfoObjectMap[idx] = tmpExtraInfoObject;
				}
			} else {
				//normal fields
				object[key] = formObject[key];
			}
		}
	}
	for (var idx in tmpExtraInfoObjectMap) {
		object["extraInfo"].push(tmpExtraInfoObjectMap[idx]);
	}
	
	var jsonStr = JSON.stringify(object);
	$.ajax({
		type: 'POST',
		url: domain + "/api/mktLead/insert",
		data: jsonStr,
		contentType: 'application/json; charset=utf-8',
		headers: {
			"Authorization" : "Bearer " + token
		},
		success: function(response){
			if(response.status === "success"){
				if(typeof response.data != "undefined" && typeof response.data.redirectUrl != "undefined"){
					window.location.href = response.data.redirectUrl;
				}
			} else if (response.status === "fail"){
				console.log(response);
			}
		},
		error: handleMktLeadApiError,
		async: false
	});
}

$(document).ready(function() {
	
	$("#mktLeadInsertionErrDiv").hide();
	
	$("#mktLeadInsertionForm").bind("submit", function(e) {
		e.preventDefault();
		var token = acquireToken(username, password);
		createRecord(e, token);
	});
});