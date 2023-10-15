import React, { Component } from 'react'
import { GameId, PlayerId, Material, setTransportPriorityForMaterial, TOOLS, isTool } from './api'
import { Dialog } from './dialog'
import { getTransportPriorityForPlayer } from './api'
import Button from './button'
import './transport_priority.css'

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

    async componentDidMount(): Promise<void> {
        const currentPriority = await getTransportPriorityForPlayer(this.props.gameId, this.props.playerId)

        console.log(currentPriority)

        this.setState({ priority: currentPriority })
    }

    onSelect(material: Material): void {
        this.setState({ selected: material })
    }

    render(): JSX.Element {
        const selectedMaterial = this.state.selected

        return (
            <Dialog heading="Transport priority" floating onCloseDialog={this.props.onClose}>
                <div className="TransportContainer">
                    <div>
                        {this.state.priority && this.state.priority.map(
                            (material, index) => {
                                if (this.state.selected && this.state.selected === material) {
                                    return <Button key={index} onButtonClicked={() => this.onSelect(material)} selected label={material} />
                                }

                                return <Button key={index} onButtonClicked={() => this.onSelect(material)} label={material} />
                            }

                        )
                        }
                    </div>

                    <div>
                        {selectedMaterial &&
                            <>
                                <Button label="Up" onButtonClicked={() => this.increasePriority(selectedMaterial)} />
                                <Button label="Down" onButtonClicked={() => this.decreasePriority(selectedMaterial)} />
                            </>
                        }
                    </div>

                </div>
            </Dialog>)

    }

    async decreasePriority(selectedMaterial: Material): Promise<void> {

        if (!this.state.priority) {
            return
        }

        let currentPriority = this.state.priority.findIndex((e) => e === selectedMaterial)

        if (currentPriority >= 28) {
            return
        }

        if (isTool(selectedMaterial)) {
            const updatedPriority = Object.assign([], this.state.priority)

            for (const tool of TOOLS) {
                await setTransportPriorityForMaterial(this.props.gameId, this.props.playerId, tool, currentPriority + 1)

                delete updatedPriority[currentPriority]

                updatedPriority.splice(currentPriority + 2, 0, tool)

                currentPriority = currentPriority + 1
            }

            this.setState({ priority: updatedPriority })

        } else {

            await setTransportPriorityForMaterial(this.props.gameId, this.props.playerId, selectedMaterial, currentPriority + 1)

            const updatedPriority = Object.assign([], this.state.priority)

            delete updatedPriority[currentPriority]

            updatedPriority.splice(currentPriority + 2, 0, selectedMaterial)

            this.setState({ priority: updatedPriority })
        }
    }

    async increasePriority(selectedMaterial: Material): Promise<void> {

        if (!this.state.priority) {
            return
        }

        let currentPriority = this.state.priority.findIndex((e) => e === selectedMaterial)

        if (currentPriority <= 0) {
            return
        }

        if (isTool(selectedMaterial)) {
            const updatedPriority = Object.assign([], this.state.priority)

            for (const tool of TOOLS) {
                console.log("Changing priority for " + tool)

                await setTransportPriorityForMaterial(this.props.gameId, this.props.playerId, tool, currentPriority - 1)

                delete updatedPriority[currentPriority]

                updatedPriority.splice(currentPriority - 1, 0, tool)

                currentPriority = currentPriority + 1
            }

            this.setState({ priority: updatedPriority })

        } else {

            await setTransportPriorityForMaterial(this.props.gameId, this.props.playerId, selectedMaterial, currentPriority - 1)

            const updatedPriority = Object.assign([], this.state.priority)

            delete updatedPriority[currentPriority]

            updatedPriority.splice(currentPriority - 1, 0, selectedMaterial)

            this.setState({ priority: updatedPriority })
        }
    }
}

export { SetTransportPriority }
