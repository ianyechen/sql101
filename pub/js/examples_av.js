"use strict"
console.log("Loading example.js")

const sql = new SQL101()
const sql2 = new SQL101()
const sql3 = new SQL101()
const sql4 = new SQL101()

function examples() {

    // const attributeSet = "AB"
    // const FDSet = ["AB->C", "BC->AD", "D->E", "CF->B"]
    const attributeSet = "C"
    const FDSet = ["AC->F", "CEF->B", "C->D", "DC->A"]

    sql.animationClosure(attributeSet, FDSet, 500, "Closure")

    const tableCJ1 = {
        "attributes": ["A", "B", "C"],
        "data": [
            { "A": 1, "B": 2, "C": 3 },
            { "A": 4, "B": 5, "C": 6 },
            { "A": 7, "B": 8, "C": 9 },
        ]
    }

    const tableCJ2 = {
        "attributes": ["C", "D", "E"],
        "data": [
            { "C": 1, "D": 2, "E": 3 },
            { "C": 3, "D": 4, "E": 5 },
            { "C": 6, "D": 7, "E": 8 },
        ]
    }

    sql2.animationCrossJoin(tableCJ1, tableCJ2, 500, "CrossJoin")

    const tableNJ1 = {
        "attributes": ["A", "B", "C"],
        "data": [
            { "A": 1, "B": 2, "C": 3 },
            { "A": 4, "B": 5, "C": 6 },
            { "A": 7, "B": 8, "C": 9 },
        ]
    }

    const tableNJ2 = {
        "attributes": ["C", "D", "E"],
        "data": [
            { "C": 1, "D": 2, "E": 3 },
            { "C": 3, "D": 4, "E": 5 },
            { "C": 6, "D": 7, "E": 8 },
        ]
    }

    sql3.animationNaturalJoin(tableNJ1, tableNJ2, 500, "NaturalJoin")

    sql4.animationNaturalLeftJoin(tableNJ1, tableNJ2, 500, "NaturalLeftJoin")

}

examples()