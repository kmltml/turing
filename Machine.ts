type Sym = string

type State = {
    name: string,
    transitions: TransitionMap
}

type StateId = number | "y" | "n"

type Direction = "l" | "r"

type Transition = {
    write: Sym,
    direction: Direction,
    next: StateId
}

type TransitionMap = { [symbol: string]: Transition }

const Blank = "\u25A1"

class Machine {

    states: State[] = []
    state: StateId = 0
    tape: Sym[] = []
    head: number = 0

    constructor(public alphabet: Sym[]) {}

    readTape(head: number = this.head) {
        const v = this.tape[head]
        return v === undefined ? Blank : v
    }

    step() {
        if (typeof this.state === "number") {
            const sym = this.readTape()
            const trans = this.states[this.state].transitions[sym]
            this.tape[this.head] = trans.write
            this.head += trans.direction === "l" ? -1 : 1
            this.state = trans.next
        }
    }

    reset() {
        this.state = 0
        this.head = 0
    }

}
