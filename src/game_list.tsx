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
import { GameId, GameInformation } from './api/types'

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
    onJoinGame: ((gameId: GameId) => void)
}

const GameList = ({ onJoinGame }: GameListProps) => {
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
            {<div className='games-list'>
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
                        {games && games.map(game => (
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
                                                    <MenuItem onClick={() => onJoinGame(game.id)} >Join</MenuItem>
                                                }
                                                {game.players.filter(player => player.type === 'HUMAN')
                                                    .map(player => <MenuItem
                                                        key={game.id}
                                                        onClick={() => window.location.href = "?gameId=" + game.id + "&playerId=" + player.id}
                                                    >Play as {player.name}</MenuItem>)}
                                            </MenuList>
                                        </MenuPopover>
                                    </Menu>
                                </TableCell>
                            </TableRow>
                        ))}

                        {!games &&
                            <>
                                {[0, 1, 2, 3, 4].map(i => <TableRow key={i}>
                                    <TableCell><Skeleton><SkeletonItem /></Skeleton></TableCell>
                                    <TableCell><Skeleton><SkeletonItem /></Skeleton></TableCell>
                                    <TableCell><Skeleton><SkeletonItem /></Skeleton></TableCell>
                                    <TableCell><Skeleton><SkeletonItem /></Skeleton></TableCell>
                                    <TableCell><Skeleton><SkeletonItem /></Skeleton></TableCell>
                                    <TableCell><Skeleton><SkeletonItem /></Skeleton></TableCell>
                                </TableRow>)}
                            </>
                        }

                    </TableBody>
                </Table>
            </div>
            }
        </>
    )
}

export default GameList
