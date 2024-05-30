import React, { useEffect, useState } from "react"
import { FlagDebugInfo, GameInformation, Point, PointInformation } from "../api/types"
import { monitor } from "../api/ws-api"
import './debug.css'
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel } from "@fluentui/react-components"
import { VEGETATION } from "./translate"
import { getGameInformation } from "../api/rest-api"
import { Window } from '../components/dialog'

function Value({ children }: { children?: React.ReactNode }) {
    return (
        <div className="value"><span>{children}</span></div>
    )
}

type DebugProps = {
    point: Point
    onClose: (() => void)
}

function Debug({ point, onClose }: DebugProps) {
    const [flagInformation, setFlagInformation] = useState<FlagDebugInfo>()
    const [pointInformation, setPointInformation] = useState<PointInformation>()
    const [gameInformation, setGameInformation] = useState<GameInformation>()

    useEffect(
        () => {
            (async () => {
                console.log(point)
                const pointInformation = await monitor.getInformationOnPoint(point)

                setPointInformation(pointInformation)

                const gameInformation = await getGameInformation(monitor.gameId ?? "0")

                console.log(gameInformation)

                setGameInformation(gameInformation)

                if (pointInformation?.is === 'flag') {
                    const flagInformation = await monitor.getFlagDebugInfo(pointInformation.flagId)

                    console.log(flagInformation)

                    setFlagInformation(flagInformation)
                }
            })().then()
        }, [point.x, point.y, point]
    )

    const vegetationBelow = monitor.allTiles.get(point)?.below
    const vegetationDownRight = monitor.allTiles.get(point)?.downRight

    return (<Window className="debug-window" heading='Debug' onClose={onClose}>
        <Accordion multiple>

            <AccordionItem value="1">
                <AccordionHeader>Game</AccordionHeader>
                <AccordionPanel>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div>Game id: <Value>{monitor.gameId}</Value></div>
                    </div>
                </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="2">
                <AccordionHeader>Map</AccordionHeader>
                <AccordionPanel>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div>Id: <Value>{gameInformation?.map.id}</Value></div>
                        <div>Name: <Value>{gameInformation?.map.title}</Value></div>
                        <div>Author: <Value>{gameInformation?.map.author}</Value></div>
                        <div>Size: <Value>{gameInformation?.map.width}</Value>x<Value>{gameInformation?.map.height}</Value></div>
                        <div>Max players: <Value>{gameInformation?.map.maxPlayers}</Value></div>
                    </div>

                </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="3">
                <AccordionHeader>Players</AccordionHeader>
                <AccordionPanel>
                    <div className="players-list">
                        {Array.from(
                            monitor.players,
                            ([playerId, playerInformation]) => <div key={playerId}>
                                Name: <Value>{playerInformation.name}</Value>, nation: <Value>{playerInformation.nation}</Value>, id: <Value>{playerInformation.id}</Value>,
                                <a href={`/?gameId=${monitor.gameId}&playerId=${playerId}`} >Play as</a>
                            </div>)
                        }
                    </div>

                </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="4">
                <AccordionHeader>Point</AccordionHeader>
                <AccordionPanel>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div>Point: <Value>{point.x}, {point.y}</Value></div>
                        <div>Tile below: <Value>{monitor.allTiles.get(point)?.below}</Value> (<Value>{vegetationBelow !== undefined && VEGETATION.get(vegetationBelow)}</Value>)</div>
                        <div>Tile down-right: <Value>{monitor.allTiles.get(point)?.downRight}</Value> (<Value>{vegetationDownRight !== undefined && VEGETATION.get(vegetationDownRight)}</Value>)</div>

                        {flagInformation &&
                            <>
                                <h2>Flag</h2>
                                {flagInformation.cargos.map(
                                    (cargo, index) => <div key={index}>
                                        <Value>{cargo.material}</Value> to <Value>{cargo.targetType}</Value> at <Value>({cargo.target.x}, {cargo.target.y})</Value>
                                    </div>
                                )}
                            </>
                        }

                        {pointInformation?.is === 'building' && <div>Building: <Value>{JSON.stringify(monitor.houses.get(pointInformation.buildingId), null, 2)}</Value></div>}

                        <div>Can build: {pointInformation?.canBuild.map((build, index) => <Value key={index}>{build}</Value>)}</div>
                    </div>
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    </Window>)
}

export { Debug }