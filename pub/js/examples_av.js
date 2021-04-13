"use strict"
console.log("Loading example.js")

const sql = new SQL101()

function examples() {

    // const attributeSet = "AB"
    // const FDSet = ["AB->C", "BC->AD", "D->E", "CF->B"]
    const attributeSet = "C"
    const FDSet = ["AC->F", "CEF->B", "C->D", "DC->A"]

    sql.animationClosure(attributeSet, FDSet, 500)

}

examples()