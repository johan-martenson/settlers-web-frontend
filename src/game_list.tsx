import React, { useEffect, useState } from 'react'
import { getGames } from './api/rest-api'
import { MenuTrigger, MenuPopover, Menu, MenuList, MenuItem, MenuButton, Skeleton, SkeletonItem } from "@fluentui/react-components"
import {
    TableBody,
    TableCell,
    TableRow,
    Table,
    TableHeader,
    TableHeaderCell
} from "@fluentui/react-components"
import './game_list.css'
import { GameInformation } from './api/types'

const statusToText = {
    STARTED: 'Started',
    NOT_STARTED: 'Not started'
}

const columns = [
    { columnKey: 'name', label: 'Name' },
    { columnKey: 'map', label: 'Map' },
    { columnKey: 'numberPlayers', label: 'Players' },
    { columnKey: 'maxNumberPlayers', label: 'Maximum players' },
    { columnKey: 'status', label: 'Status' },
    { columnKey: 'actions', label: 'Actions' }
]

interface GameListProps {
    onJoinGame: ((game: GameInformation) => void)
    onObserveGame: ((game: GameInformation) => void)
}

const GameList = ({ onJoinGame, onObserveGame }: GameListProps) => {
    const [games, setGames] = useState<GameInformation[] | undefined>()

    useEffect(
        () => {
            (async () => {
                while (!games) {
                    try {
                        const updatedGames = await getGames()
                        setGames(updatedGames)
                    } catch (error) {
                        await new Promise(r => setTimeout(r, 2000))
                    }
                }
            })().then()

            return () => { }
        }, [])

    return (
        <>
            {games &&
                <div className='games-list'>
                    <Table size="small">
                        <TableHeader>
                            <TableRow>
                                {columns.map(column => (
                                    <TableHeaderCell key={column.columnKey}>
                                        {column.label}
                                    </TableHeaderCell>
                                ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {games.map(game => (
                                <TableRow key={game.id}>
                                    <TableCell>{game.name}</TableCell>
                                    <TableCell>{(game?.map) ? game.map.title : '-'}</TableCell>
                                    <TableCell>{game.players.length}</TableCell>
                                    <TableCell>{(game?.map) ? game.map.maxPlayers : '-'}</TableCell>
                                    <TableCell>{statusToText[game.status]}</TableCell>
                                    <TableCell>
                                        <Menu>
                                            <MenuTrigger disableButtonEnhancement>
                                                <MenuButton>Actions</MenuButton>
                                            </MenuTrigger>
                                            <MenuPopover>
                                                <MenuList>
                                                    <MenuItem onClick={() => console.log("Clicked view " + game.id)}>View</MenuItem>
                                                    {game.status === 'NOT_STARTED' && game.othersCanJoin &&
                                                        <MenuItem onClick={() => onJoinGame(game)} >Join</MenuItem>
                                                    }
                                                    {game.status === 'STARTED' &&
                                                        <MenuItem onClick={() => onObserveGame(game)} >Spectate</MenuItem>
                                                    }
                                                </MenuList>
                                            </MenuPopover>
                                        </Menu>
                                    </TableCell>
                                </TableRow>
                            ))}

                        </TableBody>
                    </Table>
                </div>
            }

            {!games &&
                <Skeleton className="loader-skeleton">
                    <SkeletonItem />
                </Skeleton>
            }
        </>
    )
}

export default GameList
