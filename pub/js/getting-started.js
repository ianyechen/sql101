"use strict"

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

    // sql.createTable(table, "MC", "Example")

}

example()