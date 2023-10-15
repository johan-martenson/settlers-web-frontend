import React, { Component } from 'react'
import { GameInformation, getGames } from './api'
import { MenuTrigger, MenuPopover, Menu, MenuList, MenuItem, MenuButton } from "@fluentui/react-components";
import {
    TableBody,
    TableCell,
    TableRow,
    Table,
    TableHeader,
    TableHeaderCell
} from "@fluentui/react-components";
import './game_list.css'

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
    hideStarted: boolean
    onJoinGame: ((game: GameInformation) => void)
    onObserveGame: ((game: GameInformation) => void)
}

interface GameListState {
    games?: GameInformation[]
}

class GameList extends Component<GameListProps, GameListState> {

    constructor(props: GameListProps) {
        super(props)

        this.state = {}
    }

    async componentDidMount(): Promise<void> {

        const games = await getGames()

        this.setState(
            {
                games: games,
            }
        )
    }

    render(): JSX.Element {
        return (
            <>
                {this.state.games &&
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
                                {this.state.games?.map(game => (
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
                                                        {game.status === 'NOT_STARTED' &&
                                                            <MenuItem onClick={() => this.props.onJoinGame(game)} >Join</MenuItem>
                                                        }
                                                        {game.status === 'STARTED' &&
                                                            <MenuItem onClick={() => this.props.onObserveGame(game)} >Spectate</MenuItem>
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
                {
                    !this.state.games &&
                    function () { return (<div>Loading...</div>) }()
                }
            </>
        )
    }
}

export default GameList
