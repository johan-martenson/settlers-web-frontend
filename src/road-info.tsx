import React from 'react'
import { Button } from "@fluentui/react-components"
import { UiIcon } from "./icon"
import { RoadId } from "./api/types"
import { monitor } from "./api/ws-api"
import './road-info.css'
import { Window } from './components/dialog'

type RoadInfoProps = {
    roadId: RoadId

    onRaise: (() => void)
    onClose: (() => void)
}

const RoadInfo = ({ roadId, onClose, onRaise }: RoadInfoProps) => {
    return (
        <Window className="road-info" heading='Road' onClose={onClose} onRaise={onRaise}>
            <div className="button-row">
                <Button onClick={() => {
                    monitor.removeRoad(roadId)

                    onClose()
                }}>
                    <UiIcon type="SCISSORS" />
                </Button>
            </div>
        </Window>
    )
}

export { RoadInfo }