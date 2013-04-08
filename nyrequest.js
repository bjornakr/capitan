

var lock = false;

function displayQuizItem(question) {
	var questionElem = document.getElementById("question");
	removeChildren(questionElem);
	var	answersElem = document.getElementById("answers");
	removeChildren(answersElem);
	if (question.inputs === undefined) {
		question.inputs = null;
	}
	else {
		console.log(question.inputs);
	}
	displayHeader(question.text);

	if (question.response.type === "singleChoice" || question.response.type === "multiChoice") {
		displayResponseAlternatives(question);
	}
	else if (question.response.type === "textField") {
		displayTextField(question);
	}
	document.getElementById("previous").disabled = Questionnaire.currentQuestion() === Questionnaire.firstQuestion();
	//document.getElementById("next").disabled = (question.selectedResponseAlternatives == null);
}

function displayHeader(text) {
	console.log("q: " + text);
	var questionElem = document.getElementById("question");
	//var textNode = document.createTextNode(text);
	var converter = new Markdown.Converter();
	console.log(converter);
	var textNode = converter.makeHtml(text);

	console.log(typeof(textNode) + ": " + textNode);
	questionElem.innerHTML = textNode;
}

function displayResponseAlternatives(question) {
	var	answersElem = document.getElementById("answers");
	for (var i = 0; i < question.response.alternatives.length; i++) {
		var responseAlternatives = question.response.alternatives[i];
		var questionNoText = document.createTextNode(responseAlternatives.value);
		var answerText = document.createTextNode(" " + responseAlternatives.text);
		var button = document.createElement("input");

		button.id = "answerButton" + responseAlternatives.value;
		if (question.response.type === "singleChoice") {
			button.type = "radio";
			button.onclick = radioButtonClicked;
		}
		else if (question.response.type === "multiChoice") {
			button.type = "checkbox"
			button.onclick = storeSelectedResponseAlternatives;
		}
		button.name = "answerButton";
		button.value = responseAlternatives.value;

		if ($.inArray(responseAlternatives.value, question.inputs) !== -1) {
			button.checked = true;
		}
		answersElem.appendChild(ulWrapper(questionNoText, button, answerText));
	}
}

function displayTextField(question) {
	var answersElem = document.getElementById("answers");
	removeChildren(answersElem);
	var textField = document.createElement("input");
	textField.id = "textField";
	textField.type = "textfield";
	answersElem.appendChild(textField);
	var converter = new Markdown.Converter();
	var textNode = converter.makeHtml(question.response.posttext);
	console.log(typeof(textNode) + ": " + textNode);
	answersElem.appendChild(document.createTextNode(" " + question.response.posttext));
	if (question.inputs !== null) {
		textField.value = question.inputs;
	}
	else {
		textField.focus();
	}
}

function nextQuestion() {
	if (lock === true) {
		return;
	}
	if (Questionnaire.currentQuestion().inputs && Questionnaire.currentQuestion().inputs.length !== 0 && Questionnaire.currentQuestion() !== Questionnaire.lastQuestion()) {
		displayQuizItem(Questionnaire.nextQuestion());
	}
}

function previousQuestion() {
	if (lock === true) {
		return;
	}
	if (Questionnaire.currentQuestion() !== Questionnaire.firstQuestion()) {
		displayQuizItem(Questionnaire.previousQuestion());
	}
}

function currentAnswers() {
	var answerButtons = document.getElementsByName("answerButton");
	var answerValues = [];
	for (var i = 0; i < answerButtons.length; i++) {
		if (answerButtons[i].checked) {
			answerValues.push(answerButtons[i].value);
		}
	}
	return answerValues;
}


 function removeChildren(element) {
 	while (element.firstChild) {
 		element.removeChild(element.firstChild);
 	}
 }


 function radioButtonClicked() {
 	if (lock === true) {
 		return;
 	}

 	lock = true;
 	storeSelectedResponseAlternatives();
 	console.log("currentAnswers: " + currentAnswers());

 	document.getElementById("next").disabled = false;
 	setTimeout(function() {
 		lock = false;
 		nextQuestion();
 	}, 200);
 }

 function storeSelectedResponseAlternatives() {
 	Questionnaire.currentQuestion().inputs = currentAnswers();
 }

 function ulWrapper() {
 	var ulElem = document.createElement("ul");
 	for (var i = 0; i < arguments.length; i++) {
 		ulElem.appendChild(arguments[i]);
 	}
 	return ulElem;
 }

 document.getElementById("next").addEventListener("click", nextQuestion, false);
 document.getElementById("previous").addEventListener("click", previousQuestion, false);


// Keyboard listener
window.onkeyup = function(event) {
	if (lock === true) {
		return;
	}
	var keyCodes = {
		leftArrow: 37,
		rightArrow: 39,
		enter: 13,
		escape: 27,
		isDigit: function(keyCode) {
			return event.keyCode-48 >= 0 && event.keyCode-48 <= 9;
		},
		convertToDigit: function(keyCode) {
			return keyCode-48;
		}
	}
	var responseType = Questionnaire.currentQuestion().response.type
	var keyCode = event.keyCode;
	console.log(event.keyCode);


	if (keyCodes.isDigit(keyCode) && (responseType === "singleChoice" || responseType === "multiChoice")) { // digit key
		var answerButton = document.getElementById("answerButton" + (keyCodes.convertToDigit(keyCode)));

		if (answerButton !== null) {
			activateButton(answerButton);
		}
	}
	else if ((keyCode === keyCodes.leftArrow && leftArrowIsApplicable()) || keyCode === keyCodes.escape) {
		previousQuestion();
	}
	else if (keyCode === keyCodes.rightArrow && rightArrowIsApplicable()) {
		nextQuestion();
	}
	else if (keyCode === keyCodes.enter && enterIsApplicable()) {
		if (responseType === "textField") {
			Questionnaire.currentQuestion().inputs = document.getElementById("textField").value;
		}
		nextQuestion();
	}
	else if (responseType === "info") {
		nextQuestion();
	}

	function leftArrowIsApplicable() {
		console.log(document.getElementById("textField"));
		console.log(document.activeElement);
		return (responseType === "singleChoice" || responseType === "multiChoice" || responseType === "info") ||
			(responseType === "textField" && document.getElementById("textField") !== document.activeElement);
	};

	function rightArrowIsApplicable() {
		return (responseType === "singleChoice" || responseType === "multiChoice") ||
			(responseType === "textField" && document.getElementById("textField") !== document.activeElement);
	};

	function enterIsApplicable() {
		console.log(document.activeElement);
		return (document.activeElement.type !== "button");
	};

	function activateButton(button) {
		if (answerButton.type === "radio") {
			answerButton.checked = true;
			radioButtonClicked();
		}
		if (answerButton.type === "checkbox") {
			answerButton.checked = !answerButton.checked;
			storeSelectedResponseAlternatives();
		}
	};

}


var Questionnaire = (function() {
	var questions;
	var currentQuestionNo = 0;


	return {
		init: function(data) {
			questions = data;
		},
		currentQuestion: function() {
			return questions[currentQuestionNo];
		},
		nextQuestion: function() {
			return questions[++currentQuestionNo];
		},
		previousQuestion: function() {
			return questions[--currentQuestionNo];
		},
		firstQuestion: function() {
			return questions[0];
		},
		lastQuestion: function() {
			return questions[questions.length-1]
		},
		length: function() {
			return questions.length;
		}
	};
})();


// Init
$(document).ready(function () {
	//window.onbeforeunload = function() { return "You work will be lost."; };
	$.getJSON("http://localhost:8000/questions.json", function(data) {
		console.log("Loading JSON questionnaire file.");
		console.log(data);
		Questionnaire.init(data);
		displayQuizItem(Questionnaire.firstQuestion());
	});
});

jQuery.extend(jQuery.expr[':'], {
  focus: "a == document.activeElement"
});




