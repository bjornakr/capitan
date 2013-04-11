function evaluateConditions(conditions) {
	parse(conditions.left);
};

function parse(element) {
	if (element === true) {
		return true;
	}
	else if (element === false) {
		return false;
	}
	else {
		if (element.op === "AND") {
			return parse(element.left) && parse(element.right);
		}
		else if (element.op === "OR") {
			return parse(element.left) || parse(element.right);
		}
		else if (element.op === "NOT") {
			return !parse(element.right);
		}
		else if (element.op === "==") {
			checkEquality(element.left, element.right);
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

var condition = {
	left: {
		op: "NOT",
		right: {
			left: "timepoint",
			op: "==",
			right: "1"
		}
	},
	op: "AND",
	right: {
		left: {
			left: "group",
			op: "==",
			right: "1"
		},
		op: "OR",
		right: {
			left: "group",
			op: "!==",
			right: 2
		}
	}
}
