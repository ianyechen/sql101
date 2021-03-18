"use strict"
console.log("Loading library.js")

// the main functions that will be used for animations
function animationClosure(attributeSet, FDSet) {
    console.log("function animationClosure is being called")

    let closureArr = [] // the array that will store the closures 
    splitFD(FDSet) // splits the RHS of FDs if necessary 

    displayAttributeSet(attributeSet)
    displayFDSet(FDSet)
    findClosure(attributeSet, FDSet, closureArr)

}

// the helper functions for animationClosure

// splitting the RHS of the FD's if necessary
// param: FDSet -> an array of FD's in the form LHS->RHS
// return: the newly split FDSet 
function splitFD(FDSet) {

    FDSet.forEach((FD, index) => {

        const fdSplit = FD.split("->") // get LHS and RHS

        if (fdSplit.length > 2) {
            console.log("Bad input")
        }

        else {

            let left = fdSplit[0]
            let right = fdSplit[1]
            let count = 0;

            // continue splitting the FD until the RHS only has 1 value left on the RHS
            while (right.length > 1) {
                const newFD = left + "->" + right.substring(0, 1)
                FDSet.splice(index + count, 0, newFD)
                right = right.substring(1)
                const updateFD = left + "->" + right
                FDSet[index + count + 1] = updateFD
                count++
            }

        }

    })

    return FDSet

}

function displayFDSet(FDSet) {

    const canvas = document.querySelector('#canvas')
    const FDSetDiv = document.createElement('div')
    FDSetDiv.id = "FDSetDiv"

    FDSet.forEach((FD, index) => {
        const FDList = document.createElement('li')
        const FDSplit = FD.split('->')
        const LHS = `<span id='FDListLHS${index}'>${FDSplit[0]}</span>`
        const RHS = `<span id='FDListRHS${index}'>${FDSplit[1]}</span>`

        FDList.innerHTML = `${LHS}<span> -> </span>${RHS}`
        FDList.id = "FDList" + index
        FDSetDiv.appendChild(FDList)
    })

    canvas.appendChild(FDSetDiv)

}

function displayAttributeSet(attributeSet) {

    const canvas = document.querySelector('#canvas')
    const attributeSetDiv = document.createElement('div')
    attributeSetDiv.id = "attributeSetDiv"

    attributeSetDiv.innerHTML = `<p>${attributeSet}</p><br><br><span>${attributeSet}<sup>+</sup> = </span>`
    canvas.appendChild(attributeSetDiv)

}

// finds the closure for the given input
// param: FDSet -> an array of FD's in the form LHS->RHS
//        attributeSet -> a string for which you want to find the closure for
//        closureArr -> initially empty, used to store the closure for attributeSet
// return: the closure for attributeSet
async function findClosure(attributeSet, FDSet, closureArr) {

    // initialize Y+ to Y
    const originalAttr = attributeSet.split('')
    originalAttr.forEach(attr => {
        closureArr.push(attr)
    })

    let closureStr = ""
    closureArr.forEach((attr, index) => {
        // for updating the closure HTML
        closureStr += `<span id='closure${index}'>${attr}</span>`
    })

    // adds the closure span to the attributeSet+ = line 
    const attributeSetDiv = document.querySelector('#attributeSetDiv')
    attributeSetDiv.innerHTML += closureStr

    // initially, show that you initialize Y+ to Y 
    const closureSpans = document.querySelectorAll("[id^='closure']")
    closureSpans.forEach(closureSpan => {
        closureSpan.classList.add('fadeIn')
        closureSpan.addEventListener("webkitAnimationEnd", fadeAnimationEnd) // remove class when animation is done
    })

    await timer(3000) // the initial fadeIn effect of Y+ (Y at this moment)

    let count = 0;

    while (count < FDSet.length) {

        // moving one FD to the left at a time 
        const FDToMove = document.querySelector('#FDList' + count)
        FDToMove.style.animation = "moveFD 2s linear forwards"
        await timer(2000)

        const FDSplit = FDSet[count].split('->')
        const LHS = FDSplit[0]
        const RHS = FDSplit[1]
        let inLHS = true 

        // is the entirety of LHS of this FD in S?
        for (let attr of LHS) {
            if (!closureArr.includes(attr)) inLHS = false
        }

        // if the LHS of this FD is in S, add RHS to Y+
        if (inLHS) {

            // highlights the LHS's attributes on both the FDSet, and the closure
            for (let attr of LHS) {

                const matchFD = document.querySelector(`#FDListLHS${count}`)
                matchFD.classList.add('fadeIn')
                matchFD.addEventListener("webkitAnimationEnd", fadeAnimationEnd)

                const indexClosure = closureArr.indexOf(attr)
                const matchClosure = document.querySelector(`#closure${indexClosure}`)
                matchClosure.classList.add('fadeIn')
                matchClosure.addEventListener("webkitAnimationEnd", fadeAnimationEnd)

            }

            await timer(4000) // wait for the highlighting for the LHS, not sure why you need 4000 though, 3000 doesn't work 

            // highlights the RHS's attributes on both the FDSet, and the closure 
            for (let attr of RHS) {

                // if closure already has the RHS, skip 
                if (closureArr.includes(attr)) continue

                closureStr = `<span id='closure${closureArr.length}'>${attr}</span>`
                attributeSetDiv.innerHTML += closureStr

                const closureNewlyAdded = document.querySelector(`#closure${closureArr.length}`)
                closureNewlyAdded.classList.add('fadeIn')
                closureNewlyAdded.addEventListener("webkitAnimationEnd", fadeAnimationEnd)

                const RHSNewlyAdded = document.querySelector(`#FDListRHS${count}`)
                RHSNewlyAdded.classList.add('fadeIn')
                RHSNewlyAdded.addEventListener("webkitAnimationEnd", fadeAnimationEnd)

                closureArr.push(attr)

            }

        }

        await timer(3000) // the time between each FD, can be adjusted
        count++;

        FDToMove.style.animation = "revertFD 2s linear forwards" // return the FD back to position 

    }

}

// timer function used to block code for "duration", used with await
function timer(duration) {
    return new Promise(res => setTimeout(res, duration))
}

// callback function used with events for when the animations end 
function fadeAnimationEnd(e) {
    // after fadeIn has done, you want to fadeOut
    if (e.animationName == "fadeIn") {
        setTimeout(() => {
            this.classList.remove('fadeIn')
            this.classList.add('fadeOut')
        }, 1000)
    }
    // only remove fadeOut class when you're done fading out 
    else {
        this.classList.remove('fadeOut')
    }
}