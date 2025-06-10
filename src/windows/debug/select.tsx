import * as React from "react"
import {
    TagPicker,
    TagPickerList,
    TagPickerInput,
    TagPickerControl,
    TagPickerProps,
    TagPickerOption,
    TagPickerGroup,
} from "@fluentui/react-components"
import { Tag, Avatar, Field } from "@fluentui/react-components"

type SelectorProps<T> = {
    items: T[]
    label: string
    onSelectedItems: (items: T[]) => void
}

function Selector<T extends string>({ items, label, onSelectedItems }: SelectorProps<T>) {
    const [selectedItems, setSelectedItems] = React.useState<string[]>([])

    const onOptionSelect: TagPickerProps["onOptionSelect"] = (e, data) => {
        setSelectedItems(data.selectedOptions)

        onSelectedItems(data.selectedOptions as T[])
    }

    const availableBuildings = Array.from(items).filter(
        (b) => !selectedItems.includes(b)
    )

    return (
        <Field label={label} style={{ maxWidth: 400 }}>
            <TagPicker
                onOptionSelect={onOptionSelect}
                selectedOptions={selectedItems}
            >
                <TagPickerControl>
                    <TagPickerGroup>
                        {selectedItems.map((building) => (
                            <Tag
                                key={building}
                                shape="rounded"
                                media={<Avatar aria-hidden name={building} color="colorful" />}
                                value={building}
                            >
                                {building}
                            </Tag>
                        ))}
                    </TagPickerGroup>
                    <TagPickerInput aria-label="Select Buildings" />
                </TagPickerControl>
                <TagPickerList>
                    {availableBuildings.length > 0
                        ? availableBuildings.map((building) => (
                            <TagPickerOption
                                key={building}
                                value={building}
                                secondaryContent="Available Building"
                                media={
                                    <Avatar
                                        shape="square"
                                        aria-hidden
                                        name={building}
                                        color="colorful"
                                    />
                                }
                            >
                                {building}
                            </TagPickerOption>
                        ))
                        : "No buildings available"}
                </TagPickerList>
            </TagPicker>
        </Field>
    )
}

export default Selector