let alphabet: string[] = []

let machine = new Machine(alphabet)

const ui = {
    alphabet: <HTMLInputElement> document.getElementById("alphabet"),
    transitions: <HTMLTableElement> document.getElementById("transitions"),
    newState: <HTMLInputElement> document.getElementById("new-state"),
    tape: <HTMLDivElement> document.getElementById("tape"),
    state: <HTMLDivElement> document.getElementById("state"),
    templates: {
        transition: <HTMLTemplateElement> document.getElementById("transition-t"),
        state: <HTMLTemplateElement> document.getElementById("state-t")
    },
    control: {
        step: <HTMLInputElement> document.getElementById("ctl-step"),
        run: <HTMLInputElement> document.getElementById("ctl-run"),
        stop: <HTMLInputElement> document.getElementById("ctl-stop"),
        edit: <HTMLInputElement> document.getElementById("ctl-edit"),
        reset: <HTMLInputElement> document.getElementById("ctl-reset"),
    }
}

function updateAlphabet() {
    alphabet = [... ui.alphabet.value]
    alphabet.push(Blank)
    const thead = ui.transitions.getElementsByTagName("thead")[0].getElementsByTagName("tr")[0]
    for (let i = thead.children.length - 1; i >= 1; i--) {
        thead.removeChild(thead.children[i])
    }
    alphabet.forEach(s => {
        const th = document.createElement("th")
        th.textContent = s
        thead.appendChild(th)
    })
    console.dir(alphabet)
}
updateAlphabet()
ui.alphabet.onchange = updateAlphabet

function updateTransitionCell(cell: HTMLElement, transition?: Transition) {
    const write = cell.getElementsByClassName("write")[0]
    while (write.children.length > alphabet.length) {
        write.removeChild(write.lastChild)
    }
    while (write.children.length < alphabet.length) {
        const option = document.createElement("option")
        option.value = write.children.length.toString()
        write.appendChild(option)
    }
    alphabet.forEach((s, i) => {
        const option = <HTMLOptionElement> write.children[i]
        option.textContent = s
        if (transition != undefined && s === transition.write) {
            option.selected = true
        }
    })
    const dir = <HTMLSelectElement> cell.getElementsByClassName("dir")[0]
    if (transition != undefined) {
        dir.value = transition.direction
    }
    const next = <HTMLSelectElement> cell.getElementsByClassName("next")[0]
    const nextv = transition !== undefined ? transition.next.toString() : next.value
    while (next.children.length > machine.states.length + 2) {
        next.removeChild(next.lastChild)
    }
    while (next.children.length < machine.states.length + 2) {
        const option = document.createElement("option")
        next.appendChild(option)
    }
    machine.states.forEach((s, i) => {
        const option = <HTMLOptionElement> next.children[i]
        option.textContent = s.name
        option.value = i.toString()
    })
    next.children[machine.states.length].textContent = "yes"
    ;(<HTMLOptionElement> next.children[machine.states.length]).value = "y"
    next.children[machine.states.length + 1].textContent = "no"
    ;(<HTMLOptionElement> next.children[machine.states.length + 1]).value = "n"
    next.value = nextv
}

function createTransitionCell(symbol: Sym): [Transition, Element] {
    const frag = <DocumentFragment> ui.templates.transition.content.cloneNode(true)
    const elem = <HTMLElement> frag.children[0]
    const transition: Transition = {
        write: symbol,
        direction: "r",
        next: "n"
    }
    updateTransitionCell(elem, transition)
    ;(<HTMLSelectElement> elem.getElementsByClassName("write")[0]).onchange = e => {
        transition.write = alphabet[Number((<HTMLSelectElement> e.target).value)]
    }
    ;(<HTMLSelectElement> elem.getElementsByClassName("dir")[0]).onchange = e => {
        transition.direction = <Direction> (<HTMLSelectElement> e.target).value
    }
    ;(<HTMLSelectElement> elem.getElementsByClassName("next")[0]).onchange = e => {
        const v = (<HTMLSelectElement> e.target).value
        if(v === "y" || v === "n") {
            transition.next = v
        } else {
            transition.next = Number(v)
        }
    }
    return [transition, elem]
}

function createStateRow(): [State, Element] {
    const frag = <DocumentFragment> ui.templates.state.content.cloneNode(true)
    const row = frag.children[0]
    const transitions: TransitionMap = {}
    alphabet.forEach((s, i) => {
        const [trans, cell] = createTransitionCell(s)
        row.appendChild(cell)
        transitions[s] = trans
    })
    const state = {
        name: `state${machine.states.length}`,
        transitions
    }
    const name = <HTMLInputElement> row.getElementsByClassName("state-name")[0]
    name.value = state.name
    name.onchange = e => {
        state.name = name.value
        updateTransitions()
    }
    return [state, row]
}

function updateTransitions() {
    Array.from(ui.transitions.getElementsByClassName("transition"))
        .forEach(c => updateTransitionCell(<HTMLElement> c))
}

ui.newState.onclick = e => {
    const [state, row] = createStateRow()
    ui.transitions.appendChild(row)
    machine.states.push(state)
    updateTransitions()
}

function updateState() {
    if (typeof machine.state === "number") {
        ui.state.textContent = machine.states[machine.state].name
    } else {
        ui.state.textContent = { y: "yes", n: "no" }[machine.state]
    }
}

function step() {
    machine.step()
    updateTape()
    updateState()
}

function updateTape(head: number = machine.head) {
    const tapeLength = Math.max(head + 1, machine.tape.length)
    while (ui.tape.children.length > tapeLength) {
        ui.tape.removeChild(ui.tape.lastChild)
    }
    while (ui.tape.children.length < tapeLength) {
        const div = document.createElement("div")
        ui.tape.appendChild(div)
    }
    for (let i = 0; i < tapeLength; i++) {
        ui.tape.children[i].textContent = machine.readTape(i)
    }
    Array.from(ui.tape.getElementsByClassName("head"))
        .forEach(e => e.classList.remove("head"))
    ui.tape.children[head].classList.add("head")
}

function editTape() {
    const res = window.prompt("Input tape contents", machine.tape.join(""))
    const alph = new Set(alphabet)
    const tape = Array.from(res).filter(s => alph.has(s))
    if(tape[tape.length - 1] !== Blank) {
        tape.push(Blank)
    }
    machine.tape = tape
    updateTape()
}

function resetMachine() {
    machine.reset()
    updateTape()
    updateState()
}

let runTimer: number = undefined

function stop() {
    if(runTimer !== undefined) {
        window.clearInterval(runTimer)
        runTimer = undefined
    }
    ui.control.run.disabled = false
    ui.control.stop.disabled = true
}

function run() {
    stop()
    runTimer = window.setInterval(() => {
        step()
    }, 1000)
    ui.control.run.disabled = true
    ui.control.stop.disabled = false
}

ui.control.step.onclick = step
ui.control.run.onclick = run
ui.control.stop.onclick = stop
ui.control.edit.onclick = editTape
ui.control.reset.onclick = resetMachine
