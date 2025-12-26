import * as React from 'react'
import {
    Table,
    TableHeader,
    TableHeaderCell,
    TableBody,
    TableRow,
    TableCell,
    TableCellLayout,
    TableColumnDefinition,
    createTableColumn,
} from '@fluentui/react-components'
import { Text } from '@fluentui/react-components'
import { HouseInformation, Point } from '../../api/types'
import { Value } from '../../windows/debug/debug'

interface HouseTableProps {
    houses: HouseInformation[]
    goToPoint: (point: Point) => void
}

export const HouseTable: React.FC<HouseTableProps> = ({ houses, goToPoint }) => {
    const columns: TableColumnDefinition<HouseInformation>[] = [
        createTableColumn({
            columnId: 'id',
            renderHeaderCell: () => 'Id',
            renderCell: item => <Value>{item.id}</Value>,
        }),
        createTableColumn({
            columnId: 'player',
            renderHeaderCell: () => 'Player',
            renderCell: item => <Value>{item.playerId}</Value>,
        }),
        createTableColumn({
            columnId: 'type',
            renderHeaderCell: () => 'Type',
            renderCell: item => <Value>{item.type}</Value>,
        }),
        createTableColumn({
            columnId: 'state',
            renderHeaderCell: () => 'State',
            renderCell: item => <Value>{item.state}</Value>,
        }),
        createTableColumn({
            columnId: 'door',
            renderHeaderCell: () => 'Door',
            renderCell: item => <Value>{item.door}</Value>,
        }),
        createTableColumn({
            columnId: 'evacuated',
            renderHeaderCell: () => 'Evacuated',
            renderCell: item => <Value>{item.evacuated ? 'Yes' : 'No'}</Value>,
        }),
        createTableColumn({
            columnId: 'nation',
            renderHeaderCell: () => 'Nation',
            renderCell: item => <Value>{item.nation}</Value>,
        }),
        createTableColumn({
            columnId: 'productivity',
            renderHeaderCell: () => 'Productivity',
            renderCell: item =>
                item.productivity !== undefined ? (
                    <Value>{`${Math.round(item.productivity)}%`}</Value>
                ) : (
                    <Text>-</Text>
                ),
        }),
        createTableColumn({
            columnId: 'resources',
            renderHeaderCell: () => 'Resources',
            renderCell: item => (
                <Text>
                    {item.type === 'Headquarter'
                        ? '...'
                        : Object.entries(item.resources)
                            .map(([mat, { has, canHold }]) => <><Value>{mat}</Value>: <Value>{has}/{canHold}</Value></>)
                    }
                </Text>
            ),
        }),
    ]

    return (
        <Table aria-label="House Information Table">
            <TableHeader>
                <TableRow>
                    {columns.map(column => (
                        <TableHeaderCell key={column.columnId}>
                            {column.renderHeaderCell()}
                        </TableHeaderCell>
                    ))}
                </TableRow>
            </TableHeader>

            <TableBody>
                {houses.map(house => (
                    <TableRow key={house.id} onClick={() => goToPoint(house)}>
                        {columns.map(column => (
                            <TableCell key={column.columnId}>
                                <TableCellLayout>{column.renderCell(house)}</TableCellLayout>
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
