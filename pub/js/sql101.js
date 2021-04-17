(function (global, document) {

    // this function is currently only in the scope of the anonymous function at the moment.
    function SQL101() {

        // global speed variable, used for adjusting the speed of the animations
        this.animationSpeed = 0
        // contains all the animations 
        // [[], [{}, {}], [{}]]
        // outer array is the animationArr
        // each animation "step" will be an array of animationObj's
        this.animationArr = []
        // used to temporary store the animations of one "step"
        // may store one more animation depending on how many animations should happen at once 
        this.arrayToPush = []
        // stores the details of an animation
        // "element": the document element that will display the animation 
        // "animation_name": animation name, animation speed, etc.
        // "animation_event": the animation onEnded function that should be called, could be no if no callback function is needed 
        // let animationObj, this is declared later for individual obj since I realized the each obj pushed into array is by reference 
        // contains all elements that currently in the middle of an animation
        this.animatingArr = []
        // holds the index of animationArr that current animation "step" is on 
        this.animationIndex = 0
        // true if animation is paused, false if animation is running 
        this.animationPaused = true
        // true if the animation is to be stepped through one by one, instead of playing it all
        this.animationStep = false

        // used for the MC quiz to know which current question we are on 
        this.quizIndex = 0
        // used for the quiz maker with options "marks", used to keep track of how many correct the user has scored 
        this.totalCorrect = 0
        // used for the quiz maker with options "time", used to keep track of when the user started the quiz
        this.startTime = undefined
        // used for the quiz maker with options "time", used to keep track of the interval function that is needed to pass into clearInterval
        this.intervalFunc = undefined

    }

    /* Private properties and functions */
    // unless we attach these to the global window object, they cannot be accessed directly.
    // they will only be in the closure of this function, and can be accessed only the places we use them (such as in the functions of the CircleGenerator prototype)
    // (see examples.js for what we can and cannot access)

    /* End of private properties/functions */

    SQL101.prototype = {
        // the helper functions for animationClosure

        // splitting the RHS of the FD's if necessary
        // param: FDSet -> an array of FD's in the form LHS->RHS
        // return: the newly split FDSet 
        splitFD: function (FDSet) {

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

        },

        displayFDSet: function (FDSet, idName) {

            const inputDiv = document.querySelector(`#inputDiv_${idName}`)
            const FDSetDiv = document.createElement('div')
            FDSetDiv.id = `FDSetDiv_${idName}`

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

        },

        displayAttributeSet: function (attributeSet, idName) {

            const inputDiv = document.querySelector(`#inputDiv_${idName}`)
            const attributeSetDiv = document.createElement('div')
            attributeSetDiv.id = `attributeSetDiv_${idName}`

            attributeSetDiv.innerHTML = `<h3>We want to find the closure for ${attributeSet}.</h3><span>${attributeSet}<sup>+</sup> = </span>`
            inputDiv.appendChild(attributeSetDiv)

        },

        // finds the closure for the given input
        // param: FDSet -> an array of FD's in the form LHS->RHS
        //        attributeSet -> a string for which you want to find the closure for
        //        closureArr -> initially empty, used to store the closure for attributeSet
        // return: the closure for attributeSet
        findClosure: async function (attributeSet, FDSet, closureArr, speed, idName) {

            // indicates whether an FD has been successfully checked or not
            const doneArr = Array(FDSet.length).fill(false)

            // initialize Y+ to Y
            const originalAttr = attributeSet.split('')
            originalAttr.forEach(attr => {
                closureArr.push(attr)
            })

            const attributeSetDiv = document.querySelector(`#attributeSetDiv_${idName}`)

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
                    "animation_event": (e) => this.fadeAnimationEnd(e)
                }
                this.arrayToPush.push(animationObj)
            })
            this.pushAnimationToArr()

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
                            "animation_event": (e) => this.fadeAnimationEnd(e)
                        }
                        this.arrayToPush.push(animationObjMove)
                        this.pushAnimationToArr()

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
                                    "animation_event": (e) => this.fadeAnimationEnd(e)
                                }
                                this.arrayToPush.push(animationObj)

                            }

                            const matchFD = document.querySelector(`#FDListLHS${count}`)
                            let animationObjLHS = {
                                "element": matchFD,
                                "animation_name": `fadeIn speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObjLHS)
                            this.pushAnimationToArr()

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
                                    const attributeSetDiv = document.querySelector(`#attributeSetDiv_${idName}`)
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
                                    "animation_event": (e) => this.fadeAnimationEnd(e)
                                }
                                this.arrayToPush.push(animationObj)

                            }

                            const RHSNewlyAdded = document.querySelector(`#FDListRHS${count}`)
                            let animationObjRHS = {
                                "element": RHSNewlyAdded,
                                "animation_name": `${animationRepeated} speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObjRHS)
                            this.pushAnimationToArr()

                        }

                        else {

                            const unMatchFD = document.querySelector(`#FDListLHS${count}`)
                            let animationObj = {
                                "element": unMatchFD,
                                "animation_name": `fadeInErr speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)
                            this.pushAnimationToArr()

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
                            "animation_event": (e) => this.fadeAnimationEnd(e)
                        }
                        this.arrayToPush.push(animationObjRev)
                        this.pushAnimationToArr()

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

        },

        // timer function used to block code for "duration", used with await
        // function timer(duration) {
        //     return new Promise(res => setTimeout(res, duration))
        // }

        // callback function used with events for when the animations end 
        fadeAnimationEnd: function (e) {

            e.target.style.opacity = 1 // want to show closures after each animation "step", no need to hide it anymore 
            // want to keep the last animation (FD going back), but don't keep for tables (natural join animations)
            if (!e.target.id.includes("table") && this.animationIndex == this.animationArr.length) {
                this.animatingArr = []
                return
            }

            // after fadeIn has done, you want to fadeOut
            if (e.animationName == "fadeIn") {
                setTimeout(() => {
                    e.target.style.animation = `fadeOut ${this.animationSpeed}ms linear forwards`
                }, this.animationSpeed)
            }

            else if (e.animationName == "fadeInErr") {
                setTimeout(() => {
                    e.target.style.animation = `fadeOutErr ${this.animationSpeed}ms linear forwards`
                }, this.animationSpeed)
            }

            else if (e.animationName == "fadeInInfo") {
                setTimeout(() => {
                    e.target.style.animation = `fadeOutInfo ${this.animationSpeed}ms linear forwards`
                }, this.animationSpeed)
            }

            else if (e.animationName == "fadeInHeader") {
                setTimeout(() => {
                    e.target.style.animation = `fadeOutHeader ${this.animationSpeed}ms linear forwards`
                }, this.animationSpeed)
            }

            else if (e.animationName == "fadeInErrHeader") {
                setTimeout(() => {
                    e.target.style.animation = `fadeOutErrHeader ${this.animationSpeed}ms linear forwards`
                }, this.animationSpeed)
            }

            else if (e.animationName == "moveFD") {
                e.target.removeEventListener("webkitAnimationEnd", this.fadeAnimationend) // remove event listener to avoid duplicates
                this.animatingArr.splice(this.animatingArr.indexOf(e.target), 1) // since animation is done, remove from animatingArr
                if (this.animatingArr.length == 0 && !this.animationStep) { // if this animation "step" is done, move on to the next step
                    // animationIndex++    
                    setTimeout(() => this.doAnimation(), this.animationSpeed)
                }
            }

            // only remove fadeOut class when you're done fading out 
            else {
                e.target.style.animation = ""
                e.target.removeEventListener("webkitAnimationEnd", this.fadeAnimationend)
                this.animatingArr.splice(this.animatingArr.indexOf(e.target), 1)
                if (this.animatingArr.length == 0 && !this.animationStep) {
                    // animationIndex++
                    setTimeout(() => this.doAnimation(), this.animationSpeed)
                }
            }

        },

        displayAlgorithm: function (algorithm, idName) {

            const algorithmDiv = document.createElement('div')
            algorithmDiv.id = `algorithmDiv_${idName}`
            const algo = `
        <h3 class='algorithm'>attribute_closure(Y, S):</h3>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;initialize Y+ to Y</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;split RHS's of FDs if necessary</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;repeat until no more changes occur:</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;If there is an FD LHS -> RHS in S such that LHS is in Y+:</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Add RHS to Y+</p>
        <p class='algorithm'>&nbsp;&nbsp;&nbsp;&nbsp;return Y+</p>
    `
            const canvas = document.querySelector(`#canvas_${idName}`)
            algorithmDiv.innerHTML = algo
            canvas.appendChild(algorithmDiv)

        },

        displayInput: function (attributeSet, FDSet, type, idName) {

            const inputDiv = document.createElement('div')
            const buttonsDiv = document.createElement('div')

            const speedUpButton = document.createElement('button')
            const speedDownButton = document.createElement('button')
            const pauseButton = document.createElement('button')
            const nextStepButton = document.createElement('button')
            const prevButton = document.createElement('button')

            const canvas = document.querySelector(`#canvas_${idName}`)

            inputDiv.id = `inputDiv_${idName}`
            buttonsDiv.id = `buttonsDiv_${idName}`

            speedUpButton.id = `speedUpButton_${idName}`
            speedDownButton.id = `speedDownButton_${idName}`
            pauseButton.id = `pauseButton_${idName}`
            nextStepButton.id = `nextStepButton_${idName}`
            prevButton.id = `prevButton_${idName}`

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

            // hiding the play all button 
            pauseButton.style.display = "none"

            speedUpButton.onclick = () => { this.changeSpeed("faster") }
            speedDownButton.onclick = () => { this.changeSpeed("slower") }
            pauseButton.onclick = () => { this.toggleAnimationPause(idName) }
            nextStepButton.onclick = () => { this.nextAnimation(type, idName) }
            prevButton.onclick = () => { this.prevAnimation() }

            buttonsDiv.appendChild(speedUpButton)
            buttonsDiv.appendChild(speedDownButton)
            buttonsDiv.appendChild(pauseButton)
            buttonsDiv.appendChild(nextStepButton)
            // buttonsDiv.appendChild(prevButton)
            inputDiv.appendChild(buttonsDiv)
            canvas.appendChild(inputDiv)

            if (type == "Closure") {
                this.displayAttributeSet(attributeSet, idName)
                this.displayFDSet(FDSet, idName)
            }

        },

        changeSpeed: function (option) {
            if (option == "faster") this.animationSpeed /= 1.25
            else this.animationSpeed *= 1.25
        },

        // adds an animation "step" to the global animationArr
        pushAnimationToArr: function () {
            this.animationArr.push(this.arrayToPush)
            this.arrayToPush = []
        },

        // toggles between the animation been played or paused 
        toggleAnimationPause: function (idName) {

            const nextStepButton = document.querySelector(`#nextStepButton_${idName}`)
            nextStepButton.disabled = true

            const pausedButton = document.querySelector(`#pauseButton_${idName}`)

            if (this.animationPaused) {
                for (let animation of this.animatingArr) {
                    animation.style.animationPlayState = "running"
                }
                pausedButton.innerHTML = "Pause"
                this.animationPaused = false
                if (this.animatingArr.length == 0) this.doAnimation() // used for the very start 
            }

            else {
                for (let animation of this.animatingArr) {
                    animation.style.animationPlayState = "paused"
                }
                pausedButton.innerHTML = "Resume"
                this.animationPaused = true
            }

        },

        nextAnimation: function (type, idName) {

            if (this.animatingArr.length != 0) return // can't proceed until animations have finished
            const pauseButton = document.querySelector(`#pauseButton_${idName}`)
            pauseButton.disabled = true
            // animatingArr.splice(0, animatingArr.length)
            // animationIndex++
            this.animationStep = true

            const nextStepButton = document.querySelector(`#nextStepButton_${idName}`)

            if (this.animationIndex == this.animationArr.length - 1) nextStepButton.innerHTML = "Replay"
            // to replay the animations, go back and hide every output again
            else if (this.animationIndex == this.animationArr.length) {

                nextStepButton.innerHTML = "Next Step"
                this.animationIndex = 0

                if (type.includes("Closure")) {
                    let count = 0
                    while (document.querySelector(`#closure${count}`)) {
                        const closure = document.querySelector(`#closure${count}`)
                        closure.style.opacity = 0
                        count++
                    }
                }

                else if (type.includes("CrossJoin")) {
                    const tbody = document.querySelector("#tbody_CJ3")
                    for (let row of tbody.children) {
                        for (let child of row.children) if (child.tagName == "TD") child.style.opacity = 0
                    }
                }

                else if (type.includes("NaturalJoin")) {
                    const tbody = document.querySelector("#tbody_NJ3")
                    for (let row of tbody.children) {
                        for (let child of row.children) if (child.tagName == "TD") child.style.opacity = 0
                    }
                }

                return
                
            }

            this.doAnimation()
        },

        prevAnimation: function () {
            if (this.animatingArr.length != 0) return
            // animatingArr.splice(0, animatingArr.length)
            this.animationIndex--
            this.doAnimation()
        },

        doAnimation: function () {

            if (this.animationPaused && !this.animationStep) return

            if (this.animationIndex < this.animationArr.length) {

                let animations = this.animationArr[this.animationIndex]

                for (let animation of animations) {

                    if ('animation_name' in animation) {
                        animation["element"].style.animation = animation["animation_name"].replace("speed", `${this.animationSpeed}`)
                        this.animatingArr.push(animation["element"])
                        animation["element"].addEventListener("webkitAnimationEnd", animation["animation_event"])
                    }

                }

                this.animationIndex++

            }

        },

        // creates the answering part of the quiz maker 
        createAnswerDiv: function (problems, type, table, idName, options) {

            const answerDiv = document.createElement('div')
            answerDiv.id = `answerDiv_${idName}`

            const instructionsDiv = document.createElement('div')
            instructionsDiv.innerHTML = "<h3>Please choose the best answer for each question.</h3>"
            instructionsDiv.id = `instructionsDiv_${idName}`

            const questionDiv = document.createElement('div')
            questionDiv.innerHTML = `<p>${problems[this.quizIndex]["question"]}</p>`
            questionDiv.id = `questionDiv_${idName}`

            const answeringForm = document.createElement('form')
            answeringForm.id = `answeringForm_${idName}`

            if (type == "MC") {
                for (let choice of problems[this.quizIndex]["choices"]) {

                    const inputElement = document.createElement('input')
                    inputElement.type = "radio"
                    inputElement.value = choice
                    inputElement.id = choice + idName
                    inputElement.name = "choice"

                    const labelElement = document.createElement('label')
                    labelElement.setAttribute("for", choice + idName)
                    labelElement.innerHTML = `${choice}`

                    const breakLine = document.createElement("br")

                    // don't display the choices if "time", need to first press the start button 
                    if (options.includes("time")) {
                        inputElement.style.display = "none"
                        labelElement.style.display = "none"
                        breakLine.style.display = "none"
                    }

                    answeringForm.appendChild(inputElement)
                    answeringForm.appendChild(labelElement)
                    answeringForm.appendChild(breakLine)

                }
            }

            const submitButton = document.createElement('button')
            submitButton.id = `submitButton_${idName}`
            submitButton.innerHTML = "Submit"
            submitButton.type = "button"
            submitButton.classList.add(`button_${idName}`)
            if (type == "MC") submitButton.onclick = () => { this.checkAnswer(problems[this.quizIndex]["answer"], idName, options) }
            else if (type == "MI") submitButton.onclick = () => { this.checkAnswerMI(problems[this.quizIndex]["FDSet"], table["attributes"], idName) }

            const prevButton = document.createElement('button')
            prevButton.id = `prevButton_${idName}`
            prevButton.innerHTML = "Prev"
            prevButton.type = "button"
            prevButton.classList.add(`button_${idName}`)
            prevButton.onclick = () => { this.prevQuestion(problems, type, table["attributes"], idName, options) }
            prevButton.style.display = "none"

            const nextButton = document.createElement('button')
            nextButton.id = `nextButton_${idName}`
            nextButton.innerHTML = "Next"
            nextButton.type = "button"
            nextButton.classList.add(`button_${idName}`)
            nextButton.onclick = () => { this.nextQuestion(problems, type, table["attributes"], idName, options) }
            if (options.includes("marks") || options.includes("time")) nextButton.style.display = "none" // display only the submit button for each question for quiz with "marks"

            const startButton = document.createElement('button')
            startButton.id = `startButton_${idName}`
            startButton.innerHTML = "Start"
            startButton.type = "button"
            startButton.classList.add(`button_${idName}`)
            startButton.onclick = () => { this.startQuiz(problems, type, table["attributes"], idName, options) }

            const timeElapsed = document.createElement('p')
            timeElapsed.id = `timeElapsed_${idName}`
            timeElapsed.innerHTML = "00:00:00"
            timeElapsed.style.display = "none"

            const feedbackDiv = document.createElement('div')
            feedbackDiv.id = `feedbackDiv_${idName}`

            answeringForm.appendChild(submitButton)
            answeringForm.appendChild(prevButton)
            answeringForm.appendChild(nextButton)
            answeringForm.appendChild(startButton)
            answeringForm.appendChild(timeElapsed)
            answerDiv.appendChild(instructionsDiv)
            answerDiv.appendChild(questionDiv)
            answerDiv.appendChild(answeringForm)
            answerDiv.appendChild(feedbackDiv)

            const canvas = document.querySelector(`#canvas_${idName}`)
            canvas.appendChild(answerDiv)

            if (options.includes("time")) {
                questionDiv.style.display = "none"
                submitButton.style.display = "none"
            }

            else if (!options.includes("time")) startButton.style.display = "none"

        },

        // onClick function for the "Start" button, used for "time" options
        startQuiz: function (problems, type, attr, idName, options) {

            if (!options.includes("marks")) {
                const nextButton = document.querySelector(`#nextButton_${idName}`)
                nextButton.style.display = "inline-block"
            }

            const questionDiv = document.querySelector(`#questionDiv_${idName}`)
            questionDiv.style.display = "block"

            const answeringForm = document.querySelector(`#answeringForm_${idName}`)

            // displaying the choices for the answers
            for (let child of answeringForm.children) {
                if (child.tagName == "BR") child.style.display = "block"
                else if (child.tagName == "INPUT" || child.tagName == "LABEL") child.style.display = "inline-block"
            }

            const submitButton = document.querySelector(`#submitButton_${idName}`)
            const startButton = document.querySelector(`#startButton_${idName}`)
            submitButton.style.display = "inline-block"
            startButton.style.display = "none"

            const timeElapsed = document.querySelector(`#timeElapsed_${idName}`)
            timeElapsed.style.display = "inline-block"

            this.startTimer(idName)

        },

        startTimer: function (idName) {
            this.startTime = Date.now()
            this.intervalFunc = setInterval(() => { this.updateTime(idName) }, 10)
        },

        updateTime: function (idName) {

            const elapsedTime = Date.now() - this.startTime
            const timeElapsed = document.querySelector(`#timeElapsed_${idName}`)

            // below time to string conversion obtained from https://tinloof.com/blog/how-to-build-a-stopwatch-with-html-css-js-react-part-2/
            let diffInHrs = elapsedTime / 3600000;
            let hh = Math.floor(diffInHrs);

            let diffInMin = (diffInHrs - hh) * 60;
            let mm = Math.floor(diffInMin);

            let diffInSec = (diffInMin - mm) * 60;
            let ss = Math.floor(diffInSec);

            let diffInMs = (diffInSec - ss) * 100;
            let ms = Math.floor(diffInMs);

            let formattedMM = mm.toString().padStart(2, "0");
            let formattedSS = ss.toString().padStart(2, "0");
            let formattedMS = ms.toString().padStart(2, "0");

            timeElapsed.innerHTML = `${formattedMM}:${formattedSS}:${formattedMS}`;

        },

        nextQuestion: function (problems, type, attr, idName, options) {

            // display the prev button if you're pressing next on the very first question 
            // can't go to prev button in performance measuring mode 
            if (this.quizIndex == 0 && !options.includes("marks")) {
                const prevButton = document.querySelector(`#prevButton_${idName}`)
                prevButton.style.display = "inline-block"
            }

            this.quizIndex++

            // if at the final question and you've submitted and you're pressing next, show the results of the quiz 
            if (options.includes("marks") && this.quizIndex == problems.length) {
                this.showMarks(problems.length, idName)
                if (options.includes("time")) clearInterval(this.intervalFunc)
                return
            }

            // when user is pressing the "try again" button, resets everything 
            else if (options.includes("marks") && this.quizIndex == problems.length + 1) {
                this.quizIndex = 0
                this.totalCorrect = 0
                const nextButton = document.querySelector(`#nextButton_${idName}`)
                nextButton.innerHTML = "Next"
                if (options.includes("time")) {
                    const timeElapsed = document.querySelector(`#timeElapsed_${idName}`)
                    timeElapsed.innerHTML = "00:00:00"
                    this.startTimer(idName)
                }
            }

            // if got to very last question, don't display the next button
            else if (this.quizIndex == problems.length - 1) {
                const nextButton = document.querySelector(`#nextButton_${idName}`)
                nextButton.style.display = "none"
            }

            this.changeQuestion(problems, type, attr, idName, options)

            // clear the feedback when switching questions 
            const feedbackDiv = document.querySelector(`#feedbackDiv_${idName}`)
            feedbackDiv.className = ''
            feedbackDiv.innerHTML = ""

        },

        prevQuestion: function (problems, type, attr, idName, options) {
            // display the prev button if you're pressing prev on the very last question 
            if (this.quizIndex == problems.length - 1) {
                const nextButton = document.querySelector(`#nextButton_${idName}`)
                nextButton.style.display = "inline-block"
            }

            this.quizIndex--
            this.changeQuestion(problems, type, attr, idName, options)
            // clear the feedback when switching questions 
            const feedbackDiv = document.querySelector(`#feedbackDiv_${idName}`)
            feedbackDiv.className = ''
            feedbackDiv.innerHTML = ""

            // if got to very first question, don't display the prev button
            if (this.quizIndex == 0) {
                const prevButton = document.querySelector(`#prevButton_${idName}`)
                prevButton.style.display = "none"
            }
        },

        changeQuestion: function (problems, type, attr, idName, options) {

            const questionDiv = document.querySelector(`#questionDiv_${idName}`)
            questionDiv.innerHTML = `<p>${problems[this.quizIndex]["question"]}</p>`

            if (type == "MC") {

                const answeringForm = document.querySelector(`#answeringForm_${idName}`)

                let count = 0
                for (let choice of problems[this.quizIndex]["choices"]) {

                    const inputElement = document.createElement('input')
                    inputElement.type = "radio"
                    inputElement.value = choice
                    inputElement.id = choice + idName
                    inputElement.name = "choice"

                    const labelElement = document.createElement('label')
                    labelElement.setAttribute("for", choice + idName)
                    labelElement.innerHTML = `${choice}`

                    // need to replace the prev children that were already there 
                    answeringForm.replaceChild(inputElement, answeringForm.childNodes[count++])
                    answeringForm.replaceChild(labelElement, answeringForm.childNodes[count++])
                    count++ // to skip the <br> element

                }

                // when switching to new question, reset to submit button 
                if (options.includes("marks")) {
                    const nextButton = document.querySelector(`#nextButton_${idName}`)
                    nextButton.style.display = "none"
                    const submitButton = document.querySelector(`#submitButton_${idName}`)
                    submitButton.style.display = "inline-block"
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

        },

        // used at the end of the quiz maker with performance 
        showMarks: function (length, idName) {

            const percentage = parseInt(this.totalCorrect / length * 100)
            const feedbackDiv = document.querySelector(`#feedbackDiv_${idName}`)

            if (percentage < 50) {
                feedbackDiv.innerHTML = `Your score was ${percentage}%... Try harder next time!`
                feedbackDiv.classList.remove('feedback-correct')
                feedbackDiv.classList.add('feedback-incorrect')
            }

            else {
                feedbackDiv.innerHTML = `Your score was ${percentage}%. Great job!`
                feedbackDiv.classList.remove('feedback-incorrect')
                feedbackDiv.classList.add('feedback-correct')
            }

            const nextButton = document.querySelector(`#nextButton_${idName}`)
            nextButton.innerHTML = "Try Again"

        },

        // check to see if the given answer is right or wrong for MC
        checkAnswer: function (answer, idName, options) {

            const answeringForm = document.querySelector(`#answeringForm_${idName}`)
            const data = Object.fromEntries(new FormData(answeringForm).entries())
            const feedbackDiv = document.querySelector(`#feedbackDiv_${idName}`)

            // if no answer was given
            if (Object.keys(data).length == 0) {
                feedbackDiv.innerHTML = "Please answer the question above!"
                feedbackDiv.classList.remove('feedback-correct')
                feedbackDiv.classList.add('feedback-incorrect')
                return
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
                this.totalCorrect++
            }

            if (options.includes("marks")) {

                // disables the radio inputs once the user has submitted an answer
                for (let child of answeringForm.children) {
                    if (child.tagName == "INPUT") child.disabled = true
                }

                const nextButton = document.querySelector(`#nextButton_${idName}`)
                nextButton.style.display = "inline-block"
                const submitButton = document.querySelector(`#submitButton_${idName}`)
                submitButton.style.display = "none"

            }

        },

        // check to see if the given answer is right or wrong for MI
        checkAnswerMI: function (FDSet, attributes, idName) {

            // will contain all the form values in an obj
            // the key is the attr + row number (A1, B2), the value will be the value from the table
            const formValues = new Object()
            // will be false if any input is empty 
            let validAnswer = true

            const feedbackDiv = document.querySelector(`#feedbackDiv_${idName}`)

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

        },

        createTable: function (table, type, idName) {

            this.makeTable(type, idName)
            this.makeHeadings(table["attributes"], type, idName)
            this.makeData(table["attributes"], table["data"], type, idName)

        },

        makeTable: function (type, idName) {

            const table = document.createElement('table')
            table.id = `table${type}_${idName}`

            const tableDiv = document.createElement('div')
            tableDiv.id = `tableDiv${type}_${idName}`

            const canvas = document.querySelector(`#canvas_${idName}`)
            tableDiv.appendChild(table)
            canvas.appendChild(tableDiv)

        },

        makeHeadings: function (attributes, type, idName) {

            const thead = document.createElement('thead')
            const headingRow = document.createElement('tr')

            for (let attribute of attributes) {
                const headingCol = document.createElement('th')
                headingCol.innerHTML = attribute
                if (type.includes("NJ") || type.includes("CJ")) headingCol.id = `tableHeader${attribute}_${type}`
                else headingCol.id = `tableHeader${attribute}_${idName}`
                headingRow.appendChild(headingCol)
            }

            const table = document.querySelector(`#table${type}_${idName}`)
            thead.appendChild(headingRow)
            table.appendChild(thead)

        },

        // adds row to the passed in tbody, used for animating joining tables 
        // need to do this because the cell values should be hidden, but still need it to be in the DOM
        addRowToTable: function (tbody, row, attributes, idName, index) {

            const dataRow = document.createElement('tr')

            for (let attribute of attributes) {
                const dataCol = document.createElement('td')
                dataCol.innerHTML = row[attribute]
                dataCol.id = `tableRow${attribute.replace(".", "") + index}_${idName}` // discard the . in the id because querySelector won't work with a period 
                dataCol.style.opacity = 0 // hides the table cells initially 
                dataRow.appendChild(dataCol)
            }

            tbody.appendChild(dataRow)

        },

        // populate the rows of the table
        makeData: function (attributes, data, type, idName) {

            const tbody = document.createElement('tbody')
            if (type.includes("NJ") || type.includes("CJ")) tbody.id = `tbody_${type}`
            else tbody.id = `tbody_${idName}`

            if ((type == "MC" || (type.includes("NJ")) && data) || (type.includes("CJ")) && data) {

                for (let [index, row] of data.entries()) {

                    const dataRow = document.createElement('tr')
                    for (let attribute of attributes) {
                        const dataCol = document.createElement('td')
                        dataCol.innerHTML = row[attribute]
                        if (type.includes("NJ") || type.includes("CJ")) dataCol.id = `tableRow${attribute.replace(".", "") + index}_${type}`
                        else dataCol.id = `tableRow${attribute + index}_${idName}`
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

        },

        // calculates the resulting table after a natural join of two tables 
        joinTables: function (table1, table2, answerTable, type, idName) {

            const attr1 = table1["attributes"]
            const attr2 = table2["attributes"]
            const data1 = table1["data"]
            const data2 = table2["data"]

            let attrAfterJoin
            // for natural joins, we join based on common attributes, so we use a set
            if (type == "NJ") {
                attrAfterJoin = new Set()
                for (let attr of attr1) attrAfterJoin.add(attr)
                for (let attr of attr2) attrAfterJoin.add(attr)
                attrAfterJoin = Array.from(attrAfterJoin)
            }

            // for cross joins, if there is a common attr, need to add Table1. and Table2. in front of the attr 
            else if (type == "CJ") {

                attrAfterJoin = []
                for (let attr of attr1) attrAfterJoin.push(attr)

                for (let attr of attr2) {

                    if (attrAfterJoin.includes(attr)) {

                        // adding Table1. and Table2. in front for attrAfterJoin
                        const index = attrAfterJoin.indexOf(attr)
                        attrAfterJoin[index] = "Table1." + attrAfterJoin[index]
                        attrAfterJoin.push("Table2." + attr)

                        // adding prefixes for the attributes of the "table" parameter
                        const index1 = attr1.indexOf(attr)
                        attr1[index1] = "Table1." + attr1[index1]
                        const index2 = attr2.indexOf(attr)
                        attr2[index2] = "Table2." + attr2[index2]

                        // adding prefixes for the attributes of the "data" parameter
                        for (let dataRow of data1) {
                            dataRow["Table1." + attr] = dataRow[attr]
                            delete dataRow[attr]
                        }

                        for (let dataRow of data2) {
                            dataRow["Table2." + attr] = dataRow[attr]
                            delete dataRow[attr]
                        }

                    }

                    else attrAfterJoin.push(attr)

                }

            }

            answerTable["attributes"] = attrAfterJoin
            this.createTable(answerTable, `${type}3`, idName)
            const tbody = document.querySelector(`#tbody_${type}3`)

            let commonAttr = []
            // there shouldn't be any common attributes for cross joins 
            if (type == "NJ") commonAttr = attr1.filter(attr => attr2.includes(attr))

            let dataAfterJoin = []
            let indexNew = 0 // number of rows for the joined table (Join3), starts at 0 

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

                        // for each row in Join1, need to highlight the common attr and their values on both tables 
                        commonAttr.forEach(attr => {

                            let animationObj = undefined

                            const table1Attr = document.querySelector(`#tableHeader${attr}_${type}1`)
                            animationObj = {
                                "element": table1Attr,
                                "animation_name": `fadeInHeader speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                            const table1Value = document.querySelector(`#tableRow${attr + index1}_${type}1`)
                            animationObj = {
                                "element": table1Value,
                                "animation_name": `fadeIn speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                            const table2Attr = document.querySelector(`#tableHeader${attr}_${type}2`)
                            animationObj = {
                                "element": table2Attr,
                                "animation_name": `fadeInHeader speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                            const table2Value = document.querySelector(`#tableRow${attr + index2}_${type}2`)
                            animationObj = {
                                "element": table2Value,
                                "animation_name": `fadeIn speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                        })

                        // only push if you need to animate the headers of the tables 
                        if (attrStr1 != "") this.pushAnimationToArr()

                        let newRow = new Object()

                        attr1.forEach(attr => {
                            newRow[attr] = value1[attr]
                            attr = attr.slice(-1) // in original tables, the id's of the elements are still just the attribute, no Table1. and Table2. 

                            // animations, highlights the row when joining 
                            const table1Value = document.querySelector(`#tableRow${attr.replace(".", "") + index1}_${type}1`)
                            animationObj = {
                                "element": table1Value,
                                "animation_name": `fadeIn speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)
                        })

                        attr2.forEach(attr => {
                            // add to newRow if it's not already in it, or if there wasn't any common attr (in this case, it's just cross join)
                            if (!(attr in newRow) || commonAttr.length == 0) newRow[attr] = value2[attr]
                            attr = attr.slice(-1) // in original tables, the id's of the elements are still just the attribute, no Table1. and Table2. 

                            // animations, highlights the row when joining 
                            const table2Value = document.querySelector(`#tableRow${attr.replace(".", "") + index2}_${type}2`)
                            animationObj = {
                                "element": table2Value,
                                "animation_name": `fadeIn speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)
                        })

                        dataAfterJoin.push(newRow)
                        this.addRowToTable(tbody, newRow, attrAfterJoin, `${type}3`, indexNew)

                        for (let [key, value] of Object.entries(newRow)) {
                            const table3Value = document.querySelector(`#tableRow${key.replace(".", "") + indexNew}_${type}3`)
                            animationObj = {
                                "element": table3Value,
                                "animation_name": `fadeIn speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)
                        }

                        this.pushAnimationToArr()
                        indexNew++

                    }

                    else {

                        commonAttr.forEach(attr => {

                            let animationObj = undefined

                            const table1Attr = document.querySelector(`#tableHeader${attr}_${type}1`)
                            animationObj = {
                                "element": table1Attr,
                                "animation_name": `fadeInErrHeader speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                            const table1Value = document.querySelector(`#tableRow${attr + index1}_${type}1`)
                            animationObj = {
                                "element": table1Value,
                                "animation_name": `fadeInErr speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                            const table2Attr = document.querySelector(`#tableHeader${attr}_${type}2`)
                            animationObj = {
                                "element": table2Attr,
                                "animation_name": `fadeInErrHeader speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                            const table2Value = document.querySelector(`#tableRow${attr + index2}_${type}2`)
                            animationObj = {
                                "element": table2Value,
                                "animation_name": `fadeInErr speedms linear forwards`,
                                "animation_event": (e) => this.fadeAnimationEnd(e)
                            }
                            this.arrayToPush.push(animationObj)

                        })

                        this.pushAnimationToArr()

                    }

                })

            })

            answerTable["data"] = dataAfterJoin

        },

        // the main functions that will be used for animations
        animationClosure: function (attributeSet, FDSet, speed, idName) {

            this.animationSpeed = speed

            let closureArr = [] // the array that will store the closures 
            this.splitFD(FDSet) // splits the RHS of FDs if necessary 

            this.displayInput(attributeSet, FDSet, "Closure", idName)
            this.displayAlgorithm("Closure", idName)

            // first compute the algorithm and store all information before showing animation
            this.findClosure(attributeSet, FDSet, closureArr, speed, idName)

        },

        animationNaturalJoin: function (table1, table2, speed, idName) {

            this.animationSpeed = speed

            let answerTable = {}

            this.displayInput([], [], "NaturalJoin", idName)
            this.createTable(table1, "NJ1", idName)
            this.createTable(table2, "NJ2", idName)
            this.joinTables(table1, table2, answerTable, "NJ", idName)

        },

        animationCrossJoin: function (table1, table2, speed, idName) {

            this.animationSpeed = speed

            let answerTable = {}

            this.displayInput([], [], "CrossJoin", idName)
            this.createTable(table1, "CJ1", idName)
            this.createTable(table2, "CJ2", idName)
            this.joinTables(table1, table2, answerTable, "CJ", idName)

        },

        // the quiz where the user has to make an instance to violate for example a set of FDs
        createMakeInstanceQuiz: function (problems, table, idName, options) {
            if (!options) options = []
            this.createAnswerDiv(problems, "MI", table, idName, options)
            this.createTable(table, "MI", idName)
        },

        // the quiz where the user has to make a choice for MC questions 
        createMCQuiz: function (problems, table, idName, options) {
            if (!options) options = []
            this.createAnswerDiv(problems, "MC", table, idName, options)
            this.createTable(table, "MC", idName)
        },

    }

    // After setup:
    // Add the CircleGenerator to the window object if it doesn't already exist.
    global.SQL101 = global.SQL101 || SQL101

})(window, window.document) // pass the global window object and jquery to the anonymous function. They will now be locally scoped inside of the function.