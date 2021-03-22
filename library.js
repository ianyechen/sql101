"use strict"
console.log("Loading library.js")

// global speed variable, used for adjusting the speed of the animations
let animationSpeed = 0
// contains all the animations 
// [[], [{}, {}], [{}]]
// outer array is the animationArr
// each animation "step" will be an array of animationObj's
let animationArr = []
// used to temporary store the animations of one "step"
// may store one more animation depending on how many animations should happen at once 
let arrayToPush = []
// stores the details of an animation
// "element": the document element that will display the animation 
// "animation_name": animation name, animation speed, etc.
// "animation_event": the animation onEnded function that should be called, could be no if no callback function is needed 
// let animationObj, this is declared later for individual obj since I realized the each obj pushed into array is by reference 
// contains all elements that currently in the middle of an animation
let animatingArr = []
// holds the index of animationArr that current animation "step" is on 
let animationIndex = 0;

// the main functions that will be used for animations
function animationClosure(attributeSet, FDSet, speed) {
    console.log("function animationClosure is being called")

    animationSpeed = speed

    let closureArr = [] // the array that will store the closures 
    splitFD(FDSet) // splits the RHS of FDs if necessary 

    displayInput(attributeSet, FDSet)
    displayAlgorithm("Closure")

    // first compute the algorithm and store all information before showing animation
    findClosure(attributeSet, FDSet, closureArr, speed)
    doAnimation()

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

    const inputDiv = document.querySelector('#inputDiv')
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

    inputDiv.appendChild(FDSetDiv)

}

function displayAttributeSet(attributeSet) {

    const inputDiv = document.querySelector('#inputDiv')
    const attributeSetDiv = document.createElement('div')
    attributeSetDiv.id = "attributeSetDiv"

    attributeSetDiv.innerHTML = `<p>We want to find the closure for ${attributeSet}.</p><span>${attributeSet}<sup>+</sup> = </span>`
    inputDiv.appendChild(attributeSetDiv)

}

// finds the closure for the given input
// param: FDSet -> an array of FD's in the form LHS->RHS
//        attributeSet -> a string for which you want to find the closure for
//        closureArr -> initially empty, used to store the closure for attributeSet
// return: the closure for attributeSet
async function findClosure(attributeSet, FDSet, closureArr, speed) {

    // indicates whether an FD has been successfully checked or not
    const doneArr = Array(FDSet.length).fill(false)

    // initialize Y+ to Y
    const originalAttr = attributeSet.split('')
    originalAttr.forEach(attr => {
        closureArr.push(attr)
    })

    const attributeSetDiv = document.querySelector('#attributeSetDiv')

    closureArr.forEach((attr, index) => {
        // for updating the closure HTML
        const closureSpan = document.createElement('span')
        closureSpan.innerHTML = `${attr}`
        closureSpan.id = `closure${index}`
        closureSpan.style.opacity = 0 // want to show the user the closure step by step, only turn opacity = 1 after animation "step"
        attributeSetDiv.appendChild(closureSpan)
    })

    // initially, show that you initialize Y+ to Y 
    const closureSpans = document.querySelectorAll("[id^='closure']")
    closureSpans.forEach(closureSpan => {
        // the Y+ initialization should be shown in one animation "step"
        let animationObj = {
            "element": closureSpan,
            "animation_name": `fadeIn ${animationSpeed}ms linear forwards`,
            "animation_event": fadeAnimationEnd
        }
        arrayToPush.push(animationObj)
    })
    pushAnimationToArr()

    // the initial fadeIn effect of Y+ (Y at this moment)
    // animationObj = {
    //     "timer": 3 * animationSpeed
    // }
    // arrayToPush.push(animationObj)
    // pushAnimationToArr()

    let count = 0;
    let repeat = [true, true]; // first index is true if something can be checked again, second index is true if repeat[0] is true and if an attr. has been added to the closure

    // loop while the FDSet still has some FD that's not been checked, or if need to check again because some new closure might have been added through previous FD's
    // you don't want to loop over again if the last FD cannot be added, and all the ones before it was successful 
    while (doneArr.includes(false) && repeat[0] == repeat[1] && repeat[0]) {

        repeat = [false, false]
        count = 0

        while (count < FDSet.length) {

            if (!doneArr[count]) {

                // moving one FD to the left at a time 
                const FDToMove = document.querySelector('#FDList' + count)
                let animationObjMove = {
                    "element": FDToMove,
                    "animation_name": `moveFD ${animationSpeed}ms linear forwards`,
                    "animation_event": fadeAnimationEnd
                }
                arrayToPush.push(animationObjMove)
                pushAnimationToArr()

                // waiting for the FD to finish moving horizontally 
                // animationObj = {
                //     "timer": 2 * animationSpeed
                // }
                // arrayToPush.push(animationObj)
                // pushAnimationToArr()

                const FDSplit = FDSet[count].split('->')
                const LHS = FDSplit[0]
                const RHS = FDSplit[1]
                let inLHS = true

                // is the entirety of LHS of this FD in S?
                for (let attr of LHS) {
                    if (!closureArr.includes(attr)) {
                        inLHS = false
                        repeat[0] = true
                    }
                }

                // if the LHS of this FD is in S, add RHS to Y+
                if (inLHS) {

                    // highlights the LHS's attributes on both the FDSet, and the closure
                    for (let attr of LHS) {

                        const indexClosure = closureArr.indexOf(attr)
                        const matchClosure = document.querySelector(`#closure${indexClosure}`)
                        let animationObj = {
                            "element": matchClosure,
                            "animation_name": `fadeIn ${animationSpeed}ms linear forwards`,
                            "animation_event": fadeAnimationEnd
                        }
                        arrayToPush.push(animationObj)

                    }

                    const matchFD = document.querySelector(`#FDListLHS${count}`)
                    let animationObjLHS = {
                        "element": matchFD,
                        "animation_name": `fadeIn ${animationSpeed}ms linear forwards`,
                        "animation_event": fadeAnimationEnd
                    }
                    arrayToPush.push(animationObjLHS)
                    pushAnimationToArr()

                    // wait for the highlighting for the LHS, not sure why you need 4000 though, 3000 doesn't work 
                    // animationObj = {
                    //     "timer": 4 * animationSpeed
                    // }
                    // arrayToPush.push(animationObj)
                    // pushAnimationToArr()

                    // highlights the RHS's attributes on both the FDSet, and the closure 
                    let animationRepeated = ""
                    for (let attr of RHS) {

                        let indexRepeated = -1
                        doneArr[count] = true
                        if (repeat[0]) repeat[1] = true

                        // if closure already has the RHS, highlight with info colour  
                        if (closureArr.includes(attr)) {
                            indexRepeated = closureArr.indexOf(attr)
                            animationRepeated = "fadeInInfo"
                        }
                        else {
                            const attributeSetDiv = document.querySelector('#attributeSetDiv')
                            const closureSpan = document.createElement('span')

                            closureSpan.innerHTML = `${attr}`
                            closureSpan.id = `closure${closureArr.length}`
                            closureSpan.style.opacity = 0
                            attributeSetDiv.appendChild(closureSpan)

                            indexRepeated = closureArr.length
                            animationRepeated = "fadeIn"
                            closureArr.push(attr)
                        }

                        const closureNewlyAdded = document.querySelector(`#closure${indexRepeated}`)
                        let animationObj = {
                            "element": closureNewlyAdded,
                            "animation_name": `${animationRepeated} ${animationSpeed}ms linear forwards`,
                            "animation_event": fadeAnimationEnd
                        }
                        arrayToPush.push(animationObj)

                    }

                    const RHSNewlyAdded = document.querySelector(`#FDListRHS${count}`)
                    let animationObjRHS = {
                        "element": RHSNewlyAdded,
                        "animation_name": `${animationRepeated} ${animationSpeed}ms linear forwards`,
                        "animation_event": fadeAnimationEnd
                    }
                    arrayToPush.push(animationObjRHS)
                    pushAnimationToArr()

                }

                else {

                    const unMatchFD = document.querySelector(`#FDListLHS${count}`)
                    let animationObj = {
                        "element": unMatchFD,
                        "animation_name": `fadeInErr ${animationSpeed}ms linear forwards`,
                        "animation_event": fadeAnimationEnd
                    }
                    arrayToPush.push(animationObj)
                    pushAnimationToArr()

                }

                // the time between each FD, can be adjusted
                // animationObj = {
                //     "timer": 3 * animationSpeed
                // }
                // arrayToPush.push(animationObj)
                // pushAnimationToArr()

                // return the FD back to position 
                let animationObjRev = {
                    "element": FDToMove,
                    "animation_name": `revertFD ${animationSpeed}ms linear forwards`,
                    "animation_event": fadeAnimationEnd
                }
                arrayToPush.push(animationObjRev)
                pushAnimationToArr()

                // want to wait for the last FD to return before the first one can go again 
                if (count == FDSet.length - 1) {
                    // animationObj = {
                    //     "timer": 3 * animationSpeed
                    // }
                    // arrayToPush.push(animationObj)
                    // pushAnimationToArr()
                }

            }

            count++;

        }

    }

}

// timer function used to block code for "duration", used with await
function timer(duration) {
    return new Promise(res => setTimeout(res, duration))
}

// callback function used with events for when the animations end 
function fadeAnimationEnd(e) {
   
    this.style.opacity = 1 // want to show closures after each animation "step", no need to hide it anymore 
    if (animationIndex == animationArr.length) return // want to keep the last animation (FD going back)

    // after fadeIn has done, you want to fadeOut
    if (e.animationName == "fadeIn") {
        setTimeout(() => {
            this.style.animation = `fadeOut ${animationSpeed}ms linear forwards`
        }, animationSpeed)
    }
    else if (e.animationName == "fadeInErr") {
        setTimeout(() => {
            this.style.animation = `fadeOutErr ${animationSpeed}ms linear forwards`
        }, animationSpeed)
    }
    else if (e.animationName == "fadeInInfo") {
        setTimeout(() => {
            this.style.animation = `fadeOutInfo ${animationSpeed}ms linear forwards`
        }, animationSpeed)
    }
    else if (e.animationName == "moveFD") {
        this.removeEventListener("webkitAnimationEnd", fadeAnimationEnd) // remove event listener to avoid duplicates
        animatingArr.splice(animatingArr.indexOf(e.target), 1) // since animation is done, remove from animatingArr
        if (animatingArr.length == 0) doAnimation() // if this animation "step" is done, move on to the next step
    }
    // only remove fadeOut class when you're done fading out 
    else {
        this.style.animation = ""
        this.removeEventListener("webkitAnimationEnd", fadeAnimationEnd)
        animatingArr.splice(animatingArr.indexOf(e.target), 1)
        if (animatingArr.length == 0) doAnimation()
    }

}

function displayAlgorithm(algorithm) {

    const algorithmDiv = document.createElement('div')
    algorithmDiv.id = "algorithmDiv"
    const algo = `
        <p>attribute_closure(Y, S):</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;initialize Y+ to Y</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;split RHS's of FDs if necessary</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;repeat until no more changes occur:</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;If there is an FD LHS -> RHS in S such that LHS is in Y+:</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Add RHS to Y+</p>
        <p>&nbsp;&nbsp;&nbsp;&nbsp;return Y+</p>
    `
    const canvas = document.querySelector('#canvas')
    algorithmDiv.innerHTML = algo
    canvas.appendChild(algorithmDiv)

}

function displayInput(attributeSet, FDSet) {

    const inputDiv = document.createElement('div')
    const buttonsDiv = document.createElement('div')

    const speedUpButton = document.createElement('button')
    const speedDownButton = document.createElement('button')
    const pauseButton = document.createElement('button')
    const playButton = document.createElement('button')
    
    const canvas = document.querySelector('#canvas')

    inputDiv.id = "inputDiv"
    buttonsDiv.id = "buttonsDiv"

    speedUpButton.id = "speedUpButton"
    speedDownButton.id = "speedDownButton"
    pauseButton.id = "pauseButton"
    playButton.id = "playButton"

    speedUpButton.classList.add("speedButton")
    speedDownButton.classList.add("speedButton")
    pauseButton.classList.add("speedButton")
    playButton.classList.add("speedButton")

    speedUpButton.innerHTML = "Faster"
    speedDownButton.innerHTML = "Slower"
    pauseButton.innerHTML = "Pause"
    playButton.innerHTML = "Play"

    speedUpButton.onclick = function () { changeSpeed("faster") }
    speedDownButton.onclick = function () { changeSpeed("slower") }
    pauseButton.onclick = function () { }
    playButton.onclick = function () { }

    buttonsDiv.appendChild(speedUpButton)
    buttonsDiv.appendChild(speedDownButton)
    buttonsDiv.appendChild(pauseButton)
    buttonsDiv.appendChild(playButton)
    canvas.appendChild(buttonsDiv)
    canvas.appendChild(inputDiv)

    displayAttributeSet(attributeSet)
    displayFDSet(FDSet)

}

function changeSpeed(option) {
    if (option == "faster") animationSpeed /= 1.25
    else animationSpeed *= 1.25
}

// adds an animation "step" to the global animationArr
function pushAnimationToArr() {
    animationArr.push(arrayToPush)
    arrayToPush = []
}

async function doAnimation() {

    // can't do asyncs in forEach 
    if (animationIndex < animationArr.length) {

        let animations = animationArr[animationIndex]

        for (let animation of animations) {

            if ('animation_name' in animation) {
                animation["element"].style.animation = animation["animation_name"]
                animatingArr.push(animation["element"])
                animation["element"].addEventListener("webkitAnimationEnd", animation["animation_event"])
            }

        }

        animationIndex++
        
    }

}