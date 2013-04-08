 var allQuestions = [{
 	question: "Who is not a real person?",
 	answers: ["Doodlestick Jones", "Harry Hole", "Super Ruru"],
 	correctAnswer: "Harry Hole"
 },
 {
 	question: "What does \"Støwer\" really mean?",
 	answers: ["Truckstore", "Stoveaway", "Machine Gun Snake Fucker"],
 	correctAnswer: "Machine Gun Snake Fucker"
 },
 {
 	question: "In which of these software companies has the author NOT been employed?",
 	answers: ["Blizzard Entertainment", "Bore Design Software", "Donkeylube Software Studios"],
 	correctAnswer: "Blizzard Entertainment"
 }]

var lock = false;

 function displayQuizItem(quizItem) {
	displayQuestion(quizItem.question);
	displayAnswers(quizItem.answers, quizItem.selectedAnswer);
	document.getElementById("previous").disabled = (currentQuestionNo <= 0);
	document.getElementById("next").disabled = (quizItem.selectedAnswer == null);
}

function displayQuestion(text) {
	var questionElem = document.getElementById("question");
	removeChildren(questionElem);
	var textNode = document.createTextNode(text);
 	questionElem.appendChild(textNode);
}

function displayAnswers(answers, selectedAnswer) {
	var	answersElem = document.getElementById("answers");
	removeChildren(answersElem);
 	for (var i = 0; i < answers.length; i++) {
 		var questionNoText = document.createTextNode(i);
 		var answerText = document.createTextNode(" " + answers[i]);
		var radioButton = document.createElement("input");
		radioButton.id = "radio" + i;
		radioButton.type = "radio";
		radioButton.name = "answer";
		radioButton.value = answers[i];
		radioButton.onclick = radioButtonSelected;
		if (answers[i] === selectedAnswer) {
			radioButton.checked = true;
		}
		answersElem.appendChild(ulWrapper(questionNoText, radioButton, answerText));
	}
}

function nextQuestion() {
	if (lock === true) {
		return;
	}
	if (currentAnswer() !== null) {
		currentQuestionNo++;
		if (currentQuestionNo === allQuestions.length) {
			displayResult();
		}
		else {
			displayQuizItem(allQuestions[currentQuestionNo]);
		}
	}
}

function previousQuestion() {
	if (lock === true) {
		return;
	}
	if (currentQuestionNo > 0) {
		displayQuizItem(allQuestions[--currentQuestionNo]);
	}
}

function currentAnswer() {
	var radioButtons = document.getElementsByName("answer");
	for (var i = 0; i < radioButtons.length; i++) {
		if (radioButtons[i].checked) {
			return radioButtons[i].value;
		}
	}
	return null;
}

function displayResult() {
	displayQuestion("You're all done!");
	var score = 0;
	for (var i = 0; i < allQuestions.length; i++) {
		if (allQuestions[i].selectedAnswer === allQuestions[i].correctAnswer) {
			score++;
		}
	}
 	var resultText = document.createTextNode("Score: " + score + " out of " + allQuestions.length + " possible.");
 	var	answersElem = document.getElementById("answers");
 	removeChildren(answersElem);
 	answersElem.appendChild(resultText);
 	//document.getElementById("next").remove();
 	//document.getElementById("previous").remove();
}

function removeChildren(element) {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
}


function radioButtonSelected() {
	if (lock === true) {
		return;
	}
	lock = true;
	allQuestions[currentQuestionNo].selectedAnswer = currentAnswer();

	document.getElementById("next").disabled = false;
	setTimeout(function() {
		lock = false;
		nextQuestion();
	}, 200);
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

window.onkeyup = function(event) {
	if (lock === true) {
		return;
	}

	console.log(event.keyCode);
	if (event.keyCode-48 >= 0 && event.keyCode-48 <= 9) {
		var radioButton = document.getElementById("radio" + (event.keyCode-48));
		if (radioButton !== null) {
			radioButton.checked = true;
			radioButtonSelected();
		}
	}
	else if (event.keyCode === 37) {
		previousQuestion();
	}
	else if (event.keyCode === 39) {
		nextQuestion();
	}
}
console.log("zap");
$(document).ready(function () {
	$.getJSON("http://localhost:8000/questions.json", function(data) {
		console.log("zeke");
		console.log(data);
	});
});
var currentQuestionNo = 0;
displayQuizItem(allQuestions[currentQuestionNo]);
