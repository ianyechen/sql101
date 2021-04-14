(function (global, document) {

    // this function is currently only in the scope of the anonymous function at the moment.
    function SQL101() {

    }

    /* Private properties and functions */
    // unless we attach these to the global window object, they cannot be accessed directly.
    // they will only be in the closure of this function, and can be accessed only the places we use them (such as in the functions of the CircleGenerator prototype)
    // (see examples.js for what we can and cannot access)

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
    let animationIndex = 0
    // true if animation is paused, false if animation is running 
    let animationPaused = true
    // true if the animation is to be stepped through one by one, instead of playing it all
    let animationStep = false

    // used for the MC quiz to know which current question we are on 
    let quizIndex = 0

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
                let count = 0

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

        attributeSetDiv.innerHTML = `<h3>We want to find the closure for ${attributeSet}.</h3><span>${attributeSet}<sup>+</sup> = </span>`
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
                "animation_name": `fadeIn speedms linear forwards`,
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

        let count = 0
        let repeat = [true, true] // first index is true if something can be checked again, second index is true if repeat[0] is true and if an attr. has been added to the closure

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
                        "animation_name": `moveFD speedms linear forwards`,
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
                                "animation_name": `fadeIn speedms linear forwards`,
                                "animation_event": fadeAnimationEnd
                            }
                            arrayToPush.push(animationObj)

                        }

                        const matchFD = document.querySelector(`#FDListLHS${count}`)
                        let animationObjLHS = {
                            "element": matchFD,
                            "animation_name": `fadeIn speedms linear forwards`,
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
                                "animation_name": `${animationRepeated} speedms linear forwards`,
                                "animation_event": fadeAnimationEnd
                            }
                            arrayToPush.push(animationObj)

                        }

                        const RHSNewlyAdded = document.querySelector(`#FDListRHS${count}`)
                        let animationObjRHS = {
                            "element": RHSNewlyAdded,
                            "animation_name": `${animationRepeated} speedms linear forwards`,
                            "animation_event": fadeAnimationEnd
                        }
                        arrayToPush.push(animationObjRHS)
                        pushAnimationToArr()

                    }

                    else {

                        const unMatchFD = document.querySelector(`#FDListLHS${count}`)
                        let animationObj = {
                            "element": unMatchFD,
                            "animation_name": `fadeInErr speedms linear forwards`,
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
                        "animation_name": `revertFD speedms linear forwards`,
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

                count++

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
            if (animatingArr.length == 0 && !animationStep) { // if this animation "step" is done, move on to the next step
                // animationIndex++    
                setTimeout(doAnimation, animationSpeed)
            }
        }

        // only remove fadeOut class when you're done fading out 
        else {
            this.style.animation = ""
            this.removeEventListener("webkitAnimationEnd", fadeAnimationEnd)
            animatingArr.splice(animatingArr.indexOf(e.target), 1)
            if (animatingArr.length == 0 && !animationStep) {
                // animationIndex++
                setTimeout(doAnimation, animationSpeed)
            }
        }

    }

    function displayAlgorithm(algorithm) {

        const algorithmDiv = document.createElement('div')
        algorithmDiv.id = "algorithmDiv"
        const algo = `
        <h3 class='algorithm'>attribute_closure(Y, S):</h3>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;initialize Y+ to Y</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;split RHS's of FDs if necessary</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;repeat until no more changes occur:</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;If there is an FD LHS -> RHS in S such that LHS is in Y+:</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Add RHS to Y+</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;return Y+</p>
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
        const nextStepButton = document.createElement('button')
        const prevButton = document.createElement('button')

        const canvas = document.querySelector('#canvas')

        inputDiv.id = "inputDiv"
        buttonsDiv.id = "buttonsDiv"

        speedUpButton.id = "speedUpButton"
        speedDownButton.id = "speedDownButton"
        pauseButton.id = "pauseButton"
        nextStepButton.id = "nextStepButton"
        prevButton.id = "prevButton"

        // speedUpButton.classList.add("speedButton")
        // speedDownButton.classList.add("speedButton")
        // pauseButton.classList.add("speedButton")
        // nextButton.classList.add("speedButton")
        // prevButton.classList.add("speedButton")

        speedUpButton.innerHTML = "Faster"
        speedDownButton.innerHTML = "Slower"
        pauseButton.innerHTML = "Play All"
        nextStepButton.innerHTML = "Next Step"
        prevButton.innerHTML = "Prev"

        speedUpButton.onclick = function () { changeSpeed("faster") }
        speedDownButton.onclick = function () { changeSpeed("slower") }
        pauseButton.onclick = function () { toggleAnimationPause() }
        nextStepButton.onclick = function () { nextAnimation() }
        prevButton.onclick = function () { prevAnimation() }

        buttonsDiv.appendChild(speedUpButton)
        buttonsDiv.appendChild(speedDownButton)
        buttonsDiv.appendChild(pauseButton)
        buttonsDiv.appendChild(nextStepButton)
        // buttonsDiv.appendChild(prevButton)
        inputDiv.appendChild(buttonsDiv)
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

    // toggles between the animation been played or paused 
    function toggleAnimationPause() {

        const nextStepButton = document.querySelector('#nextStepButton')
        nextStepButton.disabled = true

        const pausedButton = document.querySelector('#pauseButton')

        if (animationPaused) {
            for (let animation of animatingArr) {
                animation.style.animationPlayState = "running"
            }
            pausedButton.innerHTML = "Pause"
            animationPaused = false
            if (animatingArr.length == 0) doAnimation() // used for the very start 
        }

        else {
            for (let animation of animatingArr) {
                animation.style.animationPlayState = "paused"
            }
            pausedButton.innerHTML = "Resume"
            animationPaused = true
        }

    }

    function nextAnimation() {
        if (animatingArr.length != 0) return // can't proceed until animations have finished
        const pauseButton = document.querySelector('#pauseButton')
        pauseButton.disabled = true
        // animatingArr.splice(0, animatingArr.length)
        // animationIndex++
        animationStep = true
        doAnimation()
    }

    function prevAnimation() {
        if (animatingArr.length != 0) return
        // animatingArr.splice(0, animatingArr.length)
        animationIndex--
        doAnimation()
    }

    function doAnimation() {

        if (animationPaused && !animationStep) return

        if (animationIndex < animationArr.length) {

            let animations = animationArr[animationIndex]

            for (let animation of animations) {

                if ('animation_name' in animation) {
                    animation["element"].style.animation = animation["animation_name"].replace("speed", `${animationSpeed}`)
                    animatingArr.push(animation["element"])
                    animation["element"].addEventListener("webkitAnimationEnd", animation["animation_event"])
                }

            }

            animationIndex++

        }

    }

    // creates the answering part of the quiz maker 
    function createAnswerDiv(problems, type, table) {

        const answerDiv = document.createElement('div')
        answerDiv.id = 'answerDiv'

        const instructionsDiv = document.createElement('div')
        instructionsDiv.innerHTML = "<h3>Please choose the best answer for each question.</h3>"
        instructionsDiv.id = 'instructionsDiv'

        const questionDiv = document.createElement('div')
        questionDiv.innerHTML = `<p>${problems[quizIndex]["question"]}</p>`
        questionDiv.id = 'questionDiv'

        const answeringForm = document.createElement('form')
        answeringForm.id = "answeringForm"

        if (type == "MC") {
            for (let choice of problems[quizIndex]["choices"]) {

                const inputElement = document.createElement('input')
                inputElement.type = "radio"
                inputElement.value = choice
                inputElement.id = choice
                inputElement.name = "choice"

                const labelElement = document.createElement('label')
                labelElement.setAttribute("for", choice)
                labelElement.innerHTML = `${choice}`

                answeringForm.appendChild(inputElement)
                answeringForm.appendChild(labelElement)
                answeringForm.appendChild(document.createElement("br"))

            }
        }

        const submitButton = document.createElement('button')
        submitButton.id = "submitButton"
        submitButton.innerHTML = "Submit"
        submitButton.type = "button"
        if (type == "MC") submitButton.onclick = function () { checkAnswer(problems[quizIndex]["answer"]) }
        else if (type == "MI") submitButton.onclick = function () { checkAnswerMI(problems[quizIndex]["FDSet"], table["attributes"]) }

        const prevButton = document.createElement('button')
        prevButton.id = "prevButton"
        prevButton.innerHTML = "Prev"
        prevButton.type = "button"
        prevButton.onclick = function () { prevQuestion(problems, type, table["attributes"]) }
        prevButton.style.display = "none"

        const nextButton = document.createElement('button')
        nextButton.id = "nextButton"
        nextButton.innerHTML = "Next"
        nextButton.type = "button"
        nextButton.onclick = function () { nextQuestion(problems, type, table["attributes"]) }

        const feedbackDiv = document.createElement('div')
        feedbackDiv.id = 'feedbackDiv'

        answeringForm.appendChild(submitButton)
        answeringForm.appendChild(prevButton)
        answeringForm.appendChild(nextButton)
        answerDiv.appendChild(instructionsDiv)
        answerDiv.appendChild(questionDiv)
        answerDiv.appendChild(answeringForm)
        answerDiv.appendChild(feedbackDiv)

        const canvas = document.querySelector('#canvas')
        canvas.appendChild(answerDiv)

    }

    function nextQuestion(problems, type, attr) {
        // display the prev button if you're pressing next on the very first question 
        if (quizIndex == 0) {
            const prevButton = document.querySelector('#prevButton')
            prevButton.style.display = "inline-block"
        }

        quizIndex++
        changeQuestion(problems, type, attr)
        // clear the feedback when switching questions 
        const feedbackDiv = document.querySelector('#feedbackDiv')
        feedbackDiv.className = ''
        feedbackDiv.innerHTML = ""

        // if got to very last question, don't display the next button
        if (quizIndex == problems.length - 1) {
            const nextButton = document.querySelector('#nextButton')
            nextButton.style.display = "none"
        }
    }

    function prevQuestion(problems, type, attr) {
        // display the prev button if you're pressing prev on the very last question 
        if (quizIndex == problems.length - 1) {
            const nextButton = document.querySelector('#nextButton')
            nextButton.style.display = "inline-block"
        }

        quizIndex--
        changeQuestion(problems, type, attr)
        // clear the feedback when switching questions 
        const feedbackDiv = document.querySelector('#feedbackDiv')
        feedbackDiv.className = ''
        feedbackDiv.innerHTML = ""

        // if got to very first question, don't display the prev button
        if (quizIndex == 0) {
            const prevButton = document.querySelector('#prevButton')
            prevButton.style.display = "none"
        }
    }

    function changeQuestion(problems, type, attr) {

        const questionDiv = document.querySelector('#questionDiv')
        questionDiv.innerHTML = `<p>${problems[quizIndex]["question"]}</p>`

        if (type == "MC") {

            const answeringForm = document.querySelector('#answeringForm')

            let count = 0
            for (let choice of problems[quizIndex]["choices"]) {

                const inputElement = document.createElement('input')
                inputElement.type = "radio"
                inputElement.value = choice
                inputElement.id = choice
                inputElement.name = "choice"

                const labelElement = document.createElement('label')
                labelElement.setAttribute("for", choice)
                labelElement.innerHTML = `${choice}`

                // need to replace the prev children that were already there 
                answeringForm.replaceChild(inputElement, answeringForm.childNodes[count++])
                answeringForm.replaceChild(labelElement, answeringForm.childNodes[count++])
                count++ // to skip the <br> element

            }

        }

        // clearing the inputs in the table 
        else {

            Array.from(Array(3)).forEach((x, i) => {
                for (let attribute of attr) {
                    document.querySelector(`#${attribute + i}`).value = ""
                }
            })

        }

    }

    // check to see if the given answer is right or wrong for MC
    function checkAnswer(answer) {

        const answeringForm = document.querySelector('#answeringForm')
        const data = Object.fromEntries(new FormData(answeringForm).entries())
        const feedbackDiv = document.querySelector('#feedbackDiv')

        // if no answer was given
        if (Object.keys(data).length == 0) {
            feedbackDiv.innerHTML = "Please answer the question above!"
            feedbackDiv.classList.remove('feedback-correct')
            feedbackDiv.classList.add('feedback-incorrect')
        }
        // if incorrect answer 
        else if (data["choice"] != answer) {
            feedbackDiv.innerHTML = "Incorrect answer. Please try again!"
            feedbackDiv.classList.remove('feedback-correct')
            feedbackDiv.classList.add('feedback-incorrect')
        }
        // right answer
        else {
            feedbackDiv.innerHTML = "Correct answer. Good job!"
            feedbackDiv.classList.remove('feedback-incorrect')
            feedbackDiv.classList.add('feedback-correct')
        }

    }

    // check to see if the given answer is right or wrong for MI
    function checkAnswerMI(FDSet, attributes) {

        // will contain all the form values in an obj
        // the key is the attr + row number (A1, B2), the value will be the value from the table
        const formValues = new Object()
        // will be false if any input is empty 
        let validAnswer = true

        const feedbackDiv = document.querySelector('#feedbackDiv')

        // populating formValues obj
        Array.from(Array(3)).forEach((x, i) => {
            for (let attribute of attributes) {
                const value = document.querySelector(`#${attribute + i}`).value
                if (!value) validAnswer = false
                formValues[`${attribute + i}`] = value
            }
        })

        if (!validAnswer) {
            feedbackDiv.innerHTML = "Please fill in the table properly!"
            feedbackDiv.classList.remove('feedback-correct')
            feedbackDiv.classList.add('feedback-incorrect')
            return
        }

        let correct = true

        // for each FD
        for (let FD of FDSet) {

            let FDStrings = {}

            const splitFD = FD.split("->")

            // for each row of the table
            Array.from(Array(3)).forEach((x, i) => {

                let leftFDString = ""

                for (let letter of splitFD[0]) {
                    leftFDString += formValues[`${letter + i}`]
                    leftFDString += ","
                }

                let rightFDString = ""

                for (let letter of splitFD[1]) {
                    rightFDString += formValues[`${letter + i}`]
                    rightFDString += ","
                }

                // if the LHS already exists, check if the RHS is equal, if not equal, it's not a valid instance 
                if (leftFDString in FDStrings && FDStrings[leftFDString] != rightFDString) correct = false
                else FDStrings[leftFDString] = rightFDString

            })

            if (!correct) break

        }

        // do this for questions asking to violate the FD's
        correct = !correct

        if (correct) {
            feedbackDiv.innerHTML = "Correct answer. Good job!"
            feedbackDiv.classList.remove('feedback-incorrect')
            feedbackDiv.classList.add('feedback-correct')
        }

        else {
            feedbackDiv.innerHTML = "Incorrect answer. Please try again!"
            feedbackDiv.classList.remove('feedback-correct')
            feedbackDiv.classList.add('feedback-incorrect')
        }

    }

    function createTable(table, type, idName) {

        makeTable(type, idName)
        makeHeadings(table["attributes"], type, idName)
        makeData(table["attributes"], table["data"], type, idName)

    }

    function makeTable(type, idName) {

        const table = document.createElement('table')
        table.id = `table${type}_${idName}`

        const tableDiv = document.createElement('div')
        tableDiv.id = `tableDiv${type}_${idName}`

        const canvas = document.querySelector('#canvas')
        tableDiv.appendChild(table)
        canvas.appendChild(tableDiv)

    }

    function makeHeadings(attributes, type, idName) {

        const thead = document.createElement('thead')
        const headingRow = document.createElement('tr')

        for (let attribute of attributes) {
            const headingCol = document.createElement('th')
            headingCol.innerHTML = attribute
            headingRow.appendChild(headingCol)
        }

        const table = document.querySelector(`#table${type}_${idName}`)
        thead.appendChild(headingRow)
        table.appendChild(thead)

    }

    // populate the rows of the table
    function makeData(attributes, data, type, idName) {

        const tbody = document.createElement('tbody')

        if (type == "MC") {

            for (let row of data) {

                const dataRow = document.createElement('tr')

                for (let attribute of attributes) {
                    const dataCol = document.createElement('td')
                    dataCol.innerHTML = row[attribute]
                    dataRow.appendChild(dataCol)
                }

                tbody.appendChild(dataRow)

            }

        }

        else if (type == "MI") {

            const form = document.createElement("form")

            Array.from(Array(3)).forEach((x, i) => {

                const dataRow = document.createElement('tr')

                for (let attribute of attributes) {
                    const dataCol = document.createElement('td')
                    const input = document.createElement('input')
                    input.setAttribute("type", "text")
                    input.setAttribute("name", `${attribute + i}`)
                    input.setAttribute("id", `${attribute + i}`)
                    input.classList.add("tableInput")
                    dataCol.appendChild(input)
                    dataRow.appendChild(dataCol)
                }

                tbody.appendChild(dataRow)

            })

        }

        const table = document.querySelector(`#table${type}_${idName}`)
        table.appendChild(tbody)

    }

    // calculates the resulting table after a natural join of two tables 
    function natrualJoinTables(table1, table2, answerTable) {

        const attr1 = table1["attributes"]
        const attr2 = table2["attributes"]
        const data1 = table1["data"]
        const data2 = table2["data"]

        let attrAfterJoin = new Set()
        for (let attr of attr1) attrAfterJoin.add(attr)
        for (let attr of attr2) attrAfterJoin.add(attr)
        attrAfterJoin = Array.from(attrAfterJoin)

        let commonAttr = []
        commonAttr = attr1.filter(attr => attr2.includes(attr))

        let dataAfterJoin = []

        // for each row in table1
        data1.forEach((value1, index1) => {

            let attrStr1 = ""
            commonAttr.forEach(value => attrStr1 += `${value1[value]},`)

            // for each row in table2
            data2.forEach((value2, index2) => {

                let attrStr2 = ""
                commonAttr.forEach(value => attrStr2 += `${value2[value]},`)

                // comparing the two strings which contain a string version (value,value) of the common attributes
                // if equal, there is a match and we need to insert this new row 
                if (attrStr1 == attrStr2) {

                    let newRow = new Object()
                    attr1.forEach(attr => newRow[attr] = value1[attr])
                    attr2.forEach(attr => {
                        // add to newRow if it's not already in it, or if there wasn't any common attr (in this case, it's just cross join)
                        if (!(attr in newRow) || commonAttr.length == 0) newRow[attr] = value2[attr]
                    })
                    dataAfterJoin.push(newRow)

                }

            })

        })

        answerTable["attributes"] = attrAfterJoin
        answerTable["data"] = dataAfterJoin

    }

    /* End of private properties/functions */

    SQL101.prototype = {

        // the main functions that will be used for animations
        animationClosure: function (attributeSet, FDSet, speed) {

            animationSpeed = speed

            let closureArr = [] // the array that will store the closures 
            splitFD(FDSet) // splits the RHS of FDs if necessary 

            displayInput(attributeSet, FDSet)
            displayAlgorithm("Closure")

            // first compute the algorithm and store all information before showing animation
            findClosure(attributeSet, FDSet, closureArr, speed)

        },

        animationNaturalJoin: function (table1, table2) {

            let answerTable = {}
            natrualJoinTables(table1, table2, answerTable)

            createTable(table1, "MC", "Join1")
            createTable(table2, "MC", "Join2")
            createTable(answerTable, "MC", "Join3")
            
        },

        // the quiz where the user has to make an instance to violate for example a set of FDs
        createMakeInstanceQuiz: function (problems, table) {
            createAnswerDiv(problems, "MI", table)
            createTable(table, "MI", "MI")
        },

        // the quiz where the user has to make a choice for MC questions 
        createMCQuiz: function (problems, table) {
            createAnswerDiv(problems, "MC", table)
            createTable(table, "MC", "MC")
        },

    }

    // After setup:
    // Add the CircleGenerator to the window object if it doesn't already exist.
    global.SQL101 = global.SQL101 || SQL101

})(window, window.document) // pass the global window object and jquery to the anonymous function. They will now be locally scoped inside of the function.