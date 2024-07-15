import React, { useEffect, useState } from 'react'
import { GameInformation, MapInformation } from './api/types'
import { MapList } from './map_list'
import './map_selection.css'
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Field, InputOnChangeData, SearchBox, SearchBoxChangeEvent, Slider, SliderOnChangeData, Subtitle1 } from '@fluentui/react-components'
import MapInformationCard from './map_information_card'
import { GameListener, monitor } from './api/ws-api'

interface MapSelectionProps {
    minPlayers: number
    onMapSelected: ((map: MapInformation) => void)
}

const MapSelection = ({ minPlayers, onMapSelected }: MapSelectionProps) => {
    const [map, setMap] = useState<MapInformation | undefined>()
    const [filterTitle, setSearchTitle] = useState<string>("")
    const [filterAuthor, setSearchAuthor] = useState<string>("")
    const [filterMinPlayers, setFilterMinPlayers] = useState<number>(1)
    const [filterMaxPlayers, setFilterMaxPlayers] = useState<number>(8)

    useEffect(
        () => {
            function gameInformationChanged(gameInformation: GameInformation) {
                setMap(gameInformation.map)
            }

            const listener: GameListener = {
                onGameInformationChanged: gameInformationChanged
            }

            monitor.addGameStateListener(listener)

            return () => monitor.removeGameStateListener(listener)
        }, [])

    return (
        <div className="select-map">
            <Subtitle1 as="h4" block>Map</Subtitle1>

            {map && <MapInformationCard map={map} />}

            <Accordion collapsible>
                <AccordionItem value="1">
                    <AccordionHeader>Filter</AccordionHeader>
                    <AccordionPanel>
                        <div>
                            <SearchBox
                                contentBefore={"title: "}
                                value={filterTitle}
                                onChange={(event: SearchBoxChangeEvent, data: InputOnChangeData) => setSearchTitle(data.value)}
                            />
                            <SearchBox
                                contentBefore={"author: "}
                                value={filterAuthor}
                                onChange={(event: SearchBoxChangeEvent, data: InputOnChangeData) => setSearchAuthor(data.value)}
                            />
                            <Field label={`Min players (${filterMinPlayers})`}>
                                <Slider
                                    step={1}
                                    min={1}
                                    max={8}
                                    value={filterMinPlayers}
                                    onChange={
                                        (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                            if (data.value <= filterMaxPlayers) {
                                                setFilterMinPlayers(data.value)
                                            }
                                        }
                                    }
                                />
                            </Field>
                            <Field label={`Max players (${filterMaxPlayers})`}>
                                <Slider
                                    step={1}
                                    min={1}
                                    max={8}
                                    value={filterMaxPlayers}
                                    onChange={
                                        (event: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
                                            if (data.value >= filterMinPlayers) {
                                                setFilterMaxPlayers(data.value)
                                            }
                                        }
                                    }
                                />
                            </Field>
                        </div>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>

            <MapList
                onMapSelected={
                    (selectedMap) => {
                        setMap(selectedMap)
                        onMapSelected(selectedMap)
                    }
                }

                minPlayers={minPlayers}
                filterTitle={filterTitle}
                filterAuthor={filterAuthor}
                filterMinPlayers={filterMinPlayers}
                filterMaxPlayers={filterMaxPlayers}
                defaultSelect
            />
        </div>
    )
}

export default MapSelection
