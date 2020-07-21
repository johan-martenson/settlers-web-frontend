import React, { Component } from 'react'
import { GameId, PlayerId, Material, setTransportPriorityForMaterial } from './api'
import { Dialog } from './dialog'
import { getTransportPriorityForPlayer } from './api'
import Button from './button'

interface SetTransportPriorityProps {
    onClose: (() => void)
    gameId: GameId
    playerId: PlayerId
}

interface SetTransportPriorityState {
    priority?: Material[]
    selected?: Material
}

class SetTransportPriority extends Component<SetTransportPriorityProps, SetTransportPriorityState> {

    constructor(props: SetTransportPriorityProps) {
        super(props)

        this.state = {}
    }

    async componentDidMount() {
        const currentPriority = await getTransportPriorityForPlayer(this.props.gameId, this.props.playerId)

        console.log(currentPriority)

        this.setState({ priority: currentPriority })
    }

    onSelect(material: Material): void {
        this.setState({ selected: material })
    }

    render() {
        const selectedMaterial = this.state.selected

        return (
            <Dialog heading="Transport priority" floating onCloseDialog={this.props.onClose}>
                {this.state.priority && this.state.priority.map(
                    (material, index) => {
                        if (this.state.selected && this.state.selected === material) {
                            return (<div key={index}
                                className="SelectedMaterial"
                                onClick={() => this.onSelect(material)}
                            >
                                {material} (selected)
                            </div>)
                        }

                        return (
                            <div key={index}
                                className="Material"
                                onClick={() => this.onSelect(material)}
                            >
                                {material}
                            </div>
                        )
                    }


                )
                }

                {selectedMaterial &&
                    <>
                        <Button label="Up" onButtonClicked={() => this.increasePriority(selectedMaterial)} />
                        <Button label="Down" onButtonClicked={() => this.decreasePriority(selectedMaterial)} />
                    </>
                }

            </Dialog>)

    }

    decreasePriority(selected: Material): void {
        throw new Error("Method not implemented.")
    }

    async increasePriority(selected: Material): Promise<void> {

        if (!this.state.priority) {
            return
        }

        const currentPriority = this.state.priority.findIndex((e) => e === selected)

        if (currentPriority <= 0) {
            return
        }

        await setTransportPriorityForMaterial(this.props.gameId, this.props.playerId, selected, currentPriority - 1)

        let updatedPriority = Object.assign([], this.state.priority)

        delete updatedPriority[currentPriority]

        updatedPriority.splice(currentPriority - 1, 0, selected)

        this.setState({ priority: updatedPriority })
    }
}

export { SetTransportPriority }
