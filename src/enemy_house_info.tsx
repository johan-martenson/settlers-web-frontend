import React, { Component } from 'react'
import { attackBuilding, GameId, getHouseInformationWithAttackPossibility, HouseInformation, houseIsOccupied, isMilitaryBuilding, PlayerId } from './api'
import Button from './button'
import { Dialog } from './dialog'
import houseImageMap from './images'

interface EnemyHouseInfoProps {
    house: HouseInformation
    gameId: GameId
    playerId: PlayerId
    closeDialog: (() => void)
}

interface AttackInformation {
    maxAttackers: number
}

interface EnemyHouseInfoState {
    attackPossible?: AttackInformation
}

class EnemyHouseInfo extends Component<EnemyHouseInfoProps, EnemyHouseInfoState> {

    constructor(props: EnemyHouseInfoProps) {
        super(props)

        this.state = {}
    }

    async componentDidMount() {
        const house = await getHouseInformationWithAttackPossibility(this.props.house.id, this.props.gameId, this.props.house.playerId, this.props.playerId)

        if (house.maxAttackers && house.maxAttackers > 0) {
            this.setState({ attackPossible: { maxAttackers: house.maxAttackers } })
        }

    }

    render() {

        return (

            <Dialog heading={this.props.house.type} floating onCloseDialog={this.props.closeDialog}>

                {this.props.house.type}
                <img src={houseImageMap.get(this.props.house.type)} alt="Enemy building" />

                {isMilitaryBuilding(this.props.house) && houseIsOccupied(this.props.house) &&
                    <>
                        {this.state.attackPossible &&
                            < Button label="Attack"
                                onButtonClicked={
                                    async () => {

                                        //FIXME: make it possible to choose the number of attackers
                                        await attackBuilding(this.props.house, 10, this.props.gameId, this.props.playerId)

                                        this.props.closeDialog()
                                    }
                                }
                            />
                        }

                        {!this.state.attackPossible &&
                            <div>No attack possible</div>
                        }
                    </>
                }

            </Dialog>
        )
    }
}

export default EnemyHouseInfo
