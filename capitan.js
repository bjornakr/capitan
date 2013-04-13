var responses = {};


var View = (function() {
    var elementsInUse = [];

    function displayQuestionText(text, variableReferences) {
        var questionTextElem = document.getElementById("question");
        if (variableReferences !== undefined) {
            for (var i = 0; i < variableReferences.length; i++) {
                text = text.replace(variableReferences[i], responses[variableReferences[i]]);
            }
        }
        questionTextElem.innerHTML = text;
    }

    function displayTextField(question, userInputElem) {
        // removeChildren(answersElem);
        var textField = document.createElement("input");
        textField.id = "textField";
        textField.type = "textfield";
        if (question.response.size !== undefined) {
            textField.size = question.response.size;
        } else if (question.response.type === Questionnaire.responseTypes.numeric && question.response.max !== undefined) {
            textField.size = (question.response.max + "").length;
        }
        userInputElem.appendChild(textField);

        if (question.response.leadingText !== undefined) {
            displayInlineText(question.response.leadingText, userInputElem, "leading");
        }
        if (question.response.trailingText !== undefined) {
            displayInlineText(question.response.trailingText, userInputElem, "trailing");
        }
        if (question.inputs !== undefined) {
            textField.value = question.inputs;
        } else {
            textField.focus();
        }
    }

    function displayInlineText(text, userInputElem, position) {
        var textElem = document.createElement("span");
        if (position === "leading") {
            textElem.innerHTML = text + " ";
            userInputElem.insertBefore(textElem, userInputElem.firstChild);
        } else if (position === "trailing") {
            textElem.innerHTML = " " + text;
            userInputElem.appendChild(textElem);
        }
    }

    function displayTextArea(question, userInputElem) {
        var textArea = document.createElement("textarea");
        textArea.id = "textField";
        textArea.type = "textarea";
        textArea.cols = "50";
        textArea.rows = "6";
        userInputElem.appendChild(textArea);
        if (question.inputs !== undefined) {
            textArea.value = question.inputs;
        } else {
            textArea.focus();
        }
    }

    function displayChoiceButtons(question, userInputElem) {
        for (var i = 0; i < question.response.alternatives.length; i++) {
            var responseAlternative = question.response.alternatives[i];
            var choiceValueElem = document.createElement("span");
            choiceValueElem.innerHTML = responseAlternative.value;

            var choiceTextElem = document.createElement("span");
            choiceTextElem.innerHTML = " " + responseAlternative.text;

            var choiceButton = createChoiceButton(question.response.type, responseAlternative.value);
            if ((question.response.type === Questionnaire.responseTypes.multiChoice && $.inArray(responseAlternative.value, question.inputs) !== -1) || question.response.type === Questionnaire.responseTypes.singleChoice && responseAlternative.value === question.inputs) {
                choiceButton.checked = true;
            }

            userInputElem.appendChild(ulWrapper(choiceValueElem, choiceButton, choiceTextElem));

        }
    }

    function createChoiceButton(type, value) {
        var choiceButton = document.createElement("input");
        choiceButton.id = "choiceButton" + value;
        if (type === Questionnaire.responseTypes.singleChoice) {
            choiceButton.type = "radio";
            choiceButton.onclick = Controller.radioButtonClicked;
        } else if (type === Questionnaire.responseTypes.multiChoice) {
            choiceButton.type = "checkbox";
        }
        choiceButton.name = "choiceButton";
        choiceButton.value = value;

        return choiceButton;
    }


    function ulWrapper() {
        var ulElem = document.createElement("ul");
        for (var i = 0; i < arguments.length; i++) {
            ulElem.appendChild(arguments[i]);
        }
        return ulElem;
    }


    function displayBottomText(text) {
        var textElem = document.getElementById("bottomText");
        textElem.innerHTML = text;
    }

    function clearScreen() {
        removeChildren(document.getElementById("question"));
        removeChildren(document.getElementById("userInput"));
        removeChildren(document.getElementById("bottomText"));
    }

    function removeChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }



    return {
        displayQuestion: function(question) {
            console.log("Inputs: " + question.inputs);
            clearScreen();

            displayQuestionText(question.text, question.variableReferences);

            var userInputElem = document.getElementById("userInput");
            if (Questionnaire.responseTypes.isChoice(question.response.type)) {
                displayChoiceButtons(question, userInputElem);
            } else if (question.response.type === Questionnaire.responseTypes.textField || question.response.type === Questionnaire.responseTypes.numeric) {
                displayTextField(question, userInputElem);
            } else if (question.response.type === Questionnaire.responseTypes.textArea) {
                displayTextArea(question, userInputElem);
            }

            if (question.bottomText !== undefined) {
                displayBottomText(question.bottomText);
            }

            document.getElementById("previous").disabled = question === Questionnaire.firstQuestion();
            document.getElementById("next").disabled = question === Questionnaire.lastQuestion();
        },
        selectedChoices: function() {
            var choiceButtons = document.getElementsByName("choiceButton");
            var _selectedChoices = null;
            for (var i = 0; i < choiceButtons.length; i++) {
                if (choiceButtons[i].checked) {
                    if (choiceButtons[i].type === "checkbox") {
                        if (_selectedChoices === null) {
                            _selectedChoices = [];
                        }
                        _selectedChoices.push(parseInt(choiceButtons[i].value, 10));
                    } else if (choiceButtons[i].type === "radio") {
                        _selectedChoices = parseInt(choiceButtons[i].value, 10);
                        return _selectedChoices;
                    }
                }
            }
            return _selectedChoices;
        },
        getInputText: function() {
            return document.getElementById("textField").value;
        }

    };
}()); // END View


var Controller = (function() {

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
        } else {
            return false;
        }
    }

    function storeUserInput(question) {
        var responseType = question.response.type;
        if (Questionnaire.responseTypes.isChoice(responseType)) {
            question.inputs = View.selectedChoices();
        } else if (Questionnaire.responseTypes.isText(responseType)) {
            question.inputs = View.getInputText();
        }
    }

    function validateInputField(question) {
        checkRegExp(question);
        if (question.response.type === Questionnaire.responseTypes.numeric) {
            var response = parseInt(question.inputs, 10);
            if (question.response.min !== undefined && response < question.response.min) {
                console.log("Ouch! Below min!");
            }
            if (question.response.max !== undefined && response > question.response.max) {
                console.log("Ouch! Above max!");
            }
        }
    }

    return {
        applyForNextQuestion: function() {
            var currentQuestion = Questionnaire.currentQuestion();

            if (currentQuestion === Questionnaire.lastQuestion()) {
                return;
            }

            storeUserInput(currentQuestion);

            if (currentQuestion.response.type === Questionnaire.responseTypes.textField || currentQuestion.response.type === Questionnaire.responseTypes.numeric) {
                validateInputField(currentQuestion);
            }
            if (currentQuestion.hasResponse() || currentQuestion.response.type === Questionnaire.responseTypes.info) {
                responses[currentQuestion.variableName] = currentQuestion.inputs;
                View.displayQuestion(Questionnaire.nextQuestion());
            }
        },
        applyForPreviousQuestion: function() {
            if (Questionnaire.currentQuestion() !== Questionnaire.firstQuestion()) {
                storeUserInput(Questionnaire.currentQuestion());
                View.displayQuestion(Questionnaire.previousQuestion());
            }
        },
        radioButtonClicked: function() {
            // To make sure the user can see and visually verify its choice, we introduce
            // a small delay before the next question is displayed. During this time
            // we must prevent the user from queuing up additional events, as these will
            // stack up and execute on subsequent questions before the user has seen them.
            // That's why we are removing all event handlers.
            document.getElementById("next").removeEventListener("click", Controller.applyForNextQuestion, false);
            document.getElementById("previous").removeEventListener("click", Controller.applyForPreviousQuestion, false);
            window.onkeyup = null;

            document.getElementById("next").disabled = false;
            setTimeout(function() {
                Controller.applyForNextQuestion();
                document.getElementById("next").addEventListener("click", Controller.applyForNextQuestion, false);
                document.getElementById("previous").addEventListener("click", Controller.applyForPreviousQuestion, false);
                window.onkeyup = KeyboardListener;
            }, 200);
        }
    };

}()); // END Controller



var KeyboardListener = (function(event) {
    var keyCodes = {
        leftArrow: 37,
        rightArrow: 39,
        enter: 13,
        escape: 27,
        isDigit: function(keyCode) {
            return keyCode - 48 >= 0 && keyCode - 48 <= 9;
        },
        convertToDigit: function(keyCode) {
            return keyCode - 48;
        }
    };

    var responseType = Questionnaire.currentQuestion().response.type;
    var keyCode = event.keyCode;
    console.log(event.keyCode);


    if (keyCodes.isDigit(keyCode) && (responseType === Questionnaire.responseTypes.singleChoice || responseType === Questionnaire.responseTypes.multiChoice)) {
        var choiceButton = document.getElementById("choiceButton" + (keyCodes.convertToDigit(keyCode)));

        if (choiceButton !== null) {
            activateButton(choiceButton);
        }
    } else if ((keyCode === keyCodes.leftArrow && arrowKeysAreApplicable()) || keyCode === keyCodes.escape) {
        Controller.applyForPreviousQuestion();
    } else if (keyCode === keyCodes.rightArrow && arrowKeysAreApplicable()) {
        Controller.applyForNextQuestion();
    } else if (keyCode === keyCodes.enter && enterIsApplicable()) {
        Controller.applyForNextQuestion();
    } else if (responseType === Questionnaire.responseTypes.info) {
        Controller.applyForNextQuestion();
    }

    function arrowKeysAreApplicable() {
        return enterIsApplicable && !((Questionnaire.responseTypes.textArea) && document.getElementById("textField") === document.activeElement);
        // if (responseType === Questionnaire.responseTypes.singleChoice || responseType === Questionnaire.responseTypes.multiChoice || responseType === Questionnaire.responseTypes.info) {
        //     return true;
        // } else if ((responseType === Questionnaire.responseTypes.textField || responseType === Questionnaire.responseTypes.numeric || Questionnaire.responseTypes.textArea) && document.getElementById("textField") !== document.activeElement) {
        //     return true;
        // } else {
        //     return false;
        // }
    }

    // function rightArrowIsApplicable() {
    //     return (responseType === "singleChoice" || responseType === "multiChoice") || ((responseType === "textField" || responseType === QuestionTypes.numeric || responseType === QuestionTypes.textArea) && document.getElementById("textField") !== document.activeElement);
    // }

    function enterIsApplicable() {
        // Always applicable, unless responseType is text area with focus.
        return !(responseType === Questionnaire.responseTypes.textArea && document.activeElement.type === "textarea");
    }

    function activateButton(button) {
        if (button.type === "radio") {
            button.checked = true;
            Controller.radioButtonClicked();
        } else if (button.type === "checkbox") {
            button.checked = !button.checked;
        }
    }

});

// Keyboard listener
// window.onkeyup = function(event) {
// };


var Questionnaire = (function() {
    var questions;
    var currentQuestionNo = 0;
    var questionHistory = [];
    var _responseTypes = {
        singleChoice: "singleChoice",
        multiChoice: "multiChoice",
        textField: "textField",
        textArea: "textArea",
        info: "info",
        numeric: "numeric",
        isChoice: function(response) {
            return response === "singleChoice" || response === "multiChoice";
        },
        isText: function(response) {
            return response === "textField" || response === "textArea" || response === "numeric";
        }
    };


    function evaluate(condition) {
        if (condition === true) {
            return true;
        } else if (condition === false) {
            return false;
        } else {
            if (condition.op === "AND") {
                return evaluate(condition.left) && evaluate(condition.right);
            } else if (condition.op === "OR") {
                return evaluate(condition.left) || evaluate(condition.right);
            } else if (condition.op === "NOT") {
                return !evaluate(condition.right);
            } else if (condition.op === "==") {
                return checkEquality(condition.left, condition.right);
            } else if (condition.op === "!=") {
                return !checkEquality(condition.left, condition.right);
            }
        }
    }

    function checkEquality(left, right) {
        if (left.variableReference !== undefined) {
            left = responses[left.variableReference];
        }
        if (right.variableReference !== undefined) {
            right = responses[right.variableReference];
        }
        return left === right;
    }

    return {
        init: function(data) {
            questions = data;
        },
        currentQuestion: function() {
            var question = questions[currentQuestionNo];
            question.hasResponse = function() {
                if (question.inputs === undefined) {
                    return false;
                }
                var singleChoiceResponse = question.response.type === _responseTypes.singleChoice && question.inputs !== null;
                var multiChoiceResponse = question.response.type === _responseTypes.multiChoice && question.inputs.length > 0;
                var textFieldResponse = _responseTypes.isText(question.response.type) && question.inputs !== null && question.inputs.trim() !== "";
                return singleChoiceResponse || multiChoiceResponse || textFieldResponse;
            };
            return questions[currentQuestionNo];
        },
        nextQuestion: function() {
            localStorage.hopapa = JSON.stringify(questions);
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
            return questions[questions.length - 1];
        },
        length: function() {
            return questions.length;
        },
        // hasResponse: function(question) {
        //     if (questions.inputs !== undefined) {
        //         return false;
        //     }
        //     var singleChoiceResponse = question.response.type === QuestionTypes.singleChoice && question.inputs !== null;
        //     var multiChoiceResponse = question.response.type === QuestionTypes.multiChoice && question.inputs.length > 0;
        //     var textFieldResponse = (question.response.type === QuestionTypes.textField || question.response.type === QuestionTypes.numeric || question.response.type === QuestionTypes.textArea) && question.inputs !== null && question.inputs.trim() !== "";
        //     return singleChoiceResponse || multiChoiceResponse || textFieldResponse;
        // },
        responseTypes: function() {
            return _responseTypes;
        }()
    };
})();



// Init
$(document).ready(function() {
    document.getElementById("next").addEventListener("click", Controller.applyForNextQuestion, false);
    document.getElementById("previous").addEventListener("click", Controller.applyForPreviousQuestion, false);
    window.onkeyup = KeyboardListener;

    if (localStorage.hopapa === undefined || true) {
        $.getJSON("questions.json", function(data) {
            console.log("Loading JSON questionnaire file.");
            console.log(data);
            Questionnaire.init(data);
            View.displayQuestion(Questionnaire.firstQuestion());
        });
    } else {
        var data = JSON.parse(localStorage.hopapa);
        Questionnaire.init(data);
        View.displayQuestion(Questionnaire.firstQuestion());
    }
});

// jQuery.extend(jQuery.expr[':'], {
//     focus: "a == document.activeElement"
// });