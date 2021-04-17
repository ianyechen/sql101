# SQL101
A Javascript library that allows developers to create dynamic animations for SQL algorithms and interactive quizzes for SQL topics.
[Check it out now!](https://sql101.herokuapp.com/)  
Link to landing page: https://sql101.herokuapp.com/

## Get Started 
It is very simple to get set up with SQL101. Follow the instructions below and start being creative!

### CSS: Copy the stylesheet into your HTML file to load the CSS.
```css
<link rel="stylesheet" type="text/css" href="css/examples_qm.css">
<link rel="stylesheet" type="text/css" href="css/examples_av.css">
<link rel="stylesheet" type="text/css" href="css/common.css">
```
> **Note:** You do not have to include the link for the specific functionality if you don't need it. For example, you don't have to include the link for examples_av.css if you are not using any algorithm visualizations.

### JS: Copy the script into your HTML file to load the JS and construct the SQL101 object.
```javascript
<script defer type="text/javascript" src="js/sql101.js"></script>
```

### JS: Copy the script into your HTML file to load the JS.
```javascript
const sql = new SQL101()
```

## Example 
Here we show an example of how to create a table using SQL101.

### HTML
```html
<div id="canvas_Example"></div>
```

### CSS
```css
#canvas_Example {
    background-color: red;
    margin: 5%;
}

#tableMC_Example {
    width: 80%;
    margin: 0 25% 0 25%;
    border: 1px solid blue;
    border-collapse: collapse;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
    text-align: center;
}
```

### JS
```javascript
const sql = new SQL101()

function example() {

    const table = {
        "attributes": ["sID", "oID", "grade"],
        "data": [
            { "sID": 1, "oID": 2, "grade": 85 },
            { "sID": 1, "oID": 3, "grade": 30 },
            { "sID": 2, "oID": 3, "grade": 47 },
            { "sID": 2, "oID": 4, "grade": 68 },
            { "sID": 3, "oID": 4, "grade": 95 },
            { "sID": 4, "oID": 4, "grade": 34 },
            { "sID": 4, "oID": 5, "grade": 68 },
            { "sID": 5, "oID": 6, "grade": 64 },
            { "sID": 6, "oID": 6, "grade": 86 },
            { "sID": 7, "oID": 7, "grade": 94 },
            { "sID": 8, "oID": 9, "grade": 36 },
            { "sID": 9, "oID": 10, "grade": 44 },
        ]
    }

    sql.createTable(table, "MC", "Example")

}

example()
```
> **IMPORTANT:** You must give an element an id of canvas_«id» as that is where elements will be appended to. </h5>

## Documentation 
[See a more detailed documentation!](https://sql101.herokuapp.com/api.html)  
Link to documentation: https://sql101.herokuapp.com/api.html
