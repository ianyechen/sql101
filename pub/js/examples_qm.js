"use strict"
console.log("Loading example.js")

const sql = new SQL101()
const sql2 = new SQL101()
const sql3 = new SQL101()
const sql4 = new SQL101()

function examples() {

    const tableMC = {
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

    const problemsMC = [
        {
            "instruction": "Please choose the best answer for each question.",
            "question": "If we do SELECT avg(grade) FROM RELATION GROUP BY sID, how many rows will be in the resulting relation?",
            "choices": ["0 rows", "5 rows", "-2 rows", "9 rows"],
            "answer": "9 rows",
        },
        {
            "instruction": "Changing the instructions just to show that it's dynamic :) ",
            "question": "If we do SELECT max(grade) FROM RELATION, what would be in the resulting relation?",
            "choices": ["e^2", "3.14", "95", "0"],
            "answer": "95",
        },
        {
            "instruction": "Please choose the best answer for each question.",
            "question": "If we do SELECT avg(grade) FROM RELATION WHERE sID = 1, what would be in the resulting relation?",
            "choices": ["57.5", "ln(5)", "-100", "0"],
            "answer": "57.5",
        },
    ]

    sql.createMCQuiz(problemsMC, tableMC, "MC")

    const problems = [
        {
            "instruction": "Given the following FDs, make an instance of the relation that violates the set of FDs.",
            "question": "S = { A -> BC, B -> D }",
            "FDSet": ["A->BC", "B->D"]
        },
        {
            "instruction": "Changing the instructions just to show that it's dynamic :) ",
            "question": "S = { BC -> D, AE -> B }",
            "FDSet": ["BC->D", "AE->B"]
        },
        {
            "instruction": "Given the following FDs, make an instance of the relation that violates the set of FDs.",
            "question": "S = { A -> B, C -> D, B -> E }",
            "FDSet": ["A->B", "C->D", "B->E"]
        },
    ]

    const table = {
        "attributes": ["A", "B", "C", "D", "E"],
    }

    sql2.createMakeInstanceQuiz(problems, table, "MI")

    sql3.createMCQuiz(problemsMC, tableMC, "MC_marks", ["marks"])

    sql4.createMCQuiz(problemsMC, tableMC, "MC_time", ["marks", "time"])

}

examples()