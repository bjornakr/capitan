

var lock = false;
var responses = {};

function displayQuestion(question) {
	var questionElem = document.getElementById("question");
	removeChildren(questionElem);
	var	answersElem = document.getElementById("answers");
	removeChildren(answersElem);
	if (question.inputs === undefined) {
		question.inputs = null;
	}
	else {
		console.log("Inputs: " + question.inputs);
	}
	displayHeader(question.text);
	if (question.southText !== undefined) {
		displaySouthText(question.southText);
	}

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
	var questionElem = document.getElementById("question");
	var converter = new Markdown.Converter();
	var textNode = converter.makeHtml(text);
	questionElem.innerHTML = textNode;
}

function displaySouthText(text) {
	var southTextElem = document.getElementById("southtext");
	southTextElem.innerHTML = text;
}

function displayResponseAlternatives(question) {
	var	answersElem = document.getElementById("answers");
	for (var i = 0; i < question.response.alternatives.length; i++) {
		var responseAlternatives = question.response.alternatives[i];
		var questionNoText = document.createTextNode(responseAlternatives.value);
		var answerText = document.createElement("span");//document.createTextNode(" " + responseAlternatives.text);
		answerText.innerHTML = " " + responseAlternatives.text;
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

		if ((question.response.type === "multiChoice" && $.inArray(responseAlternatives.value, question.inputs) !== -1) ||
			question.response.type === "singleChoice" && responseAlternatives.value === question.inputs) {
			button.checked = true;
	}
	answersElem.appendChild(ulWrapper(questionNoText, button, answerText));
}
}

function ulWrapper() {
	var ulElem = document.createElement("ul");
	for (var i = 0; i < arguments.length; i++) {
		ulElem.appendChild(arguments[i]);
	}
	return ulElem;
}

function displayTextField(question) {
	var answersElem = document.getElementById("answers");
	removeChildren(answersElem);
	var textField = document.createElement("input");
	textField.id = "textField";
	textField.type = "textfield";
	textField.size = "100";
	answersElem.appendChild(textField);
	var converter = new Markdown.Converter();
	var textNode = converter.makeHtml(question.response.posttext);
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
	if (Questionnaire.currentQuestion().response.type === QuestionTypes.textField) { // && Questionnaire.currentQuestion().regex) {
		checkRegExp(Questionnaire.currentQuestion());
	}
	if (Questionnaire.hasResponse(Questionnaire.currentQuestion())) {
		responses[Questionnaire.currentQuestion().variableName] = Questionnaire.currentQuestion().inputs;
		displayQuestion(Questionnaire.nextQuestion());
	}
}

function checkRegExp(question) {
	if (!question.response.regexp) {
		return true;
	}
	var regExp = new RegExp(question.response.regex);
	var matchResult = question.inputs.match(regExp);
	console.log("Validation: " + matchResult);
	if (matchResult && question.inputs === matchResult[0]) {
		console.log("MATCH!!!");
		return true;
	}
	else {
		return false;
	}
}

function previousQuestion() {
	if (lock === true) {
		return;
	}
	if (Questionnaire.currentQuestion() !== Questionnaire.firstQuestion()) {
		displayQuestion(Questionnaire.previousQuestion());
	}
}

function currentAnswers() {
	var answerButtons = document.getElementsByName("answerButton");
	var answerValues = [];
	for (var i = 0; i < answerButtons.length; i++) {
		if (answerButtons[i].checked) {
			if (answerButtons[i].type === "checkbox") {
				answerValues.push(parseInt(answerButtons[i].value));
			}
			else if (answerButtons[i].type === "radio") {
				answerValues = parseInt(answerButtons[i].value);
				return answerValues;
			}
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

	document.getElementById("next").disabled = false;
	setTimeout(function() {
		lock = false;
		nextQuestion();
	}, 200);
}

function storeSelectedResponseAlternatives() {
	Questionnaire.currentQuestion().inputs = currentAnswers();
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
		return (responseType === "singleChoice" || responseType === "multiChoice" || responseType === "info") ||
		(responseType === "textField" && document.getElementById("textField") !== document.activeElement);
	};

	function rightArrowIsApplicable() {
		return (responseType === "singleChoice" || responseType === "multiChoice") ||
		(responseType === "textField" && document.getElementById("textField") !== document.activeElement);
	};

	function enterIsApplicable() {
		return (document.activeElement.type !== "button");
	};

	function activateButton(button) {
		if (answerButton.type === "radio") {
			answerButton.checked = true;
			radioButtonClicked();
		}
		else if (answerButton.type === "checkbox") {
			answerButton.checked = !answerButton.checked;
			storeSelectedResponseAlternatives();
		}
	};

}


var Questionnaire = (function() {
	var questions;
	var currentQuestionNo = 0;
	var questionHistory = [];


	return {
		init: function(data) {
			questions = data;
		},
		currentQuestion: function() {
			return questions[currentQuestionNo];
		},
		nextQuestion: function() {
			questionHistory.push({
				question: questions[currentQuestionNo],
				questionNo: currentQuestionNo
			});
			responses[questions[currentQuestionNo].variableName] = questions[currentQuestionNo].inputs;
			currentQuestionNo++;
			while (questions[currentQuestionNo].condition !== undefined && !evaluate(questions[currentQuestionNo].condition)) {
				console.log("Condition: " + evaluate(questions[currentQuestionNo].condition));
				currentQuestionNo++;
			}
			return questions[currentQuestionNo];
		},
		previousQuestion: function() {
			var historyItem = questionHistory.pop();
			currentQuestionNo = historyItem.questionNo;
			return historyItem.question; //questions[--currentQuestionNo];
		},
		firstQuestion: function() {
			return questions[0];
		},
		lastQuestion: function() {
			return questions[questions.length-1]
		},
		length: function() {
			return questions.length;
		},
		hasResponse: function(question) {
			if (questions.inputs !== undefined) {
				return false;
			}
			var singleChoiceResponse = question.response.type === QuestionTypes.singleChoice && question.inputs !== null;
			var multiChoiceResponse = question.response.type === QuestionTypes.multiChoice && question.inputs.length > 0;
			var textFieldResponse = question.response.type === QuestionTypes.textField && question.inputs !== null && question.inputs.trim() !== "";
			return singleChoiceResponse || multiChoiceResponse || textFieldResponse;
		}
	}

	function evaluate(element) {
		if (element === true) {
			return true;
		}
		else if (element === false) {
			return false;
		}
		else {
			if (element.op === "AND") {
				return evaluate(element.left) && evaluate(element.right);
			}
			else if (element.op === "OR") {
				return evaluate(element.left) || evaluate(element.right);
			}
			else if (element.op === "NOT") {
				return !evaluate(element.right);
			}
			else if (element.op === "==") {
				return checkEquality(element.left, element.right);
			}
			else if (element.op === "!=") {
				return !checkEquality(element.left, element.right);
			}
		}
	}

	function checkEquality(left, right) {
		if (left.variableReference) {
			left = responses[left.variableReference];
		}
		if (right.variableReference) {
			right = responses[right.variableReference];
		}
		return left === right;
	}
})();

var QuestionTypes = {
	singleChoice: "singleChoice",
	multiChoice: "multiChoice",
	textField: "textField",
	info: "info"
};



// Init
$(document).ready(function () {
	//window.onbeforeunload = function() { return "You work will be lost."; };
	$.getJSON("http://localhost:8000/questions.json", function(data) {
		console.log("Loading JSON questionnaire file.");
		console.log(data);
		Questionnaire.init(data);
		displayQuestion(Questionnaire.firstQuestion());
	});
});

jQuery.extend(jQuery.expr[':'], {
	focus: "a == document.activeElement"
});




