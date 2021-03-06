var calculator = new Calculator();
$(document).ready(function() {
    $('.buttons button').click(calculator.button_clicked);
});
function Calculator() {
    var self = this;
    this.inputs_array = []; //holds the input objects
    this.index = 0; //keeps track of input state
    this.last_input = {}; //memory of the object of the last clicked input
    this.history = {}; //history object that will be placed in a property on the numbers that are generated by prepare_answer()
    this.last_number = null; //memory of the value of the last number inputted
    this.last_operation = null; //memory of the value of the last operator inputted

    this.button_clicked = function() { //called when the buttons are clicked
        var clicked_type = $(this).attr('class');
        var clicked_value = $(this).val();
        if (clicked_type === "number") {
            self.number_clicked(clicked_value);
        }
        else if (clicked_type === "operator") {
            self.operator_clicked(clicked_value);
        }
        else if (clicked_type === "equalSign") {
            self.equals_clicked();
        }
        else if (clicked_type === "AC") {
            self.ac_clicked();
        }
        else if (clicked_type === "C") {
            self.clear_entry_clicked();
        }
        else if (clicked_type === "DEL") {
            self.delete_clicked();
        }
    };

    this.number_clicked = function(clicked_value) {
        var last_value = null; //value of the previous input object
        if (self.inputs_array.length && self.inputs_array[self.index - 1].type === "number") { //if the previous input exists and was also a number
            self.index--; //go back to the previous input to concatenate this current input onto it
            last_value = self.inputs_array[self.index].value;
            if (!self.inputs_array[self.index].from_result) { //if the previous input was the result of pressing equals
                if (clicked_value === "." && last_value.indexOf(".") > -1) { //if more than one decimal point
                    clicked_value = last_value;
                }
                else if (last_value === "0" || last_value === "-0" ) { //if the previous input was "0" or "-0", replace it with the new input
                    last_value = clicked_value;
                }
                else if (clicked_value === "-") { //if negative/positive button
                    if (last_value.indexOf("-") > -1) { //remove the "-" from the previous input if it had one
                        clicked_value = last_value.replace("-", "");
                    }
                    else if (last_value.length < 11) { //add a "-" to the beginning of the previous input if it didn't have one
                        clicked_value = "-" + last_value;
                    }
                    else { //if a "-" wouldn't fit in the display, don't do anything to the previous input
                        clicked_value = last_value;
                    }
                }
                else { //if both inputs are regular digits, just concatenate normally
                    clicked_value = last_value + clicked_value;
                }
            }
            else { //the previous input was the result of pressing equals
                self.last_input = {};
                self.last_number = null;
                self.last_operation = null;
            }
        }
        else if (clicked_value === ".") { //if the previous input wasn't a number and you pressed the decimal point, adds a 0 to it
            clicked_value = "0.";
        }
        clicked_value = clicked_value.slice(0,11); //limits concatenated number to 11 characters
        self.last_input = {"type": "number", "value": clicked_value};
        self.last_number = clicked_value;
        self.inputs_array[self.index] = self.last_input;
        self.index++;
        self.display(clicked_value);
    };

    this.operator_clicked = function(clicked_value) {
        if (self.index === 0) { //disable insertion of operator at index 0
            return;
        }
        if (self.inputs_array.length && self.inputs_array[self.index - 1].type === "operator") { //overwrite old operator
            self.index--;
        }
        if (self.index > 2) { //check if do math is possible
            if ( (clicked_value === "+" || clicked_value === "-") ) { //ready to do math
                /**
                 * if clicked button was "+" or "-"
                 * send the array to the prepare_answer method to automatically do all math possible
                 * if "x" or "/" were clicked after the index passed 3, they will skip this and be pushed to the end of the array instead
                 * this should enforce order of operations since prepare answer will begin solving from the end of the array
                 */
                var solved_value = self.prepare_answer();
                self.inputs_array = [{"type": "number", "value": solved_value, "history": self.history}]; //store solution in the input array
                self.index = 1;
                self.display(solved_value);
            }
        }
        self.last_input = {"type": "operator", "value": clicked_value};
        self.last_operation = clicked_value;
        self.inputs_array[self.index] = self.last_input;
        self.index++;
    };

    this.prepare_answer = function() {
        var num1 = null;
        var num2 = null;
        var operator = null;
        var lastIndex = this.inputs_array.length-1;
        var solved_value = null;
        var solution_index = null;
        if (this.inputs_array.length > 3) { //order of operations
            /**
             * If the inputs array has more than 3 nodes in it, it needs to use order of operations
             * this will only happen if multiplication or division was tried before any addition or subtraction was automatically solved
             */
            for (var i = lastIndex; i > 0; i -= 2) {
                /**
                 * loops through the array from the end, decrementing i by 2 each loop
                 * the loop should solve the equation in the last 3 nodes of the array
                 * when it's done solving that, it erases the last two nodes and
                 * then puts the solution in the new last node
                 * this continues until every set of 3 nodes is solved
                 */
                if (this.inputs_array[i].type === "number") { // last node is a number
                    num2 = parseFloat(this.inputs_array[i].value);
                    operator = this.inputs_array[i - 1].value;
                    self.last_operation = operator;
                    num1 = parseFloat(this.inputs_array[i - 2].value);
                    self.last_number = num1;
                    solution_index = i - 2;
                }
                else { //last node is an operator
                    i++; //go to the index num2 would have been
                    operator = this.inputs_array[i - 1].value;
                    num1 = parseFloat(this.inputs_array[i - 2].value);
                    num2 = num1; //missing operand fallback
                    solution_index = i - 2;
                }
                this.inputs_array.splice(i - 2, 3);
                solved_value = this.do_math(num1, num2, operator);
                if (i >= lastIndex) { //if this is the first equation, don't store anything in the history property of the num2
                    self.history = [
                        {"type": "number", "value": "" + num1},
                        {"type": "operator", "value": operator},
                        {"type": "number", "value": "" + num2}
                    ];
                }
                else { //if it's not the first equation, store the previous equation in the history property of num2
                    self.history = [
                        {"type": "number", "value": "" + num1},
                        {"type": "operator", "value": operator},
                        {"type": "number", "value": "" + num2, "history": self.history}
                    ];
                }

                this.inputs_array[solution_index] = {"type": "number", "value": solved_value}; //puts a number object representing the solution in the space where num1 used to be
                self.index = solution_index + 1; //moves the calculator's index to one space after the solution
            }
        }
        else { //no order of operations required
            for (i = 0; i < this.inputs_array.length; i++) {
                if (this.inputs_array[i].type === "number" && num1 === null) {
                    num1 = this.inputs_array[i].value;
                    num1 = parseFloat(num1);
                }
                else if (this.inputs_array[i].type === "number") {
                    num2 = this.inputs_array[i].value;
                    num2 = parseFloat(num2);
                }
                else {
                    operator = this.inputs_array[i].value;
                }
            }
            self.history = self.inputs_array;
        }
        if (operator === null && self.last_operation) {
            operator = self.last_operation; //missing operation functionality
            num2 = parseFloat(self.last_number); //missing operand functionality
        }
        return this.do_math(num1, num2, operator);
    };

    this.equals_clicked = function() {
        var solved_value = self.prepare_answer();
        self.inputs_array = [{
                "type": "number",
                "value": solved_value,
                "from_result": true, //boolean to disable concatenation
                "history": self.history //the 3 nodes that created this solution
            }];
        self.index = 1;
        self.display(solved_value);
    };

    this.ac_clicked = function() { //reset memory and clear the screen
        self.index = 0;
        self.inputs_array = [];
        self.last_input = {};
        self.history = {};
        self.last_number = null;
        self.last_operation = null;
        self.display("");
    };

    this.clear_entry_clicked = function() {
    /**
     * Displays the previous number input.
     * If the current input was the solution to an equation,
     * it reads the history property on the object,
     * sets the inputs array to the 3 nodes in that property,
     * and displays the 3rd node's value in the display
     */
        if (self.index) {
            self.index--;
        }
        if (self.inputs_array.length) { //if the inputs array has any nodes in it
            if (self.inputs_array[self.index].history) { //if this node has a history property
                self.inputs_array = self.inputs_array[self.index].history;
                self.index = self.inputs_array.length;
                if (self.inputs_array[self.inputs_array.length - 1].type === "operator") { //removes node if operator
                    self.inputs_array.pop();
                    self.last_operation = null;
                    if (self.index) {
                        self.index--;
                    }
                }
                self.display(self.inputs_array[self.inputs_array.length - 1].value);
            }
            else { //if this node has no history property
                self.inputs_array.pop();
                if (self.index) {
                    self.index--;
                }
                if (self.inputs_array.length) { // if the inputs array still has nodes in it
                    if (self.inputs_array[self.index].type === "operator") { //removes node if operator
                        self.inputs_array.pop();
                        self.last_operation = null;
                        if (self.index) {
                            self.index--;
                        }
                        self.display(self.inputs_array[self.index].value);
                        self.last_number = self.inputs_array[self.index].value;
                    }
                    self.index++;
                }
                else { //inputs array had all nodes removed
                    self.last_input = {};
                    self.history = {};
                    self.last_number = null;
                    self.last_operation = null;
                    self.display("");
                }
            }
        }
    };

    this.delete_clicked = function() { //undo last input
        if (self.index) {
            self.index = self.inputs_array.length - 1;
            var obj = self.inputs_array[self.index];
            if (obj.value.length > 1) {
                obj.value = obj.value.substring(0, obj.value.length - 1);
                self.display(obj.value);
                self.index++;
            }
            else {
                self.inputs_array.pop();
                self.display("");
            }
        }
    };

    this.display = function(input) { //display value on screen
        $('.display-main').text(input);
    };

    this.do_math = function(num1, num2, operator) { //math logic
        var result = null;
        if (num1 === null) {
            num1 = 0;
        }
        if (num2 === null) {
            num2 = num1;
            this.last_number = num2;
        }
        if (operator === null) {
            this.last_operation = null;
            this.last_number = null;
            return num1;
        }
        if (operator === "+") {
            result = num1 + num2;
        }
        else if (operator === "-") {
            result = num1 - num2;
        }
        else if (operator === "*" || operator === "x" || operator === "X"){
            result = num1 * num2;
        }
        else if (operator === "/") {
            if (num2 === 0) {
                return "ERROR";
            }
            else {
                result = num1 / num2;
            }
        }
        else { //invalid input
            return "ERROR";
        }
        if (result > 99999999999 || result < -9999999999) {
            return "ERROR";
        }
        var result_string = "" + result;
        result_string = result_string.split(".");
        var exp = 10 - result_string[0].length;
        if (exp > 0) {
            result = Math.round(result * Math.pow(10, exp)) / Math.pow(10, exp);
        }
        return result;
    };
}